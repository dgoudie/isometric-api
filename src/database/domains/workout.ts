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

export async function persistSet(
    userId: string,
    exerciseIndex: number,
    setIndex: number,
    set: IWorkoutExerciseSet
) {
    await Workout.updateOne(
        { userId, endedAt: undefined },
        { $set: { [`exercises.${exerciseIndex}.sets.${setIndex}`]: set } }
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
