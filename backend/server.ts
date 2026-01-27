import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { config } from './api/config/config';
import { setupSocketHandlers } from './api/config/socket.handlers';

const server = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
  },
});

// Setup socket event handlers
setupSocketHandlers(io);

server.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`🎮 WebSocket server ready for multiplayer connections`);
});

export { io };