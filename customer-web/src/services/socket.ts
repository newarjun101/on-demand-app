import { io as socketIO, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/client';

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  if (socket?.connected) return socket;
  const url = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:4000';
  const token = getAccessToken();
  socket = socketIO(url, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: { token },
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}