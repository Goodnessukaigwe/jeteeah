import { GameRoom, PlayerSnake, GameStatus, Direction, Position, PowerUp, PowerUpType, ActivePowerUp } from '../types/game.types';
import { config } from '../config/config';

export class GameRoomClass {
  private room: GameRoom;
  private powerUpSpawnInterval: NodeJS.Timeout | null = null;

  constructor(roomCode: string, hostId: string, hostName: string) {
    this.room = {
      roomCode,
      hostId,
      players: new Map(),
      food: { x: 0, y: 0 }, // Temporary, will be set after settings
      powerUps: [],
      status: GameStatus.WAITING,
      settings: {
        gridSize: config.game.gridSize,
        gameSpeed: config.game.gameSpeed,
        maxPlayers: config.game.maxPlayers,
      },
      gameLoop: null,
      createdAt: Date.now(),
    };

    // Now generate food with proper settings
    this.room.food = this.generateFood([]);

    // Add host as first player
    this.addPlayer(hostId, hostName, true);
  }

  // Player Management
  addPlayer(playerId: string, playerName: string, isHost: boolean = false): PlayerSnake {
    const color = this.room.players.size; // Assign color based on join order
    const startPos = this.getRandomStartPosition();

    const player: PlayerSnake = {
      id: playerId,
      name: playerName,
      snake: [startPos],
      direction: { x: 0, y: 0 },
      nextDirection: { x: 0, y: 0 },
      alive: true,
      score: 0,
      color,
      isReady: isHost, // Host is auto-ready
      isHost,
    };

    this.room.players.set(playerId, player);
    return player;
  }

  removePlayer(playerId: string): boolean {
    const removed = this.room.players.delete(playerId);
    
    // If host left, assign new host
    if (playerId === this.room.hostId && this.room.players.size > 0) {
      const newHost = Array.from(this.room.players.values())[0];
      this.room.hostId = newHost.id;
      newHost.isHost = true;
      newHost.isReady = true;
    }

    return removed;
  }

  toggleReady(playerId: string): boolean {
    const player = this.room.players.get(playerId);
    if (!player || player.isHost) return false; // Host can't toggle ready
    
    player.isReady = !player.isReady;
    return player.isReady;
  }

  canStartGame(): boolean {
    return (
      this.room.players.size >= config.game.minPlayers &&
      Array.from(this.room.players.values()).every((p) => p.isReady) &&
      this.room.status === GameStatus.WAITING
    );
  }

  // Game Logic
  startGame(onUpdate: (room: GameRoom) => void): void {
    if (!this.canStartGame()) return;

    this.room.status = GameStatus.PLAYING;
    
    // Reset all players
    this.room.players.forEach((player) => {
      player.snake = [this.getRandomStartPosition()];
      player.direction = { x: 0, y: 0 };
      player.nextDirection = { x: 0, y: 0 };
      player.alive = true;
      player.score = 0;
    });

    // Generate food
    const allSnakes = Array.from(this.room.players.values()).map(p => p.snake).flat();
    this.room.food = this.generateFood(allSnakes);

    // Start game loop
    this.room.gameLoop = setInterval(() => {
      this.gameTick();
      onUpdate(this.room);
    }, this.room.settings.gameSpeed);

    // Start power-up spawning (every 10-30 seconds)
    const spawnPowerUpWithRandomDelay = () => {
      this.spawnPowerUp();
      onUpdate(this.room);
      
      // Schedule next spawn with random delay (10-30 seconds)
      const nextDelay = 10000 + Math.random() * 20000; // 10-30 seconds
      this.powerUpSpawnInterval = setTimeout(spawnPowerUpWithRandomDelay, nextDelay);
    };

    // Start first spawn after 10-30 seconds
    const initialDelay = 10000 + Math.random() * 20000;
    this.powerUpSpawnInterval = setTimeout(spawnPowerUpWithRandomDelay, initialDelay);
  }

  stopGame(): void {
    if (this.room.gameLoop) {
      clearInterval(this.room.gameLoop);
      this.room.gameLoop = null;
    }
    if (this.powerUpSpawnInterval) {
      clearTimeout(this.powerUpSpawnInterval);
      this.powerUpSpawnInterval = null;
    }
    this.room.status = GameStatus.FINISHED;
  }

  changeDirection(playerId: string, direction: Direction): void {
    const player = this.room.players.get(playerId);
    if (!player || !player.alive) return;

    // Prevent 180-degree turns
    const currentDir = player.direction;
    if (
      (direction.x !== 0 && currentDir.x !== -direction.x) ||
      (direction.y !== 0 && currentDir.y !== -direction.y)
    ) {
      player.nextDirection = direction;
    }
  }

  private gameTick(): void {
    const alivePlayers = Array.from(this.room.players.values()).filter((p) => p.alive);
    if (alivePlayers.length <= 1) {
      this.stopGame();
      return;
    }

    // Update each alive player
    alivePlayers.forEach((player) => {
      // Apply queued direction
      if (player.nextDirection.x !== 0 || player.nextDirection.y !== 0) {
        player.direction = { ...player.nextDirection };
      }

      if (player.direction.x === 0 && player.direction.y === 0) {
        return; // Player hasn't moved yet
      }

      // Calculate new head position
      const head = player.snake[0];
      let newHead: Position = {
        x: head.x + player.direction.x,
        y: head.y + player.direction.y,
      };

      // Wrap around edges
      if (newHead.x < 0) newHead.x = this.room.settings.gridSize - 1;
      if (newHead.x >= this.room.settings.gridSize) newHead.x = 0;
      if (newHead.y < 0) newHead.y = this.room.settings.gridSize - 1;
      if (newHead.y >= this.room.settings.gridSize) newHead.y = 0;

      // Check collision with self (unless has shield)
      const hasShield = this.hasActivePowerUp(player, PowerUpType.SHIELD);
      if (!hasShield && this.checkCollision(newHead, player.snake)) {
        player.alive = false;
        return;
      }

      // Check collision with other players (unless has shield)
      if (!hasShield) {
        const otherPlayers = alivePlayers.filter((p) => p.id !== player.id);
        for (const other of otherPlayers) {
          if (this.checkCollision(newHead, other.snake)) {
            player.alive = false;
            return;
          }
        }
      }

      // Check if ate food
      let ateFood = false;
      const pointsMultiplier = this.hasActivePowerUp(player, PowerUpType.DOUBLE_POINTS) ? 2 : 1;
      
      if (newHead.x === this.room.food.x && newHead.y === this.room.food.y) {
        ateFood = true;
        player.score += 5 * pointsMultiplier;
        
        // Generate new food
        const allSnakes = Array.from(this.room.players.values())
          .filter((p) => p.alive)
          .map((p) => p.snake)
          .flat();
        this.room.food = this.generateFood(allSnakes);
      }

      // Check if collected power-up
      const powerUpIndex = this.room.powerUps.findIndex(
        (p) => p.x === newHead.x && p.y === newHead.y
      );
      if (powerUpIndex !== -1) {
        const powerUp = this.room.powerUps[powerUpIndex];
        this.applyPowerUp(player, powerUp.type);
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

  private checkCollision(pos: Position, snake: Position[]): boolean {
    return snake.some((segment) => segment.x === pos.x && segment.y === pos.y);
  }

  private generateFood(snakes: Position[]): Position {
    let food: Position;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      food = {
        x: Math.floor(Math.random() * this.room.settings.gridSize),
        y: Math.floor(Math.random() * this.room.settings.gridSize),
      };
      attempts++;
    } while (this.checkCollision(food, snakes) && attempts < maxAttempts);

    return food;
  }

  private spawnPowerUp(): void {
    // Don't spawn if there are already 3 power-ups
    if (this.room.powerUps.length >= 3) return;

    const allSnakes = Array.from(this.room.players.values())
      .filter((p) => p.alive)
      .map((p) => p.snake)
      .flat();

    let position: Position;
    let attempts = 0;
    const maxAttempts = 50;

    // Find a position that doesn't collide with snakes or food
    do {
      position = {
        x: Math.floor(Math.random() * this.room.settings.gridSize),
        y: Math.floor(Math.random() * this.room.settings.gridSize),
      };
      attempts++;
    } while (
      (this.checkCollision(position, allSnakes) ||
        (position.x === this.room.food.x && position.y === this.room.food.y)) &&
      attempts < maxAttempts
    );

    // Random power-up type
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
    if (!player.activePowerUps) {
      player.activePowerUps = [];
    }

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
        // Instant effect - shrink snake by 40% and reduce score by 10
        const newLength = Math.max(1, Math.floor(player.snake.length * 0.6));
        player.snake = player.snake.slice(0, newLength);
        player.score = Math.max(0, player.score - 10); // Penalty of 10 points
        break;

      case PowerUpType.DOUBLE_POINTS:
        player.activePowerUps.push({
          type: PowerUpType.DOUBLE_POINTS,
          expiresAt: now + 12000, // 12 seconds
        });
        break;
    }

    // Clean up expired power-ups
    this.cleanupExpiredPowerUps(player);
  }

  private hasActivePowerUp(player: PlayerSnake, type: PowerUpType): boolean {
    if (!player.activePowerUps) return false;
    
    this.cleanupExpiredPowerUps(player);
    return player.activePowerUps.some((p) => p.type === type);
  }

  private cleanupExpiredPowerUps(player: PlayerSnake): void {
    if (!player.activePowerUps) return;
    
    const now = Date.now();
    player.activePowerUps = player.activePowerUps.filter((p) => p.expiresAt > now);
  }

  private getRandomStartPosition(): Position {
    return {
      x: Math.floor(Math.random() * this.room.settings.gridSize),
      y: Math.floor(Math.random() * this.room.settings.gridSize),
    };
  }

  // Getters
  getRoomCode(): string {
    return this.room.roomCode;
  }

  getStatus(): GameStatus {
    return this.room.status;
  }

  getPlayers(): PlayerSnake[] {
    return Array.from(this.room.players.values());
  }

  getPlayer(playerId: string): PlayerSnake | undefined {
    return this.room.players.get(playerId);
  }

  getHostId(): string {
    return this.room.hostId;
  }

  getFood(): Position {
    return this.room.food;
  }

  getPowerUps(): PowerUp[] {
    return this.room.powerUps;
  }

  getWinner(): PlayerSnake | null {
    const alivePlayers = Array.from(this.room.players.values()).filter((p) => p.alive);
    return alivePlayers.length === 1 ? alivePlayers[0] : null;
  }

  isFull(): boolean {
    return this.room.players.size >= this.room.settings.maxPlayers;
  }

  isEmpty(): boolean {
    return this.room.players.size === 0;
  }
}
