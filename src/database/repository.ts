import { getLogger } from 'log4js';
import mongoose from 'mongoose';

export async function init() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
    } catch (e) {
        getLogger().error(
            `Error connecting to database: ${(<Error>e).message}`
        );
    }
}
