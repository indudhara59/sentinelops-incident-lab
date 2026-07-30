import "server-only";
import { getDatabase } from "./mongodb";
import {
  COLLECTIONS,
  PERSISTENCE_LIMITS,
  boundText,
  type UserPreferencesDocument,
} from "./model";

export const DEFAULT_PREFERENCES = {
  displayName: "Incident responder",
  theme: "system",
  reducedMotion: false,
  defaultSimulationSpeed: 1,
  telemetryDensity: "comfortable",
} as const;

export type PreferenceInput = Partial<{
  displayName: unknown;
  theme: unknown;
  reducedMotion: unknown;
  defaultSimulationSpeed: unknown;
  telemetryDensity: unknown;
}>;

export function sanitizePreferences(input: PreferenceInput) {
  const theme = ["system", "light", "dark"].includes(String(input.theme))
    ? (input.theme as UserPreferencesDocument["theme"])
    : DEFAULT_PREFERENCES.theme;
  const speed = [0.5, 1, 2, 4].includes(Number(input.defaultSimulationSpeed))
    ? (Number(
        input.defaultSimulationSpeed,
      ) as UserPreferencesDocument["defaultSimulationSpeed"])
    : DEFAULT_PREFERENCES.defaultSimulationSpeed;
  const telemetryDensity = ["compact", "comfortable"].includes(
    String(input.telemetryDensity),
  )
    ? (input.telemetryDensity as UserPreferencesDocument["telemetryDensity"])
    : DEFAULT_PREFERENCES.telemetryDensity;
  return {
    displayName:
      boundText(input.displayName, 80) || DEFAULT_PREFERENCES.displayName,
    theme,
    reducedMotion: input.reducedMotion === true,
    defaultSimulationSpeed: speed,
    telemetryDensity,
  };
}

export async function getOwnedPreferences(ownerId: string) {
  return (await getDatabase())
    .collection<UserPreferencesDocument>(COLLECTIONS.userPreferences)
    .findOne({ ownerId });
}

export async function saveOwnedPreferences(
  ownerId: string,
  input: PreferenceInput,
) {
  const values = sanitizePreferences(input);
  const now = new Date();
  await (await getDatabase()).collection(COLLECTIONS.userPreferences).updateOne(
    { ownerId },
    {
      $set: { ...values, updatedAt: now },
      $setOnInsert: { ownerId, createdAt: now },
    },
    { upsert: true },
  );
  return values;
}

export function accountStorageSummary() {
  return {
    rawTelemetryStored: false,
    evidenceLimit: PERSISTENCE_LIMITS.evidence,
    hypothesisLimit: PERSISTENCE_LIMITS.hypotheses,
    timelineLimit: PERSISTENCE_LIMITS.timelineEvents,
    temporaryRetentionDays: 30,
  };
}
