import "server-only";
import type { Collection, Filter } from "mongodb";
import { getDatabase } from "./mongodb";
import {
  COLLECTIONS,
  PERSISTENCE_LIMITS,
  boundText,
  boundedArray,
  isSafeIdentifier,
  type Difficulty,
  type IncidentSessionDocument,
  type IncidentStatus,
} from "./model";

const STATUS_VALUES = new Set<IncidentStatus>([
  "active",
  "paused",
  "completed",
  "abandoned",
]);
const DIFFICULTY_VALUES = new Set<Difficulty>([
  "beginner",
  "intermediate",
  "advanced",
]);
const SORTS = {
  newest: { createdAt: -1 as const, _id: -1 as const },
  oldest: { createdAt: 1 as const, _id: 1 as const },
  score_high: { score: -1 as const, createdAt: -1 as const },
  score_low: { score: 1 as const, createdAt: -1 as const },
  title: { scenarioTitle: 1 as const, createdAt: -1 as const },
};

export type IncidentListInput = {
  search?: string;
  scenario?: string;
  status?: string;
  difficulty?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export type IncidentListResult = {
  items: IncidentSessionDocument[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function normalizeIncidentListInput(input: IncidentListInput) {
  const page = Math.max(1, Math.min(10_000, Math.floor(input.page ?? 1)));
  const pageSize = Math.max(
    1,
    Math.min(
      PERSISTENCE_LIMITS.maximumPageSize,
      Math.floor(input.pageSize ?? PERSISTENCE_LIMITS.pageSize),
    ),
  );
  const status = STATUS_VALUES.has(input.status as IncidentStatus)
    ? (input.status as IncidentStatus)
    : undefined;
  const difficulty = DIFFICULTY_VALUES.has(input.difficulty as Difficulty)
    ? (input.difficulty as Difficulty)
    : undefined;
  const sort =
    input.sort && input.sort in SORTS
      ? (input.sort as keyof typeof SORTS)
      : "newest";
  return {
    search: boundText(input.search, 100),
    scenario: boundText(input.scenario, 100),
    status,
    difficulty,
    sort,
    page,
    pageSize,
  };
}

function escapedSearch(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export function ownedIncidentFilter(
  ownerId: string,
  input: ReturnType<typeof normalizeIncidentListInput>,
): Filter<IncidentSessionDocument> {
  const filter: Filter<IncidentSessionDocument> = { ownerId };
  if (input.search) filter.scenarioTitle = escapedSearch(input.search);
  if (input.scenario) filter.scenarioId = input.scenario;
  if (input.status) filter.status = input.status;
  if (input.difficulty) filter.difficulty = input.difficulty;
  return filter;
}

async function collection(): Promise<Collection<IncidentSessionDocument>> {
  return (await getDatabase()).collection(COLLECTIONS.incidentSessions);
}

export async function listOwnedIncidents(
  ownerId: string,
  rawInput: IncidentListInput = {},
): Promise<IncidentListResult> {
  const input = normalizeIncidentListInput(rawInput);
  const filter = ownedIncidentFilter(ownerId, input);
  const source = await collection();
  const [items, total] = await Promise.all([
    source
      .find(filter)
      .sort(SORTS[input.sort])
      .skip((input.page - 1) * input.pageSize)
      .limit(input.pageSize)
      .toArray(),
    source.countDocuments(filter),
  ]);
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
  };
}

export async function getOwnedIncident(ownerId: string, id: string) {
  if (!isSafeIdentifier(id)) return null;
  return (await collection()).findOne({ _id: id, ownerId });
}

export type IncidentSnapshotInput = {
  sessionId: unknown;
  scenarioId: unknown;
  scenarioSlug: unknown;
  scenarioTitle: unknown;
  difficulty: unknown;
  status: unknown;
  scenarioVersion: unknown;
  engineVersion: unknown;
  seed: unknown;
  simulationTimeMs: unknown;
  score?: unknown;
  summaryTelemetry?: unknown;
  importantTimeline?: unknown;
  actions?: unknown;
  startedAt?: unknown;
  completedAt?: unknown;
};

export function sanitizeIncidentSnapshot(
  ownerId: string,
  input: IncidentSnapshotInput,
) {
  const id = input.sessionId;
  if (!isSafeIdentifier(id)) throw new Error("Invalid session ID");
  const status = STATUS_VALUES.has(input.status as IncidentStatus)
    ? (input.status as IncidentStatus)
    : "active";
  const difficulty = DIFFICULTY_VALUES.has(input.difficulty as Difficulty)
    ? (input.difficulty as Difficulty)
    : "intermediate";
  const now = new Date();
  const rawSeries = boundedArray<Record<string, unknown>>(
    input.summaryTelemetry,
    PERSISTENCE_LIMITS.telemetrySeries,
  );
  const summaryTelemetry = rawSeries.map((series) => ({
    metric: boundText(series.metric, 100),
    service: boundText(series.service, 100),
    points: boundedArray<Record<string, unknown>>(
      series.points,
      PERSISTENCE_LIMITS.telemetryPointsPerSeries,
    ).map((point) => ({
      timestamp: Number.isFinite(point.timestamp) ? Number(point.timestamp) : 0,
      value: Number.isFinite(point.value) ? Number(point.value) : 0,
    })),
  }));
  return {
    _id: id,
    ownerId,
    scenarioId: boundText(input.scenarioId, 100),
    scenarioSlug: boundText(input.scenarioSlug, 100),
    scenarioTitle: boundText(input.scenarioTitle, PERSISTENCE_LIMITS.title),
    difficulty,
    status,
    scenarioVersion: boundText(input.scenarioVersion, 40),
    engineVersion: boundText(input.engineVersion, 40),
    seed: boundText(input.seed, 128),
    simulationTimeMs: Math.max(
      0,
      Math.min(Number(input.simulationTimeMs) || 0, 31_536_000_000),
    ),
    ...(Number.isFinite(input.score)
      ? { score: Math.max(0, Math.min(100, Number(input.score))) }
      : {}),
    startedAt: validDate(input.startedAt) ?? now,
    updatedAt: now,
    ...(status === "completed"
      ? { completedAt: validDate(input.completedAt) ?? now }
      : {}),
    ...(status !== "completed"
      ? { expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000) }
      : {}),
    summaryTelemetry,
    importantTimeline: boundedArray(
      input.importantTimeline,
      PERSISTENCE_LIMITS.timelineEvents,
    ),
    actions: boundedArray(input.actions, PERSISTENCE_LIMITS.actions),
  } satisfies Omit<IncidentSessionDocument, "createdAt">;
}

function validDate(value: unknown): Date | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    !(value instanceof Date)
  )
    return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export async function saveOwnedIncident(
  ownerId: string,
  input: IncidentSnapshotInput,
) {
  const snapshot = sanitizeIncidentSnapshot(ownerId, input);
  const { _id, ownerId: immutableOwnerId, ...updates } = snapshot;
  const result = await (
    await collection()
  ).updateOne(
    { _id, ownerId: immutableOwnerId },
    {
      $set: updates,
      $setOnInsert: { _id, ownerId: immutableOwnerId, createdAt: new Date() },
    },
    { upsert: true },
  );
  return { id: _id, created: result.upsertedCount === 1 };
}

export async function saveOwnedIncidentBundle(
  ownerId: string,
  input: IncidentSnapshotInput & { evidence?: unknown; hypotheses?: unknown },
) {
  const result = await saveOwnedIncident(ownerId, input);
  const db = await getDatabase();
  const now = new Date();
  const evidence = boundedArray<Record<string, unknown>>(
    input.evidence,
    PERSISTENCE_LIMITS.evidence,
  )
    .map((item) => ({
      ownerId,
      incidentSessionId: result.id,
      evidenceId: boundText(item.id, 128),
      source: boundText(item.source, 40),
      timestamp: boundText(item.timestamp, 80),
      service: boundText(item.service, 100),
      summary: boundText(item.summary, 1_000),
      fields:
        typeof item.fields === "object" && item.fields !== null
          ? item.fields
          : {},
      annotation: boundText(item.annotation, PERSISTENCE_LIMITS.note),
      hypothesisIds: boundedArray<string>(item.hypothesisIds, 50).map((id) =>
        boundText(id, 128),
      ),
      createdAt: now,
    }))
    .filter((item) => item.evidenceId);
  const hypotheses = boundedArray<Record<string, unknown>>(
    input.hypotheses,
    PERSISTENCE_LIMITS.hypotheses,
  )
    .map((item) => ({
      ownerId,
      incidentSessionId: result.id,
      hypothesisId: boundText(item.id, 128),
      title: boundText(item.title, PERSISTENCE_LIMITS.title),
      notes: boundText(item.notes, PERSISTENCE_LIMITS.note),
      status: ["supported", "contradicted", "unresolved"].includes(
        String(item.status),
      )
        ? item.status
        : "unresolved",
      evidenceIds: boundedArray<string>(
        item.evidenceIds,
        PERSISTENCE_LIMITS.evidence,
      ).map((id) => boundText(id, 128)),
      createdAt: now,
    }))
    .filter((item) => item.hypothesisId);
  await Promise.all([
    db
      .collection(COLLECTIONS.evidenceItems)
      .deleteMany({ ownerId, incidentSessionId: result.id }),
    db
      .collection(COLLECTIONS.hypotheses)
      .deleteMany({ ownerId, incidentSessionId: result.id }),
  ]);
  if (evidence.length)
    await db
      .collection(COLLECTIONS.evidenceItems)
      .insertMany(evidence, { ordered: false });
  if (hypotheses.length)
    await db
      .collection(COLLECTIONS.hypotheses)
      .insertMany(hypotheses, { ordered: false });
  return result;
}

export async function deleteOwnedIncident(
  ownerId: string,
  id: string,
): Promise<boolean> {
  if (!isSafeIdentifier(id)) return false;
  const db = await getDatabase();
  const incident = await db
    .collection<IncidentSessionDocument>(COLLECTIONS.incidentSessions)
    .findOne({ _id: id, ownerId });
  if (!incident) return false;
  await Promise.all([
    db
      .collection(COLLECTIONS.incidentReports)
      .deleteMany({ ownerId, incidentSessionId: id }),
    db
      .collection(COLLECTIONS.evidenceItems)
      .deleteMany({ ownerId, incidentSessionId: id }),
    db
      .collection(COLLECTIONS.hypotheses)
      .deleteMany({ ownerId, incidentSessionId: id }),
    db
      .collection<IncidentSessionDocument>(COLLECTIONS.incidentSessions)
      .deleteOne({ _id: id, ownerId }),
  ]);
  return true;
}

export async function abandonOwnedIncident(
  ownerId: string,
  id: string,
): Promise<boolean> {
  if (!isSafeIdentifier(id)) return false;
  const now = new Date();
  const result = await (
    await collection()
  ).updateOne(
    { _id: id, ownerId, status: { $in: ["active", "paused"] } },
    {
      $set: {
        status: "abandoned",
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000),
      },
    },
  );
  return result.matchedCount === 1;
}
