export function persistenceErrorResponse(error: unknown): Response {
  const requestId = crypto.randomUUID();
  const duplicate =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000;
  return Response.json(
    {
      error: {
        code: duplicate ? "OWNERSHIP_CONFLICT" : "PERSISTENCE_UNAVAILABLE",
        message: duplicate
          ? "That record is not available to this account."
          : "Saved data is temporarily unavailable.",
        requestId,
      },
    },
    { status: duplicate ? 403 : 503 },
  );
}
