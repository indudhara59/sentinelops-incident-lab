import "server-only";
import { MongoClient, ServerApiVersion, type Db } from "mongodb";
import { readMongoConfiguration } from "./config";

declare global {
  var sentinelOpsMongoClient: Promise<MongoClient> | undefined;
}

function createClient(): Promise<MongoClient> {
  const configuration = readMongoConfiguration();
  if (!configuration)
    return Promise.reject(new Error("Persistence unavailable"));

  const client = new MongoClient(configuration.uri, {
    tls: true,
    maxPoolSize: 20,
    minPoolSize: 0,
    maxIdleTimeMS: 60_000,
    waitQueueTimeoutMS: 5_000,
    serverSelectionTimeoutMS: 5_000,
    appName: "sentinelops-incident-lab",
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  return client.connect();
}

export function getMongoClient(): Promise<MongoClient> {
  globalThis.sentinelOpsMongoClient ??= createClient();
  return globalThis.sentinelOpsMongoClient;
}

export async function getDatabase(): Promise<Db> {
  const configuration = readMongoConfiguration();
  if (!configuration) throw new Error("Persistence unavailable");
  return (await getMongoClient()).db(configuration.databaseName);
}

export type DatabaseHealth =
  | { status: "available" }
  | { status: "unconfigured" | "unavailable"; message: string };

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    if (!readMongoConfiguration()) {
      return { status: "unconfigured", message: "Atlas is not configured." };
    }
    await (await getDatabase()).command({ ping: 1 });
    return { status: "available" };
  } catch {
    return {
      status: "unavailable",
      message: "Atlas could not be reached. Connection details were withheld.",
    };
  }
}
