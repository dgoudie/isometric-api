import { IWorkout, WSWorkoutUpdate } from '@dgoudie/isometric-types';
import {
  addCheckInToActiveExercise,
  discardWorkout,
  endWorkout,
  getCompletedWorkouts,
  getFullActiveWorkout,
  getMinifiedActiveWorkout,
  persistSetComplete,
  persistSetRepetitions,
  persistSetResistance,
  replaceExercise,
  startWorkout,
} from '../../database/domains/workout';

import WebSocket from 'ws';
import { getLogger } from 'log4js';
import { getUserId } from '../../utils/get-user-id';
import ws from 'express-ws';

let wsInstance: ws.Instance;

export const initWorkout = (app: ws.Application, instance: ws.Instance) => {
  wsInstance = instance;
  app.ws('/api/workout/ws', function (ws, req) {
    const userId = getUserId(req);
    //@ts-ignore
    ws.id = userId;

    ws.onmessage = handleMessage;
    addCheckInToActiveExercise(userId);
    getMinifiedActiveWorkout(userId).then((workout) => {
      ws.send(JSON.stringify(workout));
    });
  });

  app.get('/api/workouts', async (req, res, next) => {
    const { page } = req.query;
    if (typeof page !== 'undefined') {
      if (typeof page !== 'string' || isNaN(parseInt(page))) {
        res.status(400).send();
        return;
      }
    }
    try {
      const workouts = await getCompletedWorkouts(
        res.locals.userId,
        !!page ? parseInt(page) : undefined
      );
      res.send(workouts);
    } catch (e) {
      next(e);
    }
  });
};

const handleMessage = async (event: WebSocket.MessageEvent) => {
  try {
    //@ts-ignore
    const userId = event.target.id;
    const eventPayload: WSWorkoutUpdate = JSON.parse(event.data as string);
    addCheckInToActiveExercise(userId);
    if (eventPayload.type === 'START') {
      const workout = await startWorkout(userId);
      broadcastWorkoutUpdate(userId, workout);
    } else if (eventPayload.type === 'END') {
      await endWorkout(userId);
      broadcastWorkoutUpdate(userId, null);
    } else if (eventPayload.type === 'DISCARD') {
      await discardWorkout(userId);
      broadcastWorkoutUpdate(userId, null);
    } else if (eventPayload.type === 'PERSIST_SET_COMPLETE') {
      const workout = await persistSetComplete(
        userId,
        eventPayload.exerciseIndex,
        eventPayload.setIndex,
        eventPayload.complete
      );
      broadcastWorkoutUpdate(userId, workout);
    } else if (eventPayload.type === 'PERSIST_SET_REPETITIONS') {
      const workout = await persistSetRepetitions(
        userId,
        eventPayload.exerciseIndex,
        eventPayload.setIndex,
        eventPayload.repetitions
      );
      broadcastWorkoutUpdate(userId, workout);
    } else if (eventPayload.type === 'PERSIST_SET_RESISTANCE') {
      const workout = await persistSetResistance(
        userId,
        eventPayload.exerciseIndex,
        eventPayload.setIndex,
        eventPayload.resistanceInPounds
      );
      broadcastWorkoutUpdate(userId, workout);
    } else if (eventPayload.type === 'REPLACE_EXERCISE') {
      const workout = await replaceExercise(
        userId,
        eventPayload.exerciseIndex,
        eventPayload.newExerciseId
      );
      if (!!workout) {
        broadcastWorkoutUpdate(userId, workout);
      }
    }
  } catch (e) {
    getLogger().error(e);
  }
};

export const broadcastWorkoutUpdate = (
  userId: string,
  workout: Partial<IWorkout> | null
) =>
  Array.from(wsInstance.getWss().clients)
    //@ts-ignore
    .filter((client) => client.id === userId)
    .forEach((client) => client.send(JSON.stringify(workout)));
