import {
  getNextDaySchedule,
  getSchedule,
  saveSchedule,
} from '../../database/domains/schedule.js';

import express from 'express';

export function initSchedule(app: express.Application) {
  app.get('/api/schedule', async (req, res, next) => {
    try {
      const schedule = await getSchedule(res.locals.userId);
      res.send(schedule);
    } catch (e) {
      next(e);
    }
  });

  app.put('/api/schedule', async (req, res, next) => {
    try {
      await saveSchedule(res.locals.userId, req.body);
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/schedule/next-day', async (req, res, next) => {
    try {
      const nextDay = await getNextDaySchedule(res.locals.userId);
      res.send(nextDay);
    } catch (e) {
      next(e);
    }
  });
}
