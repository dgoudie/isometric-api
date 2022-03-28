import { ISettings, IWorkout } from '@dgoudie/isometric-types';
import { Model, Schema } from 'mongoose';

import { handleMongooseError } from '../../utils/mongoose-error-middleware';
import mongoose from 'mongoose';

const workoutSchema = new Schema<IWorkout>(
    {
        userId: mongoose.Types.ObjectId,
        startedAt: Date,
        endedAt: Date,
        dayNumber: Number,
        nickname: String,
        exercises: [
            {
                exerciseId: mongoose.Types.ObjectId,
                sets: [
                    {
                        resistanceInPounds: Number,
                        repetitions: Number,
                        complete: Boolean,
                        _id: false,
                    },
                ],
                _id: false,
            },
        ],
    },
    { timestamps: true }
);

workoutSchema.post('save', handleMongooseError);

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
