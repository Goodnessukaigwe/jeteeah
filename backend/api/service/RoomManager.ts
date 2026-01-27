import { GameRoomClass } from './GameRoom';
import { config } from '../config/config';

class RoomManagerClass {
  private rooms: Map<string, GameRoomClass>;

  constructor() {
    this.rooms = new Map();
  }

  // Generate unique room code
  private generateRoomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    
    do {
      code = '';
      for (let i = 0; i < config.room.codeLength; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (this.rooms.has(code)); // Ensure uniqueness

    return code;
  }

  // Create a new room
  createRoom(hostId: string, hostName: string): GameRoomClass {
    if (this.rooms.size >= config.room.maxRooms) {
      throw new Error('Maximum number of rooms reached');
    }

    const roomCode = this.generateRoomCode();
    const room = new GameRoomClass(roomCode, hostId, hostName);
    this.rooms.set(roomCode, room);

    console.log(`✅ Room created: ${roomCode} by ${hostName}`);
    return room;
  }

  // Get a room by code
  getRoom(roomCode: string): GameRoomClass | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  // Join an existing room
  joinRoom(roomCode: string, playerId: string, playerName: string): GameRoomClass {
    const room = this.getRoom(roomCode);
    
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.isFull()) {
      throw new Error('Room is full');
    }

    if (room.getStatus() !== 'waiting') {
      throw new Error('Game already started');
    }

    room.addPlayer(playerId, playerName);
    console.log(`👥 ${playerName} joined room ${roomCode}`);
    return room;
  }

  // Remove a player from a room
  leaveRoom(roomCode: string, playerId: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    room.removePlayer(playerId);
    
    // If room is empty, delete it
    if (room.isEmpty()) {
      this.deleteRoom(roomCode);
      console.log(`🗑️ Room ${roomCode} deleted (empty)`);
    }

    return true;
  }

  // Delete a room
  deleteRoom(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    if (room) {
      room.stopGame(); // Stop game loop if running
    }
    const deleted = this.rooms.delete(roomCode.toUpperCase());
    if (deleted) {
      console.log(`❌ Room ${roomCode} deleted`);
    }
    return deleted;
  }

  // Get all active rooms (for admin/debugging)
  getAllRooms(): GameRoomClass[] {
    return Array.from(this.rooms.values());
  }

  // Find which room a player is in
  findPlayerRoom(playerId: string): GameRoomClass | undefined {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) {
        return room;
      }
    }
    return undefined;
  }

  // Get room count
  getRoomCount(): number {
    return this.rooms.size;
  }
}

// Export singleton instance
export const RoomManager = new RoomManagerClass();
