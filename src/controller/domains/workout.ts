import {
    IWorkout,
    WSWorkoutUpdate,
    WsBroadcastMessage,
} from '@dgoudie/isometric-types';
import {
    discardWorkout,
    endWorkout,
    getActiveWorkout,
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

const handleMessage = (event: WebSocket.MessageEvent) => {
    //@ts-ignore
    const userId = event.target.id;
    const eventPayload: WSWorkoutUpdate = JSON.parse(event.data as string);
    if (eventPayload.type === 'START') {
        startWorkout(userId).then((workout) =>
            broadcastWorkoutUpdate(userId, workout)
        );
    } else if (eventPayload.type === 'END') {
        endWorkout(userId).then(() => broadcastWorkoutUpdate(userId, null));
    } else if (eventPayload.type === 'DISCARD') {
        discardWorkout(userId).then(() => broadcastWorkoutUpdate(userId, null));
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
