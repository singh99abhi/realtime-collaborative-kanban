const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { getDatabase } = require('../db/database');

let ioInstance = null;

// Track active board viewers: { [boardId]: Map<socketId, { userId, name, avatar }> }
const boardViewers = {};

function initSocket(io) {
  ioInstance = io;

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const db = getDatabase();
      const user = db.prepare('SELECT id, name, email, avatar_url FROM users WHERE id = ?').get(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Client joins a specific board room
    socket.on('board:join', ({ boardId }) => {
      const room = `board:${boardId}`;
      socket.join(room);
      socket.currentBoardId = boardId;

      if (!boardViewers[boardId]) {
        boardViewers[boardId] = new Map();
      }

      boardViewers[boardId].set(socket.id, {
        userId: socket.user.id,
        name: socket.user.name,
        email: socket.user.email,
        avatar_url: socket.user.avatar_url
      });

      // Broadcast active viewers list to the room
      const viewers = Array.from(boardViewers[boardId].values());
      io.to(room).emit('presence:update', { boardId, viewers });
    });

    // Client leaves board room
    socket.on('board:leave', ({ boardId }) => {
      const room = `board:${boardId}`;
      socket.leave(room);

      if (boardViewers[boardId]) {
        boardViewers[boardId].delete(socket.id);
        const viewers = Array.from(boardViewers[boardId].values());
        io.to(room).emit('presence:update', { boardId, viewers });
      }
    });

    // Card moving event initiated directly via WebSocket (for instant optimism)
    socket.on('card:move', (payload) => {
      // Broadcast to other clients in room
      socket.to(`board:${payload.boardId}`).emit('card:moved', payload);
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      const boardId = socket.currentBoardId;
      if (boardId && boardViewers[boardId]) {
        boardViewers[boardId].delete(socket.id);
        const viewers = Array.from(boardViewers[boardId].values());
        io.to(`board:${boardId}`).emit('presence:update', { boardId, viewers });
      }
    });
  });

  return io;
}

function broadcastToBoard(boardId, event, data, senderSocketId = null) {
  if (!ioInstance) return;
  const room = `board:${boardId}`;
  if (senderSocketId) {
    ioInstance.to(room).except(senderSocketId).emit(event, data);
  } else {
    ioInstance.to(room).emit(event, data);
  }
}

function getIo() {
  return ioInstance;
}

module.exports = {
  initSocket,
  broadcastToBoard,
  getIo
};
