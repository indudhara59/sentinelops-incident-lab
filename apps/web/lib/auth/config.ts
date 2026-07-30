export function safeRedirectTarget(
  value: unknown,
  fallback = "/dashboard",
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }
  try {
    const url = new URL(value, "https://sentinelops.invalid");
    return url.origin === "https://sentinelops.invalid"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

export function authenticationConfigured(
  environment: Record<string, string | undefined> = process.env,
) {
  return Boolean(
    environment.AUTH_SECRET &&
    environment.AUTH_GOOGLE_ID &&
    environment.AUTH_GOOGLE_SECRET &&
    environment.MONGODB_URI &&
    environment.MONGODB_DB_NAME,
  );
}
