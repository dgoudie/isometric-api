import {
  ExerciseMuscleGroup,
  IExercise,
  IExerciseExtended,
} from '@dgoudie/isometric-types';
import {
  buildFindExercisesWithBasicHistoryQuery,
  joinInstancesToWorkout,
} from '../aggregations';

import Exercise from '../models/exercise';
import mongoose from 'mongoose';

export function getExercises(
  userId: string,
  options: {
    search?: string;
    muscleGroup?: ExerciseMuscleGroup;
    ids?: string[];
    name?: string;
  } = {},
  page?: number
) {
  let query: object = { userId: new mongoose.Types.ObjectId(userId) };
  if (!!options.search) {
    options.search = options.search.replace(/(\w+)/g, '"$1"');
    query = {
      ...query,
      $text: { $search: options.search },
    };
  }
  if (!!options.muscleGroup) {
    query = {
      ...query,
      $or: [
        { primaryMuscleGroup: options.muscleGroup },
        { secondaryMuscleGroups: options.muscleGroup },
      ],
    };
  }
  if (!!options.ids) {
    query = {
      ...query,
      _id: {
        $in: options.ids.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };
  }
  if (!!options.name) {
    query = {
      ...query,
      name: options.name,
    };
  }
  const pipeline = buildFindExercisesWithBasicHistoryQuery(query, page);
  return Exercise.aggregate<IExerciseExtended>(pipeline);
}
export async function getExerciseById(userId: string, _id: string) {
  const [exercise] = await getExercises(userId, { ids: [_id] });
  return exercise;
}

export async function getExerciseByName(
  userId: string,
  name: string
): Promise<IExerciseExtended> {
  const [exercise] = await getExercises(userId, { name });
  return exercise;
}
