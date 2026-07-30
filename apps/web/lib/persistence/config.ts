export type MongoConfiguration = {
  uri: string;
  databaseName: string;
};

export class PersistenceConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceConfigurationError";
  }
}

export function readMongoConfiguration(
  environment: Record<string, string | undefined> = process.env,
): MongoConfiguration | null {
  const uri = environment.MONGODB_URI?.trim();
  const databaseName = environment.MONGODB_DB_NAME?.trim();

  if (!uri && !databaseName) return null;
  if (!uri || !databaseName) {
    throw new PersistenceConfigurationError(
      "MONGODB_URI and MONGODB_DB_NAME must be configured together.",
    );
  }
  if (!uri.startsWith("mongodb+srv://")) {
    throw new PersistenceConfigurationError(
      "MONGODB_URI must use the TLS-enabled mongodb+srv Atlas scheme.",
    );
  }
  if (!/^[A-Za-z0-9_-]{1,63}$/.test(databaseName)) {
    throw new PersistenceConfigurationError("MONGODB_DB_NAME is invalid.");
  }
  if (environment.NODE_ENV === "test" && !databaseName.endsWith("_test")) {
    throw new PersistenceConfigurationError(
      "Test database names must end in _test.",
    );
  }
  return { uri, databaseName };
}

export function persistenceConfigured(
  environment: Record<string, string | undefined> = process.env,
): boolean {
  try {
    return readMongoConfiguration(environment) !== null;
  } catch {
    return false;
  }
}
