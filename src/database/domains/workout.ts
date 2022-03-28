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
        sets: new Array(exercise.setCount).fill({}),
    }));

    const alreadyInProgressWorkout = await Workout.findOne({
        userId,
        endedAt: { $exists: false },
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
