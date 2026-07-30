import { authenticatedOwnerId } from "@/lib/auth/owner";
import { persistenceErrorResponse } from "@/lib/persistence/errors";
import {
  getOwnedCustomScenario,
  saveOwnedCustomScenario,
} from "@/lib/scenario-builder/repository";
import type { ScenarioDraft } from "@/lib/scenario-builder/schema";
import { hasScenarioDraftShape } from "@/lib/scenario-builder/schema";

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
    const scenario = await getOwnedCustomScenario(ownerId, (await params).id);
    return scenario
      ? Response.json(scenario)
      : Response.json(
          { error: { code: "NOT_FOUND", message: "Scenario not found." } },
          { status: 404 },
        );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}

export async function PUT(
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
    return Response.json(
      await saveOwnedCustomScenario(ownerId, body.draft, (await params).id),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SCENARIO_NOT_FOUND")
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Scenario not found." } },
        { status: 404 },
      );
    return persistenceErrorResponse(error);
  }
}
