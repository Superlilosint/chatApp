const { Server } = require('socket.io');
const socketAuth = require('../middleware/socketAuth');
const chatHandler = require('./chatHandler');
const env = require('../config/env');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.nodeEnv === 'production' ? false : env.clientUrl,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.displayName} (${socket.id})`);
    chatHandler(io, socket);
  });

  return io;
}

module.exports = initSocket;
