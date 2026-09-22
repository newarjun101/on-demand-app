import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { env } from '../config/env';

let io: Server | null = null;

interface AuthedSocket extends Socket {
  user?: JwtPayload;
}

export function initSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket: AuthedSocket, next) => {
    try {
      let token: string | undefined;
      const auth = socket.handshake.auth as Record<string, any>;
      if (auth?.token) token = String(auth.token);
      if (!token) token = socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket: AuthedSocket) => {
    if (socket.user) {
      const room = `user:${socket.user.sub}`;
      socket.join(room);
      socket.join(`app:${socket.user.app ?? 'CUSTOMER_WEB'}`);
      // eslint-disable-next-line no-console
      console.log(`[socket] user ${socket.user.sub} (${socket.user.role}) connected`);
      socket.emit('connected', { userId: socket.user.sub, role: socket.user.role });
    }
    socket.on('typing', ({ conversationId }: { conversationId: string }) => {
      const room = socket.user ? `user:${socket.user.sub}` : null;
      // broadcast to other users in conversation: rely on the API to emit
      if (room) socket.to(room).emit('typing_typing', { conversationId, userId: socket.user?.sub });
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToUsers(userIds: string[], event: string, data: any) {
  if (!io) return;
  userIds.forEach((id) => io!.to(`user:${id}`).emit(event, data));
}

export function emitToApp(app: 'CUSTOMER_WEB' | 'WORKER_WEB', event: string, data: any) {
  if (!io) return;
  io.to(`app:${app}`).emit(event, data);
}