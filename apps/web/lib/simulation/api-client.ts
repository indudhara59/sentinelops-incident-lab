import { getPublicEnv } from "@/lib/env";
import type { EvidenceDefinition, HypothesisStatus } from "./types";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "polling"
  | "unavailable"
  | "local-fallback";

export interface ApiSnapshot {
  sessionId: string;
  version: number;
  sequence: number;
  expiresAt: string;
  [key: string]: unknown;
}

export interface SessionEnvelope {
  id: string;
  scenario_slug: string;
  seed: number;
  version: number;
  expires_at: string;
  snapshot: ApiSnapshot;
}

export interface StreamEnvelope {
  sequence: number;
  type: string;
  session_id: string;
  payload: { snapshot?: ApiSnapshot; [key: string]: unknown };
}

function apiUrl(path: string): string {
  return `${getPublicEnv().apiUrl}/api/v1${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      payload?.error?.message ?? `API request failed (${response.status}).`,
    );
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

export async function createApiSession(
  scenarioSlug: string,
): Promise<SessionEnvelope> {
  return request("/sessions", {
    method: "POST",
    body: JSON.stringify({ scenario_slug: scenarioSlug }),
  });
}

export async function fetchSnapshot(sessionId: string, after = 0) {
  return request<{
    snapshot: ApiSnapshot;
    events: StreamEnvelope[];
    latestSequence: number;
  }>(`/sessions/${encodeURIComponent(sessionId)}/snapshot?after=${after}`);
}

export async function sessionCommand(
  sessionId: string,
  command: "pause" | "resume" | "step",
  idempotencyKey: string,
) {
  return request<{ snapshot: ApiSnapshot }>(
    `/sessions/${encodeURIComponent(sessionId)}/${command}`,
    { method: "POST", headers: { "Idempotency-Key": idempotencyKey } },
  );
}

export async function sendAction(
  sessionId: string,
  action: string,
  targetId: string | undefined,
  idempotencyKey: string,
) {
  return request<{ snapshot: ApiSnapshot }>(
    `/sessions/${encodeURIComponent(sessionId)}/actions`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ action, target_id: targetId }),
    },
  );
}

export async function sendEvidence(
  sessionId: string,
  evidence: EvidenceDefinition,
  idempotencyKey: string,
) {
  return request<{ snapshot: ApiSnapshot }>(
    `/sessions/${encodeURIComponent(sessionId)}/evidence`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ ...evidence, availableAt: undefined }),
    },
  );
}

export async function sendHypothesis(
  sessionId: string,
  title: string,
  notes: string,
  idempotencyKey: string,
) {
  return request<{ snapshot: ApiSnapshot }>(
    `/sessions/${encodeURIComponent(sessionId)}/hypotheses`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ title, notes }),
    },
  );
}

export async function patchHypothesis(
  sessionId: string,
  hypothesisId: string,
  patch: { status?: HypothesisStatus; evidence_ids?: string[] },
  idempotencyKey: string,
) {
  return request<{ snapshot: ApiSnapshot }>(
    `/sessions/${encodeURIComponent(sessionId)}/hypotheses/${encodeURIComponent(hypothesisId)}`,
    {
      method: "PATCH",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(patch),
    },
  );
}

export function streamUrl(sessionId: string, after: number): string {
  const url = new URL(
    apiUrl(`/sessions/${encodeURIComponent(sessionId)}/stream`),
  );
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("after", String(after));
  return url.toString();
}
