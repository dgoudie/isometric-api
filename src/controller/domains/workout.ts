import { IWorkout, WsBroadcastMessage } from '@dgoudie/isometric-types';
import { getActiveWorkout, startWorkout } from '../../database/domains/workout';

import WebSocket from 'ws';
import { getLogger } from 'log4js';
import { getUserId } from '../../utils/get-user-id';
import ws from 'express-ws';

let wsInstance: ws.Instance;

export const initWorkout = (app: ws.Application, instance: ws.Instance) => {
    wsInstance = instance;
    app.ws('/workout', function (ws, req) {
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
    if (event.data === 'START') {
        startWorkout(userId).then((workout) =>
            broadcastWorkoutUpdate(userId, workout)
        );
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
