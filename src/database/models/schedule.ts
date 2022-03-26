import { Model, Schema } from 'mongoose';

import { ISchedule } from '@dgoudie/isometric-types';
import { handleMongooseError } from '../../utils/mongoose-error-middleware';
import mongoose from 'mongoose';

const scheduleSchema = new Schema<ISchedule>(
    {
        //@ts-ignore
        userId: { type: mongoose.Types.ObjectId },
        days: [
            {
                nickname: String,
                exercises: {
                    type: [mongoose.Types.ObjectId],
                },
                _id: false,
            },
        ],
        _id: false,
    },
    { timestamps: true }
);

scheduleSchema.post('save', handleMongooseError);

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
