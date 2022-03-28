import mongoose, { Model, Schema } from 'mongoose';

import { IExercise } from '@dgoudie/isometric-types';

const exerciseSchema = new Schema<IExercise>(
    {
        userId: mongoose.Types.ObjectId,
        name: String,
        breakTimeInSeconds: Number,
        setCount: Number,
        timePerSetInSeconds: Number,
        primaryMuscleGroup: String,
        secondaryMuscleGroups: [String],
        exerciseType: String,
        minimumRecommendedRepetitions: Number,
        maximumRecommendedRepetitions: Number,
    },
    { timestamps: true }
);

exerciseSchema.index({ userId: 1, name: 1 }, { unique: true });

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;
