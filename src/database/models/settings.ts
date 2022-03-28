import { Model, Schema } from 'mongoose';

import { ISettings } from '@dgoudie/isometric-types';
import mongoose from 'mongoose';

const settingsSchema = new Schema<ISettings>(
    {
        userId: mongoose.Types.ObjectId,
    },
    { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
