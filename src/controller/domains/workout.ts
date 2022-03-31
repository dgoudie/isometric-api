import { IWorkout, WSWorkoutUpdate } from '@dgoudie/isometric-types';
import {
  discardWorkout,
  endWorkout,
  getActiveWorkout,
  persistSetComplete,
  persistSetRepetitions,
  persistSetResistance,
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

    getActiveWorkout(userId).then((workout) => {
      ws.send(JSON.stringify(workout));
    });
  });
};

const handleMessage = async (event: WebSocket.MessageEvent) => {
  try {
    //@ts-ignore
    const userId = event.target.id;
    const eventPayload: WSWorkoutUpdate = JSON.parse(event.data as string);
    if (eventPayload.type === 'START') {
      const workout = await startWorkout(userId);
      broadcastWorkoutUpdate(userId, workout);
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
    } else if (eventPayload.type === 'END') {
      await endWorkout(userId);
      broadcastWorkoutUpdate(userId, null);
    } else if (eventPayload.type === 'DISCARD') {
      await discardWorkout(userId);
      broadcastWorkoutUpdate(userId, null);
    }
  } catch (e) {
    getLogger().error(e);
  }
};

export const broadcastWorkoutUpdate = (
  userId: string,
  workout: IWorkout | null
) =>
  Array.from(wsInstance.getWss().clients)
    //@ts-ignore
    .filter((client) => client.id === userId)
    .forEach((client) => client.send(JSON.stringify(workout)));
