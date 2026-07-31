import "server-only";
import { COURSE_STEPS } from "./content";
import {
  COURSE_VERSION,
  emptyProgress,
  sanitizeProgress,
  type LearningProgress,
} from "./progress";
import { getDatabase } from "@/lib/persistence/mongodb";
import {
  COLLECTIONS,
  type LearningProgressDocument,
} from "@/lib/persistence/model";

const stepIds = COURSE_STEPS.map((step) => step.id);

export function learningProgressFilter(ownerId: string) {
  return { ownerId, courseVersion: COURSE_VERSION } as const;
}

export async function getOwnedLearningProgress(ownerId: string) {
  const record = await (
    await getDatabase()
  )
    .collection<LearningProgressDocument>(COLLECTIONS.learningProgress)
    .findOne(learningProgressFilter(ownerId));
  return record ? sanitizeProgress(record, stepIds) : emptyProgress();
}

export async function saveOwnedLearningProgress(
  ownerId: string,
  input: LearningProgress,
) {
  const progress = sanitizeProgress(input, stepIds);
  const now = new Date();
  await (
    await getDatabase()
  )
    .collection<LearningProgressDocument>(COLLECTIONS.learningProgress)
    .updateOne(
      learningProgressFilter(ownerId),
      {
        $set: {
          completedStepIds: progress.completedStepIds,
          currentStepId: progress.currentStepId,
          updatedAt: now,
        },
        $setOnInsert: {
          ownerId,
          courseVersion: COURSE_VERSION,
          createdAt: now,
        },
      },
      { upsert: true },
    );
  return { ...progress, updatedAt: now.toISOString() };
}
