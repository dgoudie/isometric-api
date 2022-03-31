import {
    IExercise,
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

export async function persistExercise(
    userId: string,
    exerciseIndex: number,
    exercise: IWorkoutExercise
) {
    await normalizeExercise(exercise, exerciseIndex, userId);
    await Workout.updateOne(
        { userId, endedAt: undefined },
        { $set: { [`exercises.${exerciseIndex}`]: exercise } }
    );
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

async function normalizeExercise(
    exercise: IWorkoutExercise,
    exerciseIndex: number,
    userId: string
) {
    ensureNoIncompleteSetsBeforeCompleteSets(exercise);
    await populateResistanceForNextSets(exercise, exerciseIndex, userId);
}
function ensureNoIncompleteSetsBeforeCompleteSets(exercise: IWorkoutExercise) {
    exercise.sets.forEach((set, index) => {
        if (!set.complete) {
            let nextSet = exercise.sets[index + 1];
            nextSet && (nextSet.complete = false);
        }
    });
}
async function populateResistanceForNextSets(
    exercise: IWorkoutExercise,
    exerciseIndex: number,
    userId: string
) {
    let activeWorkout = await getActiveWorkout(userId);
    if (!activeWorkout) {
        return;
    }
    let exerciseAtIndex = activeWorkout.exercises[exerciseIndex];
    let anyExercisesAlreadyHaveResistanceSet = !exerciseAtIndex.sets.every(
        (set) => typeof set.resistanceInPounds === 'undefined'
    );
    if (anyExercisesAlreadyHaveResistanceSet) {
        return;
    }
    if (exercise.sets.length < 2) {
        return;
    }
    const firstSetResistance = exercise.sets[0].resistanceInPounds;
    const everyOtherSetResistanceIsUndefined = exercise.sets
        .slice(1)
        .every((set) => typeof set.resistanceInPounds === 'undefined');
    if (
        typeof firstSetResistance === 'undefined' ||
        !everyOtherSetResistanceIsUndefined
    ) {
        return;
    }
    exercise.sets.forEach((set, index) => {
        if (index === 0) {
            return;
        }
        set.resistanceInPounds = firstSetResistance;
    });
}
