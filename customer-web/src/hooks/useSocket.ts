import { useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '@/services/socket';
import { useAuth } from '@/contexts/AuthContext';

export function useSocket() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setConnected(false);
      return;
    }
    const socket = connectSocket();
    if (!socket) return;
    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [user?.id]);

  return connected;
}

export function useSocketEvent<T = any>(event: string, handler: (data: T) => void) {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    if (!socket) return;
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [user?.id, event]);
}