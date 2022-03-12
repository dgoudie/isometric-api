import { WsBroadcastMessage } from '@dgoudie/isometric-types';
import { getLogger } from 'log4js';
import ws from 'express-ws';

let wsInstance: ws.Instance;

export const init = (app: ws.Application, instance: ws.Instance) => {
  wsInstance = instance;
  app.ws('/api', function (ws, req) {
    getLogger().info(
      `Websocket connection established (${req.ip}). Client count: ${
        instance.getWss().clients.size
      }`
    );
    ws.on('close', (code) =>
      getLogger().info(
        `Websocket connection closed (${
          req.ip
        }; Code: ${code}). Client count: ${instance.getWss().clients.size}`
      )
    );
  });
};

export const broadcastUpdateToWebsocketClients = (apiPath: string) =>
  broadcastToWebsocketClients({
    apiPath,
    type: 'UPDATE',
    timestamp: Date.now(),
  });

export const broadcastToWebsocketClients = (message: WsBroadcastMessage) => {
  wsInstance
    .getWss()
    .clients.forEach((client) => client.send(JSON.stringify(message)));
};
