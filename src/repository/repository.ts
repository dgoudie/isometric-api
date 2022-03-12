import { getLogger } from 'log4js';

import mongoose from 'mongoose';
import Exercise from './models/exercise';

export async function init() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
    } catch (e) {
        getLogger().error(
            `Error connecting to database: ${(<Error>e).message}`
        );
    }
}

export function getExercises(userId: string) {
    return Exercise.find({ userId }).sort({ name: 1 });
}

export function getExercise(userId: string, name: string) {
    return Exercise.findOne({ userId, name });
}
