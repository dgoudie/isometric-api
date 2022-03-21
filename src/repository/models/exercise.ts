import mongoose, { Model, Schema } from 'mongoose';

import { IExercise } from '@dgoudie/isometric-types';
import { handleMongooseError } from '../../utils/mongoose-error-middleware';

const exerciseSchema = new Schema<IExercise>(
    {
        userId: String,
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

exerciseSchema.post('save', handleMongooseError);

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;
