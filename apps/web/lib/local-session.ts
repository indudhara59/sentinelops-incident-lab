const SESSION_ID_PATTERN = /^sim_[a-f0-9]{32}$/;

export interface LocalSessionRecord {
  scenarioSlug: string;
  createdAt: string;
  phase: 2 | 5;
  execution?: "api" | "local-fallback";
  streamToken?: string;
}

export function createLocalSessionId(
  cryptoSource: Pick<Crypto, "getRandomValues"> = globalThis.crypto,
): string {
  if (!cryptoSource?.getRandomValues)
    throw new Error("Secure local session IDs require Web Crypto.");
  const bytes = new Uint8Array(16);
  cryptoSource.getRandomValues(bytes);
  return `sim_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function isValidLocalSessionId(value: string): boolean {
  return SESSION_ID_PATTERN.test(value);
}

export function saveLocalSession(
  sessionId: string,
  scenarioSlug: string,
  storage: Pick<Storage, "setItem"> = sessionStorage,
  execution: LocalSessionRecord["execution"] = "local-fallback",
  streamToken?: string,
): void {
  if (!isValidLocalSessionId(sessionId))
    throw new Error("Invalid local session ID.");
  const record: LocalSessionRecord = {
    scenarioSlug,
    createdAt: new Date().toISOString(),
    phase: 5,
    execution,
    ...(execution === "api" && streamToken ? { streamToken } : {}),
  };
  storage.setItem(`sentinelops:${sessionId}`, JSON.stringify(record));
}

export function loadLocalSession(
  sessionId: string,
  storage: Pick<Storage, "getItem"> = sessionStorage,
): LocalSessionRecord | null {
  if (!isValidLocalSessionId(sessionId)) return null;
  try {
    const raw = storage.getItem(`sentinelops:${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalSessionRecord>;
    return typeof parsed.scenarioSlug === "string" &&
      typeof parsed.createdAt === "string" &&
      (parsed.phase === 2 || parsed.phase === 5)
      ? {
          ...(parsed as LocalSessionRecord),
          ...(typeof parsed.streamToken === "string" &&
          /^[A-Za-z0-9_-]{32,128}$/.test(parsed.streamToken)
            ? { streamToken: parsed.streamToken }
            : {}),
        }
      : null;
  } catch {
    return null;
  }
}
