export const COURSE_VERSION = "incident-response-foundations@1";
export const LOCAL_PROGRESS_KEY = "sentinelops:learning-progress:v1";

export type LearningProgress = {
  courseVersion: string;
  completedStepIds: string[];
  currentStepId: string;
  updatedAt: string;
};

export function emptyProgress(firstStepId = "system"): LearningProgress {
  return {
    courseVersion: COURSE_VERSION,
    completedStepIds: [],
    currentStepId: firstStepId,
    updatedAt: new Date(0).toISOString(),
  };
}

export function sanitizeProgress(
  value: unknown,
  validStepIds: readonly string[],
): LearningProgress {
  const fallback = emptyProgress(validStepIds[0]);
  if (!value || typeof value !== "object") return fallback;
  const input = value as Record<string, unknown>;
  const completedStepIds = Array.isArray(input.completedStepIds)
    ? [...new Set(input.completedStepIds)]
        .filter(
          (id): id is string =>
            typeof id === "string" && validStepIds.includes(id),
        )
        .slice(0, validStepIds.length)
    : [];
  const currentStepId = validStepIds.includes(String(input.currentStepId))
    ? String(input.currentStepId)
    : validStepIds.find((id) => !completedStepIds.includes(id)) ||
      validStepIds.at(-1) ||
      fallback.currentStepId;
  return {
    courseVersion: COURSE_VERSION,
    completedStepIds,
    currentStepId,
    updatedAt:
      typeof input.updatedAt === "string"
        ? input.updatedAt.slice(0, 40)
        : fallback.updatedAt,
  };
}
