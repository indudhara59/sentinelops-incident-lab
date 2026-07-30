import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/persistence/mongodb";
import { COLLECTIONS } from "@/lib/persistence/model";
import { validateScenarioDraft, type ScenarioDraft } from "./schema";

export type SavedScenarioDocument = {
  _id: string;
  ownerId: string;
  scenarioId: string;
  version: number;
  schemaVersion: "sentinelops-custom-scenario@1";
  title: string;
  difficulty: ScenarioDraft["difficulty"];
  draft: ScenarioDraft;
  contentHash: string;
  validationStatus: "valid" | "invalid";
  private: true;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const customId = /^custom_[a-f0-9]{32}$/;

export function isCustomScenarioId(value: string): boolean {
  return customId.test(value);
}

export function ownedScenarioFilter(ownerId: string, scenarioId: string) {
  return { ownerId, scenarioId } as const;
}

export function nextScenarioVersion(
  current: number | null,
  hasCompletedSessions: boolean,
) {
  return current === null ? 1 : current + (hasCompletedSessions ? 1 : 0);
}

function hashDraft(draft: ScenarioDraft) {
  return createHash("sha256").update(JSON.stringify(draft)).digest("hex");
}

export async function listOwnedCustomScenarios(ownerId: string) {
  return (await getDatabase())
    .collection<SavedScenarioDocument>(COLLECTIONS.savedScenarios)
    .aggregate<SavedScenarioDocument>([
      { $match: { ownerId } },
      { $sort: { version: -1 } },
      { $group: { _id: "$scenarioId", latest: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latest" } },
      { $sort: { updatedAt: -1 } },
      { $limit: 100 },
    ])
    .toArray();
}

export async function getOwnedCustomScenario(
  ownerId: string,
  scenarioId: string,
) {
  if (!isCustomScenarioId(scenarioId)) return null;
  return (await getDatabase())
    .collection<SavedScenarioDocument>(COLLECTIONS.savedScenarios)
    .find(ownedScenarioFilter(ownerId, scenarioId))
    .sort({ version: -1 })
    .limit(1)
    .next();
}

export async function saveOwnedCustomScenario(
  ownerId: string,
  rawDraft: ScenarioDraft,
  scenarioId?: string,
) {
  const issues = validateScenarioDraft(rawDraft);
  const id =
    scenarioId && isCustomScenarioId(scenarioId)
      ? scenarioId
      : `custom_${randomUUID().replaceAll("-", "")}`;
  const db = await getDatabase();
  const collection = db.collection<SavedScenarioDocument>(
    COLLECTIONS.savedScenarios,
  );
  const existing = await collection
    .find({ ownerId, scenarioId: id })
    .sort({ version: -1 })
    .limit(1)
    .next();
  if (scenarioId && !existing) throw new Error("SCENARIO_NOT_FOUND");
  const contentHash = hashDraft(rawDraft);
  if (existing?.contentHash === contentHash) return existing;
  const completed = existing
    ? await db.collection(COLLECTIONS.incidentSessions).countDocuments(
        {
          ownerId,
          scenarioId: id,
          scenarioVersion: String(existing.version),
          status: "completed",
        },
        { limit: 1 },
      )
    : 0;
  const version = nextScenarioVersion(existing?.version ?? null, completed > 0);
  const now = new Date();
  const document: SavedScenarioDocument = {
    _id: `${id}_v${version}`,
    ownerId,
    scenarioId: id,
    version,
    schemaVersion: "sentinelops-custom-scenario@1",
    title: rawDraft.title.slice(0, 160),
    difficulty: rawDraft.difficulty,
    draft: structuredClone(rawDraft),
    contentHash,
    validationStatus: issues.length ? "invalid" : "valid",
    private: true,
    archived: existing?.archived ?? false,
    createdAt: completed || !existing ? now : existing.createdAt,
    updatedAt: now,
  };
  await collection.replaceOne({ _id: document._id, ownerId }, document, {
    upsert: true,
  });
  return document;
}

export async function duplicateOwnedCustomScenario(
  ownerId: string,
  scenarioId: string,
) {
  const source = await getOwnedCustomScenario(ownerId, scenarioId);
  if (!source) return null;
  return saveOwnedCustomScenario(ownerId, {
    ...structuredClone(source.draft),
    title: `${source.title} (copy)`.slice(0, 160),
  });
}

export async function archiveOwnedCustomScenario(
  ownerId: string,
  scenarioId: string,
) {
  if (!isCustomScenarioId(scenarioId)) return false;
  const result = await (
    await getDatabase()
  )
    .collection(COLLECTIONS.savedScenarios)
    .updateMany(
      { ownerId, scenarioId },
      { $set: { archived: true, updatedAt: new Date() } },
    );
  return result.matchedCount > 0;
}
