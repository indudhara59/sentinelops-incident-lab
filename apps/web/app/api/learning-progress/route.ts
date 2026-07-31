import { authenticatedOwnerId } from "@/lib/auth/owner";
import {
  getOwnedLearningProgress,
  saveOwnedLearningProgress,
} from "@/lib/learning/repository";
import { persistenceErrorResponse } from "@/lib/persistence/errors";

function unauthenticated() {
  return Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
    { status: 401 },
  );
}

export async function GET() {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId) return unauthenticated();
  try {
    return Response.json(await getOwnedLearningProgress(ownerId));
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId) return unauthenticated();
  try {
    return Response.json(
      await saveOwnedLearningProgress(ownerId, await request.json()),
    );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
