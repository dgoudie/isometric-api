import { Model, Schema } from 'mongoose';

import { ISettings } from '@dgoudie/isometric-types';
import mongoose from 'mongoose';

const settingsSchema = new Schema<ISettings>(
  {
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

const Settings =
  (mongoose.models.Settings as Model<ISettings>) ||
  mongoose.model('Settings', settingsSchema);

export default Settings;
