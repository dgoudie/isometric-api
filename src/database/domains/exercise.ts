import {
  ExerciseMuscleGroup,
  IExercise,
  IExerciseWithHistory,
} from '@dgoudie/isometric-types';

import Exercise from '../models/exercise';
import { buildFindExercisesWithBasicHistoryQuery } from '../aggregations';
import mongoose from 'mongoose';

export function getExercises(
  userId: string,
  $search?: string,
  muscleGroup?: ExerciseMuscleGroup,
  page?: number,
  ids?: string[]
) {
  const pipeline = buildFindExercisesWithBasicHistoryQuery(
    userId,
    $search,
    muscleGroup,
    page,
    ids
  );
  return Exercise.aggregate(pipeline);
}
export function getExerciseById(userId: string, _id: string) {
  return Exercise.findOne({ userId, _id });
}

export async function getExerciseByName(
  userId: string,
  name: string
): Promise<IExerciseWithHistory> {
  const [exercise] = await Exercise.aggregate([
    {
      $match: {
        name,
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'workouts',
        as: 'instances',
        let: {
          exerciseId: '$_id',
        },
        pipeline: [
          {
            $unwind: {
              path: '$exercises',
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    userId: new mongoose.Types.ObjectId(userId),
                  },
                  {
                    $eq: ['$exercises.exercise._id', '$$exerciseId'],
                  },
                ],
              },
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ],
      },
    },
  ]);
  return exercise;
}
