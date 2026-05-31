const WebSocket = require('ws');
const url = require('url');
const { verifyAccessToken } = require('../utils/jwt');

let wss = null;
const clients = new Map(); // maps userId -> Set of WS connections

// initialize ws server on dedicated port
function initWebSocket() {
  const port = process.env.WS_PORT || 8080;
  
  wss = new WebSocket.Server({ port });
  console.log(`WebSocket server running on port ${port}`);

  wss.on('connection', (ws, req) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      const token = parsedUrl.query.token;

      if (!token) {
        ws.close(4001, 'Unauthorized: Access token query param required');
        return;
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        ws.close(4002, 'Unauthorized: Invalid or expired token');
        return;
      }

      const userId = decoded.userId;
      ws.userId = userId;

      if (!clients.has(userId)) {
        clients.set(userId, new Set());
      }
      clients.get(userId).add(ws);

      console.log(`WebSocket client connected for user: ${userId}`);

      ws.on('close', () => {
        const userSessions = clients.get(userId);
        if (userSessions) {
          userSessions.delete(ws);
          if (userSessions.size === 0) {
            clients.delete(userId);
          }
        }
        console.log(`WebSocket client disconnected for user: ${userId}`);
      });
    } catch (err) {
      ws.close(4000, 'Internal connection error');
    }
  });
}

// push notifications to a user across all active sessions
function notifyUser(userId, payload) {
  const userSessions = clients.get(userId);
  if (!userSessions) return;

  const data = JSON.stringify(payload);
  for (const ws of userSessions) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

module.exports = {
  initWebSocket,
  notifyUser,
};
