import express, { CookieOptions } from 'express';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import { getLogger } from 'log4js';
import { init as initController } from '../controller/controller';
import { initializeUserDataIfNecessary } from '../database/initialize-user';
import jwt from 'jsonwebtoken';
import ws from 'express-ws';

export const AUTH_TOKEN = 'Authorization';

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
};

export function init() {
  const wsInstance = ws(express());
  const app = wsInstance.app;
  app.set('trust proxy', true);
  setupPreRequestMiddleware(app);
  setupHealthCheck(app);

  initController(app, wsInstance);

  app.listen(process.env.SERVER_PORT, () =>
    getLogger().info(`listening on ${process.env.SERVER_PORT}`)
  );
}

function setupPreRequestMiddleware(app: express.Application) {
  app.use(
    cors({
      // credentials: true,
      // origin: process.env.USER_INTERFACE_PATH,
      // methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use((req, res, next) => {
    let userId: string | undefined;
    if (process.env.NODE_ENV === 'development') {
      userId = process.env.USER_ID;
      if (!userId) {
        throw new Error('process.env.USER_ID not populated');
      }
    } else {
      userId = req.headers['x-forwarded-user'] as string;
    }
    res.locals.userId = userId;
    next();
  });
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      const logger = getLogger();
      logger.addContext('user_id', res.locals.userId);
      logger.addContext('http_client_ip_address', req.ip);
      Object.entries(req.headers).forEach(([key, value]) =>
        logger.addContext(`http_request_header_${key}`, value)
      );
      logger.info(`Received request to ${decodeURIComponent(req.url)}`);
    }
    next();
  });
  app.use(async (req, res, next) => {
    const userId = res.locals.userId;
    await initializeUserDataIfNecessary(userId);
    next();
  });
}

function setupHealthCheck(app: express.Application) {
  app.get('/api/healthcheck', (_req, res) => {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
    };
    try {
      res.send(healthcheck);
    } catch (e: any) {
      healthcheck.message = e;
      res.status(503).send(healthcheck);
    }
  });
}
