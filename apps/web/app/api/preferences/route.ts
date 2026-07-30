import { authenticatedOwnerId } from "@/lib/auth/owner";
import { persistenceErrorResponse } from "@/lib/persistence/errors";
import {
  getOwnedPreferences,
  saveOwnedPreferences,
} from "@/lib/persistence/preferences";

export async function GET() {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    return Response.json(await getOwnedPreferences(ownerId));
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    return Response.json(
      await saveOwnedPreferences(ownerId, await request.json()),
    );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
