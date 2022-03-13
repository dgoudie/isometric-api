import { WsBroadcastMessage } from '@dgoudie/isometric-types';
import { getLogger } from 'log4js';
import { getUserId } from '../utils/get-user-id';
import ws from 'express-ws';

let wsInstance: ws.Instance;

export const init = (app: ws.Application, instance: ws.Instance) => {
    wsInstance = instance;
    app.ws('/api', function (ws, req) {
        const userId = getUserId(req);
        //@ts-ignore
        ws.id = userId;
        getLogger().info(
            `Websocket connection established (${req.ip}). Client count: ${
                instance.getWss().clients.size
            }. User ID: ${userId}`
        );
        ws.on('close', (code) =>
            getLogger().info(
                `Websocket connection closed (${
                    req.ip
                }; Code: ${code}). Client count: ${
                    instance.getWss().clients.size
                }`
            )
        );
    });
};

export const broadcastUpdateToWebsocketClients = (
    userId: string,
    apiPath: string
) =>
    broadcastToWebsocketClients(userId, {
        apiPath,
        type: 'UPDATE',
        timestamp: Date.now(),
    });

export const broadcastToWebsocketClients = (
    userId: string,
    message: WsBroadcastMessage
) => {
    Array.from(wsInstance.getWss().clients)
        //@ts-ignore
        .filter((client) => client.id === userId)
        .forEach((client) => client.send(JSON.stringify(message)));
};
