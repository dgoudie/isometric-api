import { configure, getLogger } from 'log4js';

import { init as initController } from './controller';
import { init as initRepository } from './database';

const init = () => {
    getLogger().level = `INFO`;
    if (!process.env.LOG_HOST) {
        getLogger().warn(`environment variable LOG_HOST not found.`);
    } else {
        configure({
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

    getLogger().info(
        `starting ${process.env.npm_package_name} (env=${process.env.NODE_ENV})`
    );

    initRepository();
    initController();
};

init();
