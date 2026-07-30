import { describe, expect, it } from "vitest";
import {
  PersistenceConfigurationError,
  persistenceConfigured,
  readMongoConfiguration,
} from "./config";

describe("MongoDB Atlas configuration", () => {
  it("is optional when both variables are absent", () => {
    expect(readMongoConfiguration({})).toBeNull();
    expect(persistenceConfigured({})).toBe(false);
  });

  it("requires both variables and the Atlas SRV TLS scheme", () => {
    expect(() =>
      readMongoConfiguration({ MONGODB_URI: "mongodb+srv://example.invalid" }),
    ).toThrow(PersistenceConfigurationError);
    expect(() =>
      readMongoConfiguration({
        MONGODB_URI: "mongodb://localhost:27017",
        MONGODB_DB_NAME: "sentinelops",
      }),
    ).toThrow(/mongodb\+srv/);
  });

  it("isolates test databases", () => {
    expect(() =>
      readMongoConfiguration({
        NODE_ENV: "test",
        MONGODB_URI: "mongodb+srv://example.invalid",
        MONGODB_DB_NAME: "sentinelops",
      }),
    ).toThrow(/_test/);
    expect(
      readMongoConfiguration({
        NODE_ENV: "test",
        MONGODB_URI: "mongodb+srv://example.invalid",
        MONGODB_DB_NAME: "sentinelops_test",
      })?.databaseName,
    ).toBe("sentinelops_test");
  });
});
