import { ISettings, IWorkoutSchedule } from '@dgoudie/isometric-types';
import { Model, Schema } from 'mongoose';

import { handleMongooseError } from '../../utils/mongoose-error-middleware';
import mongoose from 'mongoose';

const workoutScheduleSchema = new Schema<IWorkoutSchedule>(
    {
        userId: { type: String },
        days: [
            {
                exercises: {
                    type: [String],
                },
            },
        ],
    },
    { timestamps: true }
);

workoutScheduleSchema.post('save', handleMongooseError);

const WorkoutSchedule = mongoose.model(
    'WorkoutSchedule',
    workoutScheduleSchema,
    'schedules'
);

export default WorkoutSchedule;
