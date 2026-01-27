# Backend Architecture Documentation

Detailed technical documentation for the Jeteeah multiplayer backend service.

## Overview

The backend is a **Node.js + Express + Socket.IO** service that manages real-time multiplayer snake game sessions. It handles room management, game logic, collision detection, and real-time state synchronization.

**Tech Stack:**

- **Runtime**: Node.js 20
- **Framework**: Express.js 5
- **WebSocket**: Socket.IO 4.8
- **Language**: TypeScript 5.9
- **Port**: 3001 (configurable via `PORT` env var)

## Project Structure

```
backend/
├── api/
│   ├── config/
│   │   ├── config.ts              # Configuration and settings
│   │   └── socket.handlers.ts     # Socket.IO event handlers
│   ├── service/
│   │   ├── RoomManager.ts         # Room lifecycle management
│   │   └── GameRoom.ts            # Game logic and state
│   └── types/
│       └── game.types.ts          # TypeScript type definitions
├── app.ts                         # Express app setup
├── server.ts                      # Server entry point
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── Dockerfile                     # Docker configuration
└── .env.example                   # Environment variables template
```

## Core Modules

### 1. Server Entry Point

**File**: [`server.ts`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/backend/server.ts)

Initializes the HTTP server and Socket.IO:

```typescript
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { setupSocketHandlers } from "./api/config/socket.handlers";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    methods: ["GET", "POST"],
  },
});

setupSocketHandlers(io);
server.listen(config.port);
```

**Responsibilities:**

- Create HTTP server from Express app
- Initialize Socket.IO with CORS configuration
- Setup WebSocket event handlers
- Start listening on configured port

---

### 2. Express Application

**File**: [`app.ts`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/backend/app.ts)

Minimal Express app with health check endpoints:

```typescript
import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Server status
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    roomCount: RoomManager.getRoomCount(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

**Endpoints:**

- `GET /health` - Health check for monitoring
- `GET /api/status` - Server statistics (room count, uptime)

---

### 3. Configuration

**File**: [`api/config/config.ts`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/backend/api/config/config.ts)

Centralized configuration:

```typescript
export const config = {
  port: process.env.PORT,
  corsOrigins: [process.env.FRONTEND_URL, process.env.FRONTEND_TEST_URL],

  game: {
    gridSize: 20, // 20x20 grid
    gameSpeed: 200, // 200ms per tick (5 FPS)
    maxPlayers: 8, // Max 8 players per room
    minPlayers: 2, // Min 2 players to start
  },

  room: {
    codeLength: 6, // 6-character room codes
    maxRooms: 100, // Max 100 simultaneous rooms
  },
};
```

**Configuration Categories:**

- **Server**: Port, CORS origins
- **Game Settings**: Grid size, speed, player limits
- **Room Settings**: Code length, room limits

---

### 4. Socket Event Handlers

**File**: [`api/config/socket.handlers.ts`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/backend/api/config/socket.handlers.ts)

Handles all WebSocket events:

#### Event: `create_room`

```typescript
socket.on("create_room", (payload: CreateRoomPayload) => {
  const room = RoomManager.createRoom(socket.id, playerName);
  socket.join(room.getRoomCode());
  socket.emit("room_created", { roomCode, playerId: socket.id });
  emitRoomState(io, room.getRoomCode());
});
```

#### Event: `join_room`

```typescript
socket.on("join_room", (payload: JoinRoomPayload) => {
  const room = RoomManager.joinRoom(roomCode, socket.id, playerName);
  socket.join(roomCode.toUpperCase());
  io.to(roomCode).emit("player_joined", { player });
  emitRoomState(io, roomCode);
});
```

#### Event: `start_game`

```typescript
socket.on("start_game", () => {
  const room = RoomManager.findPlayerRoom(socket.id);

  // Validate: host only, enough players, all ready
  if (!room.canStartGame()) return;

  // Start game loop with callback
  room.startGame(() => {
    emitGameState(io, room.getRoomCode());
    // Check eliminations and game over
  });
});
```

#### Event: `change_direction`

```typescript
socket.on("change_direction", (payload: ChangeDirectionPayload) => {
  const room = RoomManager.findPlayerRoom(socket.id);
  room.changeDirection(socket.id, payload.direction);
});
```

#### Event: `disconnect`

```typescript
socket.on("disconnect", () => {
  handlePlayerLeave(socket, io);
  // Remove from room, notify others, cleanup
});
```

**Helper Functions:**

- `emitRoomState()` - Broadcast room state to all players
- `emitGameState()` - Broadcast game state during gameplay
- `handlePlayerLeave()` - Clean up when player disconnects

---

### 5. Room Manager (Singleton)

**File**: [`api/service/RoomManager.ts`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/backend/api/service/RoomManager.ts)

Manages all game rooms:

```typescript
class RoomManagerClass {
  private rooms: Map<string, GameRoomClass>;

  // Generate unique 6-char room code
  private generateRoomCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code: string;
    do {
      code = ""; // Generate random code
    } while (this.rooms.has(code)); // Ensure uniqueness
    return code;
  }

  // Create new room
  createRoom(hostId: string, hostName: string): GameRoomClass {
    if (this.rooms.size >= config.room.maxRooms) {
      throw new Error("Maximum number of rooms reached");
    }
    const roomCode = this.generateRoomCode();
    const room = new GameRoomClass(roomCode, hostId, hostName);
    this.rooms.set(roomCode, room);
    return room;
  }

  // Join existing room
  joinRoom(
    roomCode: string,
    playerId: string,
    playerName: string,
  ): GameRoomClass {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.isFull()) throw new Error("Room is full");
    if (room.getStatus() !== "waiting") throw new Error("Game already started");

    room.addPlayer(playerId, playerName);
    return room;
  }

  // Remove player from room
  leaveRoom(roomCode: string, playerId: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    room.removePlayer(playerId);

    // Auto-delete empty rooms
    if (room.isEmpty()) {
      this.deleteRoom(roomCode);
    }
    return true;
  }

  // Find which room a player is in
  findPlayerRoom(playerId: string): GameRoomClass | undefined {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) return room;
    }
    return undefined;
  }
}

export const RoomManager = new RoomManagerClass();
```

**Key Methods:**

- `createRoom()` - Create new room with unique code
- `joinRoom()` - Add player to existing room
- `leaveRoom()` - Remove player, cleanup if empty
- `findPlayerRoom()` - Locate player's current room
- `getRoomCount()` - Get active room count

---

### 6. Game Room

**File**: [`api/service/GameRoom.ts`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/backend/api/service/GameRoom.ts)

Core game logic for individual rooms:

#### Player Management

```typescript
addPlayer(playerId: string, playerName: string, isHost: boolean = false): PlayerSnake {
  const color = this.room.players.size; // Color based on join order
  const startPos = this.getRandomStartPosition();

  const player: PlayerSnake = {
    id: playerId,
    name: playerName,
    snake: [startPos],
    direction: { x: 0, y: 0 },
    alive: true,
    score: 0,
    color,
    isReady: isHost, // Host auto-ready
    isHost,
  };

  this.room.players.set(playerId, player);
  return player;
}

removePlayer(playerId: string): boolean {
  const removed = this.room.players.delete(playerId);

  // Transfer host if needed
  if (playerId === this.room.hostId && this.room.players.size > 0) {
    const newHost = Array.from(this.room.players.values())[0];
    this.room.hostId = newHost.id;
    newHost.isHost = true;
    newHost.isReady = true;
  }

  return removed;
}
```

#### Game Loop

```typescript
startGame(onUpdate: (room: GameRoom) => void): void {
  if (!this.canStartGame()) return;

  this.room.status = GameStatus.PLAYING;

  // Reset all players
  this.room.players.forEach((player) => {
    player.snake = [this.getRandomStartPosition()];
    player.alive = true;
    player.score = 0;
  });

  // Generate initial food
  this.room.food = this.generateFood(allSnakes);

  // Start game loop (200ms interval)
  this.room.gameLoop = setInterval(() => {
    this.gameTick();
    onUpdate(this.room); // Emit state to clients
  }, this.room.settings.gameSpeed);

  // Start power-up spawning (10-30s intervals)
  this.startPowerUpSpawning(onUpdate);
}
```

#### Game Tick Logic

```typescript
private gameTick(): void {
  const alivePlayers = Array.from(this.room.players.values())
    .filter((p) => p.alive);

  // Game over if only 1 player left
  if (alivePlayers.length <= 1) {
    this.stopGame();
    return;
  }

  alivePlayers.forEach((player) => {
    // Apply queued direction
    if (player.nextDirection.x !== 0 || player.nextDirection.y !== 0) {
      player.direction = { ...player.nextDirection };
    }

    // Calculate new head position
    const head = player.snake[0];
    let newHead = {
      x: head.x + player.direction.x,
      y: head.y + player.direction.y,
    };

    // Wrap around edges
    if (newHead.x < 0) newHead.x = gridSize - 1;
    if (newHead.x >= gridSize) newHead.x = 0;
    if (newHead.y < 0) newHead.y = gridSize - 1;
    if (newHead.y >= gridSize) newHead.y = 0;

    // Check collisions (unless has shield)
    const hasShield = this.hasActivePowerUp(player, PowerUpType.SHIELD);
    if (!hasShield) {
      // Self-collision
      if (this.checkCollision(newHead, player.snake)) {
        player.alive = false;
        return;
      }

      // Other player collision
      for (const other of alivePlayers) {
        if (other.id !== player.id && this.checkCollision(newHead, other.snake)) {
          player.alive = false;
          return;
        }
      }
    }

    // Check food
    let ateFood = false;
    const pointsMultiplier = this.hasActivePowerUp(player, PowerUpType.DOUBLE_POINTS) ? 2 : 1;

    if (newHead.x === this.room.food.x && newHead.y === this.room.food.y) {
      ateFood = true;
      player.score += 5 * pointsMultiplier;
      this.room.food = this.generateFood(allSnakes);
    }

    // Check power-ups
    const powerUpIndex = this.room.powerUps.findIndex(
      (p) => p.x === newHead.x && p.y === newHead.y
    );
    if (powerUpIndex !== -1) {
      this.applyPowerUp(player, this.room.powerUps[powerUpIndex].type);
      this.room.powerUps.splice(powerUpIndex, 1);
    }

    // Update snake
    if (ateFood) {
      player.snake = [newHead, ...player.snake]; // Grow
    } else {
      player.snake = [newHead, ...player.snake.slice(0, -1)]; // Move
    }
  });
}
```

#### Power-Up System

```typescript
private spawnPowerUp(): void {
  if (this.room.powerUps.length >= 3) return; // Max 3 power-ups

  // Find empty position
  let position = this.findEmptyPosition();

  // Random type
  const types = [
    PowerUpType.SPEED_BOOST,
    PowerUpType.SHIELD,
    PowerUpType.CUT,
    PowerUpType.DOUBLE_POINTS,
  ];
  const randomType = types[Math.floor(Math.random() * types.length)];

  const powerUp: PowerUp = {
    id: `powerup-${Date.now()}-${Math.random()}`,
    type: randomType,
    x: position.x,
    y: position.y,
    spawnTime: Date.now(),
  };

  this.room.powerUps.push(powerUp);
}

private applyPowerUp(player: PlayerSnake, type: PowerUpType): void {
  const now = Date.now();

  switch (type) {
    case PowerUpType.SPEED_BOOST:
      player.activePowerUps.push({
        type: PowerUpType.SPEED_BOOST,
        expiresAt: now + 6000, // 6 seconds
      });
      break;

    case PowerUpType.SHIELD:
      player.activePowerUps.push({
        type: PowerUpType.SHIELD,
        expiresAt: now + 4000, // 4 seconds
      });
      break;

    case PowerUpType.CUT:
      // Instant: shrink by 40%, -10 points
      const newLength = Math.max(1, Math.floor(player.snake.length * 0.6));
      player.snake = player.snake.slice(0, newLength);
      player.score = Math.max(0, player.score - 10);
      break;

    case PowerUpType.DOUBLE_POINTS:
      player.activePowerUps.push({
        type: PowerUpType.DOUBLE_POINTS,
        expiresAt: now + 12000, // 12 seconds
      });
      break;
  }
}
```

---

### 7. Type Definitions

**File**: [`api/types/game.types.ts`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/backend/api/types/game.types.ts)

Complete TypeScript type system:

```typescript
// Core game types
export interface Position {
  x: number;
  y: number;
}
export interface Direction {
  x: number;
  y: number;
}

export enum PowerUpType {
  SPEED_BOOST = "speed_boost",
  SHIELD = "shield",
  CUT = "cut",
  DOUBLE_POINTS = "double_points",
}

export interface PlayerSnake {
  id: string;
  name: string;
  snake: Position[];
  direction: Direction;
  nextDirection: Direction;
  alive: boolean;
  score: number;
  color: number;
  isReady: boolean;
  isHost: boolean;
  activePowerUps?: ActivePowerUp[];
}

export enum GameStatus {
  WAITING = "waiting",
  PLAYING = "playing",
  FINISHED = "finished",
}

export interface GameRoom {
  roomCode: string;
  hostId: string;
  players: Map<string, PlayerSnake>;
  food: Food;
  powerUps: PowerUp[];
  status: GameStatus;
  settings: GameSettings;
  gameLoop: NodeJS.Timeout | null;
  createdAt: number;
}

// Socket event payloads and responses
export interface CreateRoomPayload {
  playerName: string;
}
export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}
export interface ChangeDirectionPayload {
  direction: Direction;
}

export interface RoomCreatedResponse {
  roomCode: string;
  playerId: string;
}
export interface RoomStateResponse {
  roomCode: string;
  players: PlayerSnake[];
  hostId: string;
  status: GameStatus;
}
export interface GameStateResponse {
  players: PlayerSnake[];
  food: Food;
  powerUps: PowerUp[];
  status: GameStatus;
}
```

---

## Data Flow

### Room Creation Flow

```
Client                  Server                  RoomManager             GameRoom
  |                       |                         |                       |
  |--create_room--------->|                         |                       |
  |                       |--createRoom()---------->|                       |
  |                       |                         |--new GameRoom()------>|
  |                       |                         |<--room----------------|
  |                       |<--room------------------|                       |
  |<--room_created--------|                         |                       |
  |<--room_state----------|                         |                       |
```

### Game Loop Flow

```
Host                    Server                  GameRoom                Clients
  |                       |                         |                       |
  |--start_game---------->|                         |                       |
  |                       |--startGame()----------->|                       |
  |                       |                         |--setInterval()------->|
  |                       |                         |                       |
  |                       |                         |<--tick (200ms)--------|
  |                       |                         |--gameTick()           |
  |                       |<--onUpdate()------------|                       |
  |<--game_update---------|                         |                       |
  |                       |--game_update----------->|---------------------->|
```

## Environment Variables

```bash
# Server Configuration
PORT=3001                                    # Server port
NODE_ENV=development                         # Environment

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Docker Support

**Dockerfile**: Multi-stage build

```dockerfile
# Development stage
FROM node:20-alpine AS development
WORKDIR /app/backend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app/backend
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

**docker-compose.yml** integration:

```yaml
backend:
  build:
    context: ./backend
    target: development
  ports:
    - "3001:3001"
  environment:
    - PORT=3001
    - CORS_ORIGINS=http://localhost:3000
  networks:
    - linera-network
  healthcheck:
    test: ["CMD", "wget", "--spider", "http://localhost:3001/health"]
```

## API Reference

### REST Endpoints

#### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

#### `GET /api/status`

Server statistics.

**Response:**

```json
{
  "status": "ok",
  "roomCount": 5,
  "uptime": 3600.5,
  "timestamp": "2026-01-27T18:00:00.000Z"
}
```

### WebSocket Events

See [`MULTIPLAYER.md`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/MULTIPLAYER.md) for complete Socket.IO event documentation.

## Performance Metrics

### Resource Usage

- **Memory**: ~1KB per player, ~10KB per room
- **CPU**: Minimal (simple 2D collision detection)
- **Network**: ~500 bytes per game update (5 updates/sec)

### Scalability

- **Max Concurrent Players**: 800 (100 rooms × 8 players)
- **Tick Rate**: 5 FPS (200ms interval)
- **Power-Up Spawn**: 10-30 second intervals

## Testing

### Manual Testing

```bash
# Start backend
npm run dev

# Test health check
curl http://localhost:3001/health

# Test status
curl http://localhost:3001/api/status
```

### Integration Testing

Use Socket.IO client to test events:

```typescript
import io from "socket.io-client";

const socket = io("http://localhost:3001");

socket.emit("create_room", { playerName: "Test" });
socket.on("room_created", (data) => {
  console.log("Room created:", data);
});
```

## Debugging

### Enable Debug Logs

```bash
DEBUG=socket.io:* npm run dev
```

### Common Issues

**Port already in use:**

```bash
lsof -ti:3001 | xargs kill -9
```

**CORS errors:**

- Check `CORS_ORIGINS` in `.env`
- Verify frontend URL matches

**Room not found:**

- Rooms auto-delete when empty
- Check room code case (case-insensitive)

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t jeteeah-backend --target production .
docker run -p 3001:3001 jeteeah-backend
```

### Environment Variables (Production)

```bash
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com
```

## Maintenance

### Monitoring

- Monitor `/health` endpoint for uptime
- Track `/api/status` for room count
- Log player connections/disconnections

### Cleanup

- Empty rooms auto-delete
- Disconnected players auto-removed
- Power-ups expire after spawn

---

**For user-facing documentation, see** [`MULTIPLAYER.md`](file:///home/ayo-ola/Desktop/works/jetaahproj/jeteeah/MULTIPLAYER.md)
