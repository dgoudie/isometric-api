import { initExercise } from './domains/exercise.js';
import { initSchedule } from './domains/schedule.js';
import { initSettings } from './domains/settings.js';
import { initWorkout } from './domains/workout.js';
import ws from 'express-ws';

export function init(app: ws.Application, instance: ws.Instance) {
  initExercise(app);
  initSchedule(app);
  initSettings(app);
  initWorkout(app, instance);
}
