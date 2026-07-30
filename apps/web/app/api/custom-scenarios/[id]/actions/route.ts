import { authenticatedOwnerId } from "@/lib/auth/owner";
import { persistenceErrorResponse } from "@/lib/persistence/errors";
import {
  archiveOwnedCustomScenario,
  duplicateOwnedCustomScenario,
  getOwnedCustomScenario,
} from "@/lib/scenario-builder/repository";
import {
  generateScenarioPreview,
  validateScenarioDraft,
} from "@/lib/scenario-builder/schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ownerId = await authenticatedOwnerId();
  if (!ownerId)
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in required." } },
      { status: 401 },
    );
  const id = (await params).id;
  try {
    const body = (await request.json()) as { action?: unknown; seed?: unknown };
    if (body.action === "duplicate") {
      const duplicate = await duplicateOwnedCustomScenario(ownerId, id);
      return duplicate
        ? Response.json(duplicate, { status: 201 })
        : Response.json(
            { error: { code: "NOT_FOUND", message: "Scenario not found." } },
            { status: 404 },
          );
    }
    if (body.action === "archive") {
      return (await archiveOwnedCustomScenario(ownerId, id))
        ? Response.json({ archived: true })
        : Response.json(
            { error: { code: "NOT_FOUND", message: "Scenario not found." } },
            { status: 404 },
          );
    }
    const scenario = await getOwnedCustomScenario(ownerId, id);
    if (!scenario)
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Scenario not found." } },
        { status: 404 },
      );
    const issues = validateScenarioDraft(scenario.draft);
    if (body.action === "validate")
      return Response.json({ valid: issues.length === 0, issues });
    if (body.action === "test-run") {
      if (issues.length)
        return Response.json(
          {
            error: {
              code: "VALIDATION_FAILED",
              message: "Fix validation issues before a private test run.",
              issues,
            },
          },
          { status: 422 },
        );
      const seed = Math.max(0, Math.min(4_294_967_295, Number(body.seed) || 1));
      return Response.json({
        execution: "private-declarative-preview",
        persisted: false,
        preview: generateScenarioPreview(scenario.draft, seed),
      });
    }
    return Response.json(
      {
        error: {
          code: "INVALID_ACTION",
          message: "Action is not allowlisted.",
        },
      },
      { status: 400 },
    );
  } catch (error) {
    return persistenceErrorResponse(error);
  }
}
