import { init as initController } from './controller/index.js';
import { init as initRepository } from './database/index.js';
import log4js from 'log4js';

const init = () => {
  log4js.getLogger().level = `INFO`;
  if (!process.env.LOG_HOST) {
    log4js.getLogger().warn(`environment variable LOG_HOST not found.`);
  } else {
    log4js.configure({
      appenders: {
        logstash: {
          type: '@log4js-node/logstash-http',
          url: process.env.LOG_HOST,
          application: process.env.npm_package_name,
        },
      },
      categories: {
        default: { appenders: ['logstash'], level: 'INFO' },
      },
    });
  }

  log4js
    .getLogger()
    .info(
      `starting ${process.env.npm_package_name} (env=${process.env.NODE_ENV})`
    );

  initRepository();
  initController();
};

init();
