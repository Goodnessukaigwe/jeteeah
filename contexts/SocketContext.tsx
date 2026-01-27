"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export enum PowerUpType {
  SPEED_BOOST = 'speed_boost',
  SHIELD = 'shield',
  CUT = 'cut',
  DOUBLE_POINTS = 'double_points'
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  spawnTime: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  expiresAt: number;
}

interface PlayerSnake {
  id: string;
  name: string;
  snake: { x: number; y: number }[];
  direction: { x: number; y: number };
  alive: boolean;
  score: number;
  color: number;
  isReady: boolean;
  isHost: boolean;
  activePowerUps?: ActivePowerUp[];
}

interface RoomState {
  roomCode: string;
  players: PlayerSnake[];
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
}

interface GameState {
  players: PlayerSnake[];
  food: { x: number; y: number };
  powerUps?: PowerUp[];
  status: 'waiting' | 'playing' | 'finished';
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  roomState: RoomState | null;
  gameState: GameState | null;
  error: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  roomState: null,
  gameState: null,
  error: null,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Prevent duplicate connections
    if (socketRef.current) return;

    // Only connect if API URL is configured
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.log('ℹ️ Socket.IO disabled - no API URL configured');
      return;
    }

    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('⚠️ Socket.IO disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
      setError(`Connection failed: ${err.message}`);
    });

    // Game events
    newSocket.on('error', (data: any) => {
      const message = typeof data === 'string' ? data : data?.message || 'Unknown error';
      console.error('⚠️ Server error:', message);
      setError(message);
    });

    newSocket.on('room_state', (data: RoomState) => {
      setRoomState(data);
      setError(null);
    });

    newSocket.on('game_update', (data: GameState) => {
      setGameState(data);
    });

    // Cleanup only on app unmount (not on page navigation)
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, roomState, gameState, error }}>
      {children}
    </SocketContext.Provider>
  );
}
