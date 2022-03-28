import { Model, Schema } from 'mongoose';

import { ISchedule } from '@dgoudie/isometric-types';
import { handleMongooseError } from '../../utils/mongoose-error-middleware';
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

scheduleSchema.post('save', handleMongooseError);

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
