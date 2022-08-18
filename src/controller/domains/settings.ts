import express from 'express';
import { getSettings } from '../../database/domains/settings.js';

export function initSettings(app: express.Application) {
  app.get('/api/settings', async (req, res, next) => {
    try {
      const settings = await getSettings(res.locals.userId);
      res.send(settings);
    } catch (e) {
      next(e);
    }
  });
}
