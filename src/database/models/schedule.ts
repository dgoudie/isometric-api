import { Model, Schema } from 'mongoose';

import { ISchedule } from '@dgoudie/isometric-types';
import mongoose from 'mongoose';

const scheduleSchema = new Schema<ISchedule>(
    {
        userId: mongoose.Types.ObjectId,
        days: [
            {
                nickname: String,
                exerciseIds: [mongoose.Types.ObjectId],
                _id: false,
            },
        ],
    },
    { timestamps: true, _id: false }
);

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
