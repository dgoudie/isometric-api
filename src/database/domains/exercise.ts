import { ExerciseMuscleGroup, IExercise } from '@dgoudie/isometric-types';

import Exercise from '../models/exercise';
import { buildFindExercisesWithBasicHistoryQuery } from '../aggregations';

export function getExercises(
  userId: string,
  $search?: string,
  muscleGroup?: ExerciseMuscleGroup,
  page?: number
) {
  const pipeline = buildFindExercisesWithBasicHistoryQuery(
    userId,
    $search,
    muscleGroup,
    page
  );
  return Exercise.aggregate(pipeline);
}

export function getExercise(userId: string, name: string) {
  return Exercise.findOne({ userId, name });
}
