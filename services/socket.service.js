const userRepository = require('../repositories/user.repository');

function initializeSocket(io) {
  io.on('connection', (socket) => {
    // Check if admin on connection
    const sessionID = socket.handshake.sid;
    
    socket.on('join-admin', async (data, callback) => {
      // Verify admin session from the handshake auth
      const isAdmin = socket.request.session?.admin;
      
      if (!isAdmin) {
        return callback({ success: false, message: 'Unauthorized' });
      }

      socket.join('admin-room');
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      // Handle disconnect
    });
  });
}

function emitNewUserJoined(io, user) {
  io.to('admin-room').emit('new-user-joined', {
    user,
    timestamp: new Date().toISOString(),
  });
}

function emitUserApproved(io, userId) {
  io.to('admin-room').emit('user-approved', {
    userId,
    timestamp: new Date().toISOString(),
  });
}

function emitUserBanned(io, userId) {
  io.to('admin-room').emit('user-banned', {
    userId,
    timestamp: new Date().toISOString(),
  });
}

function emitUserRemoved(io, userId) {
  io.to('admin-room').emit('user-removed', {
    userId,
    timestamp: new Date().toISOString(),
  });
}

function emitUserRestored(io, userId) {
  io.to('admin-room').emit('user-restored', {
    userId,
    timestamp: new Date().toISOString(),
  });
}

async function emitStatsUpdated(io) {
  const stats = await userRepository.getStatistics();
  io.to('admin-room').emit('stats-updated', {
    stats,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  initializeSocket,
  emitNewUserJoined,
  emitUserApproved,
  emitUserBanned,
  emitUserRemoved,
  emitUserRestored,
  emitStatsUpdated,
};
