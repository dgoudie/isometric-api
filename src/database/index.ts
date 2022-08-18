import { init as initMeRepository } from './repository.js';
import log4js from 'log4js';

export function init() {
  log4js.getLogger().info(`initializing repository...`);
  if (!process.env.MONGODB_URI) {
    log4js.getLogger().error(`environment variable MONGODB_URI not found.`);
  }
  initMeRepository();
}
