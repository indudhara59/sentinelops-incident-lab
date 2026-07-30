import { authenticatedOwnerId } from "@/lib/auth/owner";
import {
  abandonOwnedIncident,
  deleteOwnedIncident,
  getOwnedIncident,
} from "@/lib/persistence/incidents";
import { persistenceErrorResponse } from "@/lib/persistence/errors";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    const incident = await getOwnedIncident(ownerId, (await params).id);
    return incident
      ? Response.json(incident)
      : Response.json(
          { error: { code: "NOT_FOUND", message: "Investigation not found." } },
          { status: 404 },
        );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    const body = (await request.json()) as { status?: unknown };
    if (body.status !== "abandoned")
      return Response.json(
        {
          error: {
            code: "INVALID_STATUS",
            message: "Only abandonment is supported here.",
          },
        },
        { status: 400 },
      );
    const changed = await abandonOwnedIncident(ownerId, (await params).id);
    return changed
      ? Response.json({ status: "abandoned" })
      : Response.json(
          { error: { code: "NOT_FOUND", message: "Investigation not found." } },
          { status: 404 },
        );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  if (request.headers.get("x-confirm-delete") !== "delete") {
    return Response.json(
      {
        error: {
          code: "CONFIRMATION_REQUIRED",
          message: "Deletion must be confirmed.",
        },
      },
      { status: 409 },
    );
  }
  try {
    const deleted = await deleteOwnedIncident(ownerId, (await params).id);
    return deleted
      ? new Response(null, { status: 204 })
      : Response.json(
          { error: { code: "NOT_FOUND", message: "Investigation not found." } },
          { status: 404 },
        );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
