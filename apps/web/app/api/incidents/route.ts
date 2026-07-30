import { authenticatedOwnerId } from "@/lib/auth/owner";
import { persistenceErrorResponse } from "@/lib/persistence/errors";
import {
  listOwnedIncidents,
  saveOwnedIncidentBundle,
} from "@/lib/persistence/incidents";

export async function GET(request: Request) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  const url = new URL(request.url);
  try {
    const result = await listOwnedIncidents(ownerId, {
      ...(url.searchParams.has("search")
        ? { search: url.searchParams.get("search") ?? "" }
        : {}),
      ...(url.searchParams.has("scenario")
        ? { scenario: url.searchParams.get("scenario") ?? "" }
        : {}),
      ...(url.searchParams.has("status")
        ? { status: url.searchParams.get("status") ?? "" }
        : {}),
      ...(url.searchParams.has("difficulty")
        ? { difficulty: url.searchParams.get("difficulty") ?? "" }
        : {}),
      ...(url.searchParams.has("sort")
        ? { sort: url.searchParams.get("sort") ?? "" }
        : {}),
      page: Number(url.searchParams.get("page") ?? 1),
    });
    return Response.json(result);
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    const body = (await request.json()) as Parameters<
      typeof saveOwnedIncidentBundle
    >[1];
    return Response.json(await saveOwnedIncidentBundle(ownerId, body), {
      status: 201,
    });
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
