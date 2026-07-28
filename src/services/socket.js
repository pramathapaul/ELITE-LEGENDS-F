import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io('/', {
    query: { userId },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoomSocket = (roomId, user) => {
  socket?.emit('join-room', { roomId, user });
};

export const leaveRoomSocket = (roomId, user) => {
  socket?.emit('leave-room', { roomId, user });
};

export const sendChatMessage = (roomId, message, user) => {
  socket?.emit('chat-message', { roomId, message, user });
};

export const placeBid = (roomId, playerId, bidAmount, user) => {
  socket?.emit('place-bid', { roomId, playerId, bidAmount, user });
};

export const startAuction = (roomId) => {
  socket?.emit('start-auction', { roomId });
};

export const pauseAuction = (roomId) => {
  socket?.emit('pause-auction', { roomId });
};

export const resumeAuction = (roomId) => {
  socket?.emit('resume-auction', { roomId });
};

export const endAuction = (roomId) => {
  socket?.emit('end-auction', { roomId });
};

export const assignPlayers = (roomId) => {
  socket?.emit('assign-players', { roomId });
};

export const forceSell = (roomId, user) => {
  socket?.emit('force-sell', { roomId, user });
};
