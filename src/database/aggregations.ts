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
  page?: number,
  ids?: string[]
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
  if (!!ids) {
    query = {
      ...query,
      _id: {
        $in: ids.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };
  }
  let pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'workouts',
        as: 'instances',
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
                $and: [
                  {
                    $not: {
                      $not: '$endedAt',
                    },
                  },
                  {
                    $eq: ['$exercises.exercise._id', '$$exercise_id'],
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
          {
            $limit: 20,
          },
          {
            $addFields: {
              'exercises.totalRepsForInstance': {
                $sum: '$exercises.sets.repetitions',
              },
            },
          },
          {
            $unwind: {
              path: '$exercises.sets',
              preserveNullAndEmptyArrays: true,
              includeArrayIndex: 'exercises.sets.setIndex',
            },
          },
          {
            $match: {
              $expr: {
                $eq: ['$exercises.sets.complete', true],
              },
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$instances',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'instances.sets': '$instances.exercises.sets',
        'instances.totalRepsForInstance':
          '$instances.exercises.totalRepsForInstance',
      },
    },
    {
      $unset: [
        'instances.dayNumber',
        'instances.nickname',
        'instances.exercises',
      ],
    },
    {
      $addFields: {
        'instances.personalBestSortableValue': {
          $cond: [
            {
              $eq: ['$exercise.exerciseType', 'rep_based'],
            },
            '$instances.totalRepsForInstance',
            '$instances.sets.resistanceInPounds',
          ],
        },
      },
    },
    {
      $sort: {
        'instances.personalBestSortableValue': -1,
      },
    },
    {
      $group: {
        _id: {
          exerciseId: '$_id',
          instanceId: '$instances._id',
        },
        exerciseRoot: {
          $first: '$$ROOT',
        },
        sets: {
          $push: '$instances.sets',
        },
        bestSet: {
          $first: '$instances.sets',
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
                    $not: {
                      $eq: ['$bestSet.setIndex', null],
                    },
                  },
                  '$bestSet',
                  '$$REMOVE',
                ],
              },
              sets: {
                $filter: {
                  input: '$sets',
                  as: 'set',
                  cond: {
                    $not: {
                      $eq: ['$$set.setIndex', null],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
    {
      $addFields: {
        'instances.sets': {
          $cond: [
            {
              $gt: [
                {
                  $size: '$sets',
                },
                0,
              ],
            },
            '$sets',
            '$$REMOVE',
          ],
        },
        'instances.bestSet': '$bestSet',
      },
    },
    {
      $unset: ['sets', 'bestSet'],
    },
    {
      $sort: {
        'instances.personalBestSortableValue': -1,
      },
    },
    {
      $group: {
        _id: '$_id',
        exerciseRoot: {
          $first: '$$ROOT',
        },
        instances: {
          $push: '$instances',
        },
        bestInstance: {
          $first: '$instances',
        },
        bestSet: {
          $first: '$instances.bestSet',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$exerciseRoot',
            {
              instances: {
                $filter: {
                  input: '$instances',
                  as: 'instance',
                  cond: {
                    $not: {
                      $not: '$$instance._id',
                    },
                  },
                },
              },
              bestInstance: {
                $cond: [
                  {
                    $not: '$bestInstance._id',
                  },
                  '$$REMOVE',
                  '$bestInstance',
                ],
              },
              bestSet: {
                $cond: [
                  {
                    $eq: ['$bestSet', null],
                  },
                  '$$REMOVE',
                  '$bestSet',
                ],
              },
              lastPerformed: {
                $max: '$instances.createdAt',
              },
            },
          ],
        },
      },
    },
    {
      $unwind: {
        path: '$instances',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$instances.sets',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        'instances.sets.setIndex': 1,
      },
    },
    {
      $group: {
        _id: {
          exerciseId: '$_id',
          instanceId: '$instances._id',
        },
        _: {
          $first: '$$ROOT',
        },
        sets: {
          $push: '$instances.sets',
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
      $addFields: {
        'instances.sets': {
          $cond: [
            {
              $gt: [
                {
                  $size: '$sets',
                },
                0,
              ],
            },
            '$sets',
            '$$REMOVE',
          ],
        },
      },
    },
    {
      $sort: {
        'instances.createdAt': -1,
      },
    },
    {
      $group: {
        _id: '$_id',
        _: {
          $first: '$$ROOT',
        },
        instances: {
          $push: '$instances',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$_',
            {
              instances: {
                $filter: {
                  input: '$instances',
                  as: 'instance',
                  cond: {
                    $not: {
                      $not: '$$instance._id',
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
    {
      $unset: 'sets',
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
