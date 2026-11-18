const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.IO handler for real-time messaging and notifications
 */
const initSocket = (io) => {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Socket connected: ${socket.user.firstName} (${userId})`);

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Join conversation rooms
    socket.on('join:conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`${socket.user.firstName} joined conversation ${conversationId}`);
    });

    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId,
        name: socket.user.firstName,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.firstName}`);
    });
  });

  return io;
};

module.exports = { initSocket };

