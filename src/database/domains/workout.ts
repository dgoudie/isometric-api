import {
  IExercise,
  IWorkout,
  IWorkoutExercise,
  IWorkoutExerciseSet,
} from '@dgoudie/isometric-types';
import {
  differenceInMilliseconds,
  millisecondsToSeconds,
  minutesToMilliseconds,
} from 'date-fns';
import { getExerciseById, getExerciseByName } from './exercise';

import { PipelineStage } from 'mongoose';
import Workout from '../models/workout';
import { getNextDaySchedule } from './schedule';
import mongoose from 'mongoose';

export async function getMinifiedActiveWorkout(
  userId: string
): Promise<Partial<IWorkout> | null> {
  return Workout.findOne({ userId, endedAt: undefined }, 'exercises');
}

export async function getFullActiveWorkout(
  userId: string
): Promise<IWorkout | null> {
  let pipeline: PipelineStage[] = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        endedAt: undefined,
      },
    },
    {
      $unwind: {
        path: '$checkIns',
      },
    },
    {
      $sort: {
        checkIns: 1,
      },
    },
    {
      $group: {
        _id: '$_id',
        root: {
          $first: '$$ROOT',
        },
        checkIns: {
          $push: '$checkIns',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$root',
            {
              checkIns: '$checkIns',
            },
          ],
        },
      },
    },
    { $limit: 1 },
  ];
  const [result] = await Workout.aggregate(pipeline);
  return result ?? null;
}

export async function addCheckInToActiveExercise(userId: string) {
  Workout.updateOne(
    { userId, endedAt: undefined },
    {
      $push: { checkIns: new Date() },
    }
  ).exec();
}

export async function startWorkout(userId: string) {
  const { nickname, dayNumber, exercises } = await getNextDaySchedule(userId);

  let exercisesMapped: IWorkoutExercise[] = exercises.map(
    mapExerciseToInstance
  );

  const alreadyInProgressWorkout = await Workout.findOne({
    userId,
    endedAt: undefined,
  });

  if (!!alreadyInProgressWorkout) {
    return alreadyInProgressWorkout;
  }

  await Workout.create({
    userId,
    startedAt: new Date(),
    dayNumber,
    nickname,
    exercises: exercisesMapped,
    checkIns: [new Date()],
  });
  return getMinifiedActiveWorkout(userId);
}

export async function persistSetComplete(
  userId: string,
  exerciseIndex: number,
  setIndex: number,
  complete: boolean
) {
  await Workout.updateOne(
    { userId, endedAt: undefined },
    {
      $set: {
        [`exercises.${exerciseIndex}.sets.${setIndex}.complete`]: complete,
      },
    }
  );
  await ensureNoIncompleteSetsBeforeCompleteSets(userId, exerciseIndex);
  return getMinifiedActiveWorkout(userId);
}

export async function persistSetRepetitions(
  userId: string,
  exerciseIndex: number,
  setIndex: number,
  repetitions: number | undefined
) {
  await Workout.updateOne(
    { userId, endedAt: undefined },
    {
      [typeof repetitions !== 'undefined' ? '$set' : '$unset']: {
        [`exercises.${exerciseIndex}.sets.${setIndex}.repetitions`]:
          repetitions ?? '',
      },
    }
  );
  return getMinifiedActiveWorkout(userId);
}

export async function persistSetResistance(
  userId: string,
  exerciseIndex: number,
  setIndex: number,
  resistanceInPounds: number | undefined
) {
  await Workout.updateOne(
    { userId, endedAt: undefined },
    {
      [typeof resistanceInPounds !== 'undefined' ? '$set' : '$unset']: {
        [`exercises.${exerciseIndex}.sets.${setIndex}.resistanceInPounds`]:
          resistanceInPounds ?? '',
      },
    }
  );
  await populateResistanceForNextSets(userId, exerciseIndex, setIndex);
  return getMinifiedActiveWorkout(userId);
}

export async function replaceExercise(
  userId: string,
  exerciseIndex: number,
  newExerciseId: string
) {
  const newExercise = await getExerciseById(userId, newExerciseId);
  if (!newExercise) {
    return;
  }
  const workoutExerciseMapped = mapExerciseToInstance(newExercise);
  await Workout.updateOne(
    { userId, endedAt: undefined },
    { [`exercises.${exerciseIndex}`]: workoutExerciseMapped }
  );
  return getMinifiedActiveWorkout(userId);
}

export async function endWorkout(userId: string) {
  const activeWorkout = await getFullActiveWorkout(userId);
  if (!activeWorkout) {
    return;
  }
  const checkIns = [...activeWorkout.checkIns!, new Date()];
  let durationInMilliseconds = 0;
  for (let index = 0; index < checkIns.length - 1; index++) {
    const checkIn = checkIns[index];
    const nextCheckIn = checkIns[index + 1];
    let durationBetweenCheckIns = differenceInMilliseconds(
      new Date(nextCheckIn),
      new Date(checkIn)
    );
    durationInMilliseconds += Math.min(
      durationBetweenCheckIns,
      minutesToMilliseconds(30)
    );
  }
  const durationInSeconds = millisecondsToSeconds(durationInMilliseconds);
  return Workout.updateOne(
    {
      userId,
      endedAt: undefined,
    },
    [
      {
        $addFields: { endedAt: new Date(), durationInSeconds },
      },
      { $unset: 'checkIns' },
    ]
  );
}

export async function discardWorkout(userId: string) {
  return Workout.deleteOne({
    userId,
    endedAt: undefined,
  });
}

export function getMostRecentCompletedWorkout(userId: string) {
  return Workout.findOne({
    userId,
    endedAt: { $exists: true },
  }).sort({ createdAt: -1 });
}

function mapExerciseToInstance(exercise: IExercise): IWorkoutExercise {
  return {
    exerciseId: exercise._id,
    sets: new Array<IWorkoutExerciseSet>(exercise.setCount).fill({
      complete: false,
      timeInSeconds:
        exercise.exerciseType === 'timed'
          ? exercise.timePerSetInSeconds
          : undefined,
    }),
  };
}

async function ensureNoIncompleteSetsBeforeCompleteSets(
  userId: string,
  exerciseIndex: number
) {
  let activeWorkout = await getFullActiveWorkout(userId);
  if (!activeWorkout) {
    return;
  }
  let exerciseAtIndex = activeWorkout.exercises[exerciseIndex];
  let firstUnfinishedExercise = exerciseAtIndex.sets.findIndex(
    (set) => !set.complete
  );
  if (firstUnfinishedExercise < 0) {
    return;
  }
  let updatePromises = [];
  for (let i = firstUnfinishedExercise; i < exerciseAtIndex.sets.length; i++) {
    updatePromises.push(
      Workout.updateOne(
        {
          userId,
          endedAt: undefined,
        },
        { $set: { [`exercises.${exerciseIndex}.sets.${i}.complete`]: false } }
      )
    );
  }
  await Promise.all(updatePromises);
}
async function populateResistanceForNextSets(
  userId: string,
  exerciseIndex: number,
  setIndex: number
) {
  if (setIndex !== 0) {
    return;
  }
  let activeWorkout = await getFullActiveWorkout(userId);
  if (!activeWorkout) {
    return;
  }
  let exerciseAtIndex = activeWorkout.exercises[exerciseIndex];
  let anyOtherExercisesAlreadyHaveResistanceSet = !exerciseAtIndex.sets
    .slice(1)
    .every((set) => typeof set.resistanceInPounds === 'undefined');
  if (anyOtherExercisesAlreadyHaveResistanceSet) {
    return;
  }
  if (exerciseAtIndex.sets.length < 2) {
    return;
  }
  const firstSetResistance = exerciseAtIndex.sets[0].resistanceInPounds;
  const everyOtherSetResistanceIsUndefined = exerciseAtIndex.sets
    .slice(1)
    .every((set) => typeof set.resistanceInPounds === 'undefined');
  if (
    typeof firstSetResistance === 'undefined' ||
    !everyOtherSetResistanceIsUndefined
  ) {
    return;
  }
  await Workout.updateOne(
    {
      userId,
      endedAt: undefined,
    },
    {
      $set: {
        [`exercises.${exerciseIndex}.sets.$[].resistanceInPounds`]:
          firstSetResistance,
      },
    }
  );
}
