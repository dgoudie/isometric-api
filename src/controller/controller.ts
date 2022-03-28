import express from 'express';
import { initExercise } from './domains/exercise';
import { initSchedule } from './domains/schedule';
import { initWorkout } from './domains/workout';
import ws from 'express-ws';

export function init(app: ws.Application, instance: ws.Instance) {
    initExercise(app);
    initSchedule(app);
    initWorkout(app, instance);
}
