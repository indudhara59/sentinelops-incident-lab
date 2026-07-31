import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
const databaseName = process.env.MONGODB_DB_NAME?.trim();

if (!uri?.startsWith("mongodb+srv://") || !databaseName) {
  throw new Error(
    "Set a TLS Atlas MONGODB_URI and MONGODB_DB_NAME before index setup.",
  );
}
if (process.env.NODE_ENV === "test" && !databaseName.endsWith("_test")) {
  throw new Error("Test index setup requires a database ending in _test.");
}

const client = new MongoClient(uri, {
  tls: true,
  maxPoolSize: 5,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 5_000,
  appName: "sentinelops-index-setup",
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const indexes = {
  users: [
    { key: { email: 1 }, name: "email_unique", unique: true, sparse: true },
  ],
  accounts: [
    {
      key: { provider: 1, providerAccountId: 1 },
      name: "provider_account_unique",
      unique: true,
    },
    { key: { userId: 1 }, name: "user_accounts" },
  ],
  sessions: [
    { key: { sessionToken: 1 }, name: "session_token_unique", unique: true },
    { key: { userId: 1 }, name: "user_sessions" },
    {
      key: { expires: 1 },
      name: "expired_auth_session_ttl",
      expireAfterSeconds: 0,
    },
  ],
  incident_sessions: [
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
  incident_reports: [
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
  evidence_items: [
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
  hypotheses: [
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
  saved_scenarios: [
    {
      key: { ownerId: 1, scenarioId: 1, version: -1 },
      name: "owner_scenario_version",
      unique: true,
    },
    {
      key: { ownerId: 1, archived: 1, updatedAt: -1 },
      name: "owner_archived_updated",
    },
  ],
  user_preferences: [
    { key: { ownerId: 1 }, name: "owner_unique", unique: true },
  ],
  learning_progress: [
    {
      key: { ownerId: 1, courseVersion: 1 },
      name: "owner_course_unique",
      unique: true,
    },
  ],
};

try {
  await client.connect();
  const database = client.db(databaseName);
  await database.command({ ping: 1 });
  for (const [name, definitions] of Object.entries(indexes)) {
    await database.collection(name).createIndexes(definitions);
  }
  process.stdout.write(
    `SentinelOps indexes ready in database ${databaseName}.\n`,
  );
} catch {
  throw new Error(
    "Atlas index setup failed. Connection details were withheld.",
  );
} finally {
  await client.close();
}
