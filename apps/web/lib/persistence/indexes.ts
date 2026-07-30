import type { Db, IndexDescription } from "mongodb";
import { COLLECTIONS } from "./model";

export type IndexPlan = Record<string, IndexDescription[]>;

export function persistenceIndexPlan(): IndexPlan {
  return {
    [COLLECTIONS.users]: [
      { key: { email: 1 }, name: "email_unique", unique: true, sparse: true },
    ],
    [COLLECTIONS.accounts]: [
      {
        key: { provider: 1, providerAccountId: 1 },
        name: "provider_account_unique",
        unique: true,
      },
      { key: { userId: 1 }, name: "user_accounts" },
    ],
    [COLLECTIONS.sessions]: [
      { key: { sessionToken: 1 }, name: "session_token_unique", unique: true },
      { key: { userId: 1 }, name: "user_sessions" },
      {
        key: { expires: 1 },
        name: "expired_auth_session_ttl",
        expireAfterSeconds: 0,
      },
    ],
    [COLLECTIONS.incidentSessions]: [
      {
        key: { ownerId: 1, createdAt: -1, _id: -1 },
        name: "owner_created_cursor",
      },
      {
        key: { ownerId: 1, status: 1, updatedAt: -1 },
        name: "owner_status_updated",
      },
      {
        key: { ownerId: 1, scenarioId: 1, createdAt: -1 },
        name: "owner_scenario_created",
      },
      { key: { ownerId: 1, completedAt: -1 }, name: "owner_completed" },
      {
        key: { expiresAt: 1 },
        name: "temporary_session_ttl",
        expireAfterSeconds: 0,
        partialFilterExpression: {
          status: { $in: ["active", "paused", "abandoned"] },
        },
      },
    ],
    [COLLECTIONS.incidentReports]: [
      {
        key: { ownerId: 1, completedAt: -1, _id: -1 },
        name: "owner_completed_cursor",
      },
      {
        key: { ownerId: 1, incidentSessionId: 1 },
        name: "owner_incident",
        unique: true,
      },
    ],
    [COLLECTIONS.evidenceItems]: [
      {
        key: { ownerId: 1, incidentSessionId: 1, createdAt: 1 },
        name: "owner_incident_created",
      },
      {
        key: { ownerId: 1, incidentSessionId: 1, evidenceId: 1 },
        name: "owner_incident_evidence",
        unique: true,
      },
    ],
    [COLLECTIONS.hypotheses]: [
      {
        key: { ownerId: 1, incidentSessionId: 1, createdAt: 1 },
        name: "owner_incident_created",
      },
      {
        key: { ownerId: 1, incidentSessionId: 1, hypothesisId: 1 },
        name: "owner_incident_hypothesis",
        unique: true,
      },
    ],
    [COLLECTIONS.savedScenarios]: [
      {
        key: { ownerId: 1, scenarioId: 1 },
        name: "owner_scenario",
        unique: true,
      },
    ],
    [COLLECTIONS.userPreferences]: [
      { key: { ownerId: 1 }, name: "owner_unique", unique: true },
    ],
  };
}

export async function ensurePersistenceIndexes(db: Db): Promise<void> {
  for (const [collectionName, indexes] of Object.entries(
    persistenceIndexPlan(),
  )) {
    await db.collection(collectionName).createIndexes(indexes);
  }
}
