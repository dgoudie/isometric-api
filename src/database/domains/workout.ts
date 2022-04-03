import {
  IWorkoutExercise,
  IWorkoutExerciseSet,
} from '@dgoudie/isometric-types';

import Workout from '../models/workout';
import { getNextDaySchedule } from './schedule';

export function getActiveWorkout(userId: string) {
  return Workout.findOne({ userId, endedAt: undefined });
}

export async function startWorkout(userId: string) {
  const { nickname, dayNumber, exercises } = await getNextDaySchedule(userId);

  let exercisesMapped: IWorkoutExercise[] = exercises.map((exercise) => ({
    exerciseId: exercise._id,
    sets: new Array<IWorkoutExerciseSet>(exercise.setCount).fill({
      complete: false,
      timeInSeconds:
        exercise.exerciseType === 'timed'
          ? exercise.timePerSetInSeconds
          : undefined,
    }),
  }));

  const alreadyInProgressWorkout = await Workout.findOne({
    userId,
    endedAt: undefined,
  });

  if (!!alreadyInProgressWorkout) {
    return alreadyInProgressWorkout;
  }

  return Workout.create({
    userId,
    startedAt: new Date(),
    dayNumber,
    nickname,
    exercises: exercisesMapped,
  });
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
  return getActiveWorkout(userId);
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
  return getActiveWorkout(userId);
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
  return getActiveWorkout(userId);
}

export async function endWorkout(userId: string) {
  return Workout.updateOne(
    {
      userId,
      endedAt: undefined,
    },
    { endedAt: new Date() }
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

async function ensureNoIncompleteSetsBeforeCompleteSets(
  userId: string,
  exerciseIndex: number
) {
  let activeWorkout = await getActiveWorkout(userId);
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
  let activeWorkout = await getActiveWorkout(userId);
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
