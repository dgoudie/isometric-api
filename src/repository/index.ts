import { getLogger } from 'log4js';
import { init as initMeRepository } from './repository';

export function init() {
  getLogger().info(`initializing repository...`);
  if (!process.env.MONGODB_URI) {
    getLogger().error(`environment variable MONGODB_URI not found.`);
  }
  initMeRepository();
}
