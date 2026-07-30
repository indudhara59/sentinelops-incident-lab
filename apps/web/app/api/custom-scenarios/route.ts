import { authenticatedOwnerId } from "@/lib/auth/owner";
import { persistenceErrorResponse } from "@/lib/persistence/errors";
import {
  listOwnedCustomScenarios,
  saveOwnedCustomScenario,
} from "@/lib/scenario-builder/repository";
import type { ScenarioDraft } from "@/lib/scenario-builder/schema";
import { hasScenarioDraftShape } from "@/lib/scenario-builder/schema";

export async function GET() {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  try {
    return Response.json(await listOwnedCustomScenarios(ownerId));
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
    const body = (await request.json()) as { draft?: ScenarioDraft };
    if (!hasScenarioDraftShape(body.draft))
      return Response.json(
        {
          error: {
            code: "INVALID_DRAFT",
            message: "A declarative scenario draft is required.",
          },
        },
        { status: 400 },
      );
    return Response.json(await saveOwnedCustomScenario(ownerId, body.draft), {
      status: 201,
    });
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
