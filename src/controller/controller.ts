import express from 'express';
import { initExercise } from './domains/exercise';
import { initSchedule } from './domains/schedule';

export function init(app: express.Application) {
    initExercise(app);
    initSchedule(app);
}
