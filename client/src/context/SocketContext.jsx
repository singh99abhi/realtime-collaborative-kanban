import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected' | 'error'
  const [viewers, setViewers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnectionStatus('disconnected');
      setViewers([]);
      return;
    }

    setConnectionStatus('connecting');

    // Connect to backend Socket.IO server
    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
      setConnectionStatus('error');
    });

    socket.on('presence:update', ({ viewers: liveViewers }) => {
      setViewers(liveViewers || []);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    };
  }, [token, isAuthenticated]);

  const joinBoard = (boardId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('board:join', { boardId });
    }
  };

  const leaveBoard = (boardId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('board:leave', { boardId });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connectionStatus,
      viewers,
      joinBoard,
      leaveBoard
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
