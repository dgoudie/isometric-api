import { ISettings, IWorkout } from '@dgoudie/isometric-types';
import { Model, Schema } from 'mongoose';

import mongoose from 'mongoose';

const workoutSchema = new Schema<IWorkout>(
    {
        userId: mongoose.Types.ObjectId,
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

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
