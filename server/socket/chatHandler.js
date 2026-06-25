const Message = require('../models/Message');
const Room = require('../models/Room');

// In-memory tracking: Map<roomName, Map<userId, { displayName, avatar, socketId }>>
const roomUsers = new Map();

function getActiveUsers(roomName) {
  const users = roomUsers.get(roomName);
  if (!users) return [];
  return Array.from(users.values()).map(({ displayName, avatar }) => ({
    displayName,
    avatar,
  }));
}

function addUserToRoom(roomName, userId, userInfo) {
  if (!roomUsers.has(roomName)) {
    roomUsers.set(roomName, new Map());
  }
  roomUsers.get(roomName).set(userId, userInfo);
}

function removeUserFromAllRooms(socketId) {
  const result = { roomName: null, displayName: null };
  for (const [roomName, users] of roomUsers) {
    for (const [userId, info] of users) {
      if (info.socketId === socketId) {
        result.roomName = roomName;
        result.displayName = info.displayName;
        users.delete(userId);
        if (users.size === 0) roomUsers.delete(roomName);
        return result;
      }
    }
  }
  return result;
}

module.exports = function chatHandler(io, socket) {
  socket.on('join-room', async (roomName) => {
    try {
      if (!roomName || typeof roomName !== 'string') return;
      const trimmed = roomName.trim().slice(0, 50);
      if (!trimmed) return;

      let room = await Room.findOne({ name: trimmed });
      if (!room) {
        room = await Room.create({ name: trimmed });
      }

      const { userId, displayName, avatar } = socket.user;
      socket.join(trimmed);
      addUserToRoom(trimmed, userId, { displayName, avatar, socketId: socket.id });

      socket.emit('room-joined', { roomName: trimmed });
      socket.to(trimmed).emit('user-joined', { displayName });
      io.to(trimmed).emit('active-users', getActiveUsers(trimmed));
    } catch (err) {
      console.error('join-room error:', err.message);
      socket.emit('error-message', { error: 'Failed to join room' });
    }
  });

  socket.on('send-message', async (roomName, text) => {
    try {
      if (!roomName || !text || typeof text !== 'string') return;
      const trimmedText = text.trim().slice(0, 2000);
      if (!trimmedText) return;

      const room = await Room.findOne({ name: roomName });
      if (!room) return;

      const message = await Message.create({
        text: trimmedText,
        user: socket.user.userId,
        room: room._id,
      });

      io.to(roomName).emit('message', {
        id: message._id,
        text: message.text,
        user: socket.user.displayName,
        avatar: socket.user.avatar,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('send-message error:', err.message);
      socket.emit('error-message', { error: 'Failed to send message' });
    }
  });

  socket.on('leave-room', (roomName) => {
    if (!roomName) return;
    socket.leave(roomName);
    const { displayName } = socket.user;
    const users = roomUsers.get(roomName);
    if (users) {
      users.delete(socket.user.userId);
      if (users.size === 0) roomUsers.delete(roomName);
    }
    socket.to(roomName).emit('user-left', { displayName });
    io.to(roomName).emit('active-users', getActiveUsers(roomName));
  });

  socket.on('disconnect', () => {
    const { roomName, displayName } = removeUserFromAllRooms(socket.id);
    if (roomName) {
      socket.to(roomName).emit('user-left', { displayName });
      io.to(roomName).emit('active-users', getActiveUsers(roomName));
    }
  });
};
