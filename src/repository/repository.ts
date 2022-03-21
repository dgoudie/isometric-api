import {
    ExerciseMuscleGroup,
    IExercise,
    IWorkoutSchedule,
} from '@dgoudie/isometric-types';
import { getLogger } from 'log4js';

import mongoose from 'mongoose';
import Exercise from './models/exercise';
import WorkoutSchedule from './models/workout-schedule';

export async function init() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
    } catch (e) {
        getLogger().error(
            `Error connecting to database: ${(<Error>e).message}`
        );
    }
}

export function getExercises(
    userId: string,
    $search?: string,
    muscleGroup?: ExerciseMuscleGroup
) {
    let query: mongoose.FilterQuery<IExercise> = { userId };
    if (!!$search) {
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
    return Exercise.find(query).sort({ name: 1 });
}

export function getExercise(userId: string, name: string) {
    return Exercise.findOne({ userId, name });
}

export function getSchedule(userId: string) {
    return WorkoutSchedule.findOne({ userId });
}

export function saveSchedule(userId: string, schedule: IWorkoutSchedule) {
    return WorkoutSchedule.updateOne(
        { userId },
        { ...schedule, userId },
        { upsert: true }
    );
}
