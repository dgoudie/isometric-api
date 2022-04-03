import mongoose, { PipelineStage } from 'mongoose';

import { ExerciseMuscleGroup } from '@dgoudie/isometric-types';

export const buildNextDayScheduleAggregation = (nextDayNumber: number) => {
  let pipeline: PipelineStage[] = [];
  pipeline = [
    {
      $unwind: {
        path: '$days',
        includeArrayIndex: 'dayNumber',
      },
    },
    {
      $project: {
        _id: '$days._id',
        nickname: '$days.nickname',
        exercises: '$days.exercises',
        dayNumber: '$dayNumber',
      },
    },
    {
      $match: {
        $or: [
          {
            dayNumber: nextDayNumber,
          },
          {
            dayNumber: 0,
          },
        ],
      },
    },
    {
      $sort: {
        dayNumber: -1,
      },
    },
    {
      $limit: 1,
    },
  ];
  return pipeline;
};

export const buildFindExercisesWithBasicHistoryQuery = (
  userId: string,
  $search?: string,
  muscleGroup?: ExerciseMuscleGroup,
  page?: number
) => {
  let query: object = { userId: new mongoose.Types.ObjectId(userId) };
  if (!!$search) {
    $search = $search.replace(/(\w+)/g, '"$1"');
    query = {
      ...query,
      $text: { $search },
    };
  }
  if (!!muscleGroup) {
    query = {
      ...query,
      $or: [
        { primaryMuscleGroup: muscleGroup },
        { secondaryMuscleGroups: muscleGroup },
      ],
    };
  }
  let pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'workouts',
        as: 'workouts',
        let: {
          exercise_id: '$_id',
        },
        pipeline: [
          {
            $unwind: '$exercises',
          },
          {
            $match: {
              $expr: {
                $eq: ['$exercises.exerciseId', '$$exercise_id'],
              },
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$workouts',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'workouts.exercises.totalRepsForSet': {
          $sum: '$workouts.exercises.sets.repetitions',
        },
      },
    },
    {
      $unwind: {
        path: '$workouts.exercises.sets',
        preserveNullAndEmptyArrays: true,
        includeArrayIndex: 'workouts.exercises.sets.setIndex',
      },
    },
    {
      $match: {
        $or: [
          {
            'workouts.exercises.exerciseId': {
              $exists: false,
            },
          },
          {
            'workouts.exercises.sets.complete': true,
          },
        ],
      },
    },
    {
      $addFields: {
        'workouts.exercises.sets.workoutStart': '$workouts.createdAt',
        'workouts.exercises.sortableValue': {
          $cond: [
            {
              $eq: ['$exercise.exerciseType', 'rep_based'],
            },
            '$workouts.exercises.totalRepsForSet',
            '$workouts.exercises.sets.resistanceInPounds',
          ],
        },
      },
    },
    {
      $sort: {
        _id: 1,
        'workouts.exercises.sortableValue': -1,
      },
    },
    {
      $group: {
        _id: '$_id',
        exerciseRoot: {
          $first: '$$ROOT',
        },
        sets: {
          $push: '$workouts.exercises.sets',
        },
        bestSet: {
          $first: '$workouts.exercises.sets',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$exerciseRoot',
            {
              bestSet: {
                $cond: [
                  {
                    $not: '$bestSet.workoutStart',
                  },
                  '$$REMOVE',
                  '$bestSet',
                ],
              },
              sets: {
                $filter: {
                  input: '$sets',
                  as: 'set',
                  cond: {
                    $not: {
                      $not: '$$set.workoutStart',
                    },
                  },
                },
              },
              lastPerformed: {
                $max: '$exerciseRoot.workouts.exercises.sets.workoutStart',
              },
            },
          ],
        },
      },
    },
    { $unset: 'workouts' },
    {
      $unwind: {
        path: '$sets',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        'sets.workoutStart': 1,
        'sets.setIndex': 1,
      },
    },
    {
      $group: {
        _id: '$_id',
        _: {
          $first: '$$ROOT',
        },
        sets: {
          $push: '$sets',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$_',
            {
              sets: '$sets',
            },
          ],
        },
      },
    },
    {
      $sort: {
        name: 1,
      },
    },
  ];
  if (typeof page !== 'undefined') {
    pipeline = [...pipeline, { $skip: (page - 1) * 10 }, { $limit: 10 }];
  }
  return pipeline;
};
