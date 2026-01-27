import { Server, Socket } from 'socket.io';
import { RoomManager } from '../service/RoomManager';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  ChangeDirectionPayload,
  RoomCreatedResponse,
  RoomStateResponse,
  GameStateResponse,
  PlayerJoinedResponse,
  PlayerLeftResponse,
  PlayerEliminatedResponse,
  GameOverResponse,
} from '../types/game.types';

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {

    // CREATE ROOM
    socket.on('create_room', (payload: CreateRoomPayload) => {
      try {
        const playerName = 'Creator'; // Auto-generate name for room creator
        const room = RoomManager.createRoom(socket.id, playerName);
        
        // Join socket room
        socket.join(room.getRoomCode());

        // Send response
        const response: RoomCreatedResponse = {
          roomCode: room.getRoomCode(),
          playerId: socket.id,
        };
        socket.emit('room_created', response);

        // Send initial room state
        emitRoomState(io, room.getRoomCode());
      } catch (error: any) {
        console.error('❌ Create room error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // JOIN ROOM
    socket.on('join_room', (payload: JoinRoomPayload) => {
      try {
        const { roomCode } = payload;
        const playerName = 'Guest'; // Auto-generate name for joiners
        const room = RoomManager.joinRoom(roomCode, socket.id, playerName);
        
        // Join socket room
        socket.join(roomCode.toUpperCase());

        // Notify all players in room
        const player = room.getPlayer(socket.id);
        if (player) {
          const joinResponse: PlayerJoinedResponse = { player };
          io.to(roomCode.toUpperCase()).emit('player_joined', joinResponse);
        }

        // Send room state to new player
        emitRoomState(io, roomCode);
      } catch (error: any) {
        console.error('❌ Join room error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // PLAYER READY
    socket.on('player_ready', () => {
      const room = RoomManager.findPlayerRoom(socket.id);
      if (!room) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      room.toggleReady(socket.id);
      emitRoomState(io, room.getRoomCode());
      console.log(`✅ Player ${socket.id} toggled ready in ${room.getRoomCode()}`);
    });

    // START GAME
    socket.on('start_game', () => {
      const room = RoomManager.findPlayerRoom(socket.id);
      if (!room) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }

      if (room.getHostId() !== socket.id) {
        socket.emit('error', { message: 'Only host can start game' });
        return;
      }

      if (!room.canStartGame()) {
        socket.emit('error', { message: 'Cannot start game yet' });
        return;
      }

      // Start game with update callback
      room.startGame(() => {
        // Emit game state update
        emitGameState(io, room.getRoomCode());

        // Check for eliminated players
        const players = room.getPlayers();
        players.forEach((player) => {
          if (!player.alive) {
            const eliminatedResponse: PlayerEliminatedResponse = {
              playerId: player.id,
              playerName: player.name,
            };
            io.to(room.getRoomCode()).emit('player_eliminated', eliminatedResponse);
          }
        });

        // Check for game over
        if (room.getStatus() === 'finished') {
          const winner = room.getWinner();
          const finalScores = players
            .map((p) => ({ id: p.id, name: p.name, score: p.score }))
            .sort((a, b) => b.score - a.score);

          const gameOverResponse: GameOverResponse = {
            winner,
            finalScores,
          };
          io.to(room.getRoomCode()).emit('game_over', gameOverResponse);
        }
      });

      // Emit room state update (status changed to 'playing')
      emitRoomState(io, room.getRoomCode());
      
      // Emit initial game state
      emitGameState(io, room.getRoomCode());
      
      io.to(room.getRoomCode()).emit('game_started');
    });

    // CHANGE DIRECTION
    socket.on('change_direction', (payload: ChangeDirectionPayload) => {
      const room = RoomManager.findPlayerRoom(socket.id);
      if (!room) return;

      room.changeDirection(socket.id, payload.direction);
    });

    // LEAVE ROOM
    socket.on('leave_room', () => {
      handlePlayerLeave(socket, io);
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      handlePlayerLeave(socket, io);
    });
  });
};

// Helper: Emit room state to all players in room
function emitRoomState(io: Server, roomCode: string) {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return;

  const response: RoomStateResponse = {
    roomCode: room.getRoomCode(),
    players: room.getPlayers(),
    hostId: room.getHostId(),
    status: room.getStatus(),
  };

  io.to(roomCode.toUpperCase()).emit('room_state', response);
}

// Helper: Emit game state to all players in room
function emitGameState(io: Server, roomCode: string) {
  const room = RoomManager.getRoom(roomCode);
  if (!room) return;

  const response: GameStateResponse = {
    players: room.getPlayers(),
    food: room.getFood(),
    powerUps: room.getPowerUps(),
    status: room.getStatus(),
  };

  io.to(roomCode.toUpperCase()).emit('game_update', response);
}

// Helper: Handle player leaving
function handlePlayerLeave(socket: Socket, io: Server) {
  const room = RoomManager.findPlayerRoom(socket.id);
  if (!room) return;

  const roomCode = room.getRoomCode();
  const player = room.getPlayer(socket.id);
  
  // Leave socket room
  socket.leave(roomCode);

  // Remove from game room
  RoomManager.leaveRoom(roomCode, socket.id);

  // Notify others
  const leftResponse: PlayerLeftResponse = {
    playerId: socket.id,
  };
  io.to(roomCode).emit('player_left', leftResponse);

  // Update room state
  if (!room.isEmpty()) {
    emitRoomState(io, roomCode);
  }

  console.log(`👋 ${player?.name || socket.id} left room ${roomCode}`);
}
