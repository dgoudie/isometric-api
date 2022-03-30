import { ExerciseMuscleGroup, IExercise } from '@dgoudie/isometric-types';

import Exercise from '../models/exercise';
import mongoose from 'mongoose';

export function getExercises(
    userId: string,
    $search?: string,
    muscleGroup?: ExerciseMuscleGroup,
    page?: number
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
    if (typeof page === 'undefined') {
        return Exercise.find(query).sort({ name: 1 });
    } else {
        return Exercise.find(query)
            .sort({ name: 1 })
            .limit(10)
            .skip((page - 1) * 10);
    }
}

export function getExercise(userId: string, name: string) {
    return Exercise.findOne({ userId, name });
}
