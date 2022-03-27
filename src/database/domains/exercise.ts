import { ExerciseMuscleGroup, IExercise } from '@dgoudie/isometric-types';

import Exercise from '../models/exercise';
import mongoose from 'mongoose';

export function getExercises(
    userId: string,
    $search?: string,
    muscleGroup?: ExerciseMuscleGroup
) {
    let query: mongoose.FilterQuery<IExercise> = { userId };
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
    return Exercise.find(query).sort({ name: 1 });
}

export function getExercise(userId: string, name: string) {
    return Exercise.findOne({ userId, name });
}
