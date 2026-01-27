export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  x: number;
  y: number;
}

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

export interface PlayerSnake {
  id: string;
  name: string;
  snake: Position[];
  direction: Direction;
  nextDirection: Direction; // For queuing direction changes
  alive: boolean;
  score: number;
  color: number;
  isReady: boolean;
  isHost: boolean;
  activePowerUps?: ActivePowerUp[];
}

export interface Food {
  x: number;
  y: number;
}

export interface GameSettings {
  gridSize: number;
  gameSpeed: number; // ms per tick
  maxPlayers: number;
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished'
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

// Socket Event Payloads
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

// Socket Event Responses
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

export interface PlayerJoinedResponse {
  player: PlayerSnake;
}

export interface PlayerLeftResponse {
  playerId: string;
}

export interface PlayerEliminatedResponse {
  playerId: string;
  playerName: string;
}

export interface GameOverResponse {
  winner: PlayerSnake | null;
  finalScores: { id: string; name: string; score: number }[];
}
