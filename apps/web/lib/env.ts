const defaultApiUrl = "http://localhost:8000";

export function getPublicEnv() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? defaultApiUrl;
  try {
    return { apiUrl: new URL(apiUrl).toString().replace(/\/$/, "") };
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be a valid absolute URL");
  }
}
