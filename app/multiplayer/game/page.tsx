"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiCloseLine } from "react-icons/ri";
import {
  IoMdArrowUp,
  IoMdArrowDown,
  IoMdArrowDropleft,
  IoMdArrowDropright,
} from "react-icons/io";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { PowerUpType } from "@/contexts/SocketContext";

// Power-up icons and colors
const POWER_UP_CONFIG = {
  [PowerUpType.SPEED_BOOST]: { icon: "⚡", color: "#fbbf24", name: "Speed Boost" },
  [PowerUpType.SHIELD]: { icon: "🛡️", color: "#3b82f6", name: "Shield" },
  [PowerUpType.CUT]: { icon: "✂️", color: "#f97316", name: "Cut" },
  [PowerUpType.DOUBLE_POINTS]: { icon: "🌟", color: "#eab308", name: "Double Points" },
};

// Player colors for multiplayer
const PLAYER_COLORS = [
  { bg: "bg-green-500", shadow: "shadow-green-500/30", name: "Green" },
  { bg: "bg-blue-500", shadow: "shadow-blue-500/30", name: "Blue" },
  { bg: "bg-red-500", shadow: "shadow-red-500/30", name: "Red" },
  { bg: "bg-yellow-500", shadow: "shadow-yellow-500/30", name: "Yellow" },
  { bg: "bg-purple-500", shadow: "shadow-purple-500/30", name: "Purple" },
  { bg: "bg-pink-500", shadow: "shadow-pink-500/30", name: "Pink" },
  { bg: "bg-orange-500", shadow: "shadow-orange-500/30", name: "Orange" },
  { bg: "bg-cyan-500", shadow: "shadow-cyan-500/30", name: "Cyan" },
];

const GameContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");

  const { gameState, socket, changeDirection, leaveRoom } = useMultiplayer();

  const gridSize = 20;
  const [boardWidth] = useState(395);
  const [boardHeight] = useState(400);
  const boardSize = Math.min(boardWidth, boardHeight) / gridSize;


  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Get game data from Socket.IO
  const players = gameState?.players || [];
  const food = gameState?.food || { x: 5, y: 5 };
  const gameStatus = gameState?.status || 'waiting';

  const currentPlayerId = socket?.id;
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isAlive = currentPlayer?.alive || false;
  const gameOver = gameStatus === 'finished';
  const alivePlayers = players.filter((p) => p.alive);
  const winner = alivePlayers.length === 1 ? alivePlayers[0] : null;

  // Show loading if no game state
  if (!gameState) {
    return (
      <div className="bg-[#0F172A] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
          <p className="text-sm text-gray-500 mt-2">Room: {roomCode}</p>
        </div>
      </div>
    );
  }

  // Local prediction state for smoother controls
  const [predictedDirection, setPredictedDirection] = useState<{ x: number; y: number } | null>(null);

  // Handle keyboard input - send to server with client prediction
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isAlive) return;

      let direction = null;
      switch (e.key) {
        case "ArrowUp":
          direction = { x: 0, y: -1 };
          break;
        case "ArrowDown":
          direction = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
          direction = { x: -1, y: 0 };
          break;
        case "ArrowRight":
          direction = { x: 1, y: 0 };
          break;
      }

      if (direction) {
        // Immediately update local prediction for instant feedback
        setPredictedDirection(direction);
        // Send to server
        changeDirection(direction);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isAlive, changeDirection]);

  // Clear prediction when server updates
  useEffect(() => {
    if (gameState) {
      setPredictedDirection(null);
    }
  }, [gameState]);

  const handleLeaveGame = () => {
    leaveRoom();
    router.push("/multiplayer");
  };

  const handleDirectionButton = (direction: { x: number; y: number }) => {
    if (isAlive) {
      changeDirection(direction);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Game Info Bar */}
      <div className="bg-[#1E293B] border-b border-gray-800 p-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Room:</span>
            <span className="font-bold text-purple-400">{roomCode}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="bg-red-500/80 p-1.5 rounded-md hover:bg-red-600"
              onClick={() => setShowLeaveModal(true)}
            >
              <RiCloseLine size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center bg-[#0F172A] relative">
        {/* Game Board */}
        <div
          className="relative border-y border-gray-500 "
          style={{
            width: boardWidth,
            height: boardHeight,
            // backgroundColor: '#1E293B',
          }}
        >
          {/* Canvas for snake rendering */}
          <canvas
            ref={(canvas) => {
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              // Clear canvas
              ctx.clearRect(0, 0, boardWidth, boardHeight);

              // Draw all players' snakes
              players.forEach((player) => {
                if (player.snake.length === 0) return;

                const thickness = boardSize * 0.8;
                const radius = thickness / 2;

                // Get player color
                const colorIndex = player.color % PLAYER_COLORS.length;
                const playerColor = PLAYER_COLORS[colorIndex];
                
                // Map Tailwind color names to hex
                const colorMap: Record<string, { main: string; dark: string; light: string }> = {
                  'bg-green-500': { main: '#22c55e', dark: '#16a34a', light: '#4ade80' },
                  'bg-blue-500': { main: '#3b82f6', dark: '#2563eb', light: '#60a5fa' },
                  'bg-red-500': { main: '#ef4444', dark: '#dc2626', light: '#f87171' },
                  'bg-yellow-500': { main: '#eab308', dark: '#ca8a04', light: '#facc15' },
                  'bg-purple-500': { main: '#a855f7', dark: '#9333ea', light: '#c084fc' },
                  'bg-pink-500': { main: '#ec4899', dark: '#db2777', light: '#f472b6' },
                  'bg-orange-500': { main: '#f97316', dark: '#ea580c', light: '#fb923c' },
                  'bg-cyan-500': { main: '#06b6d4', dark: '#0891b2', light: '#22d3ee' },
                };

                const colors = colorMap[playerColor.bg] || colorMap['bg-green-500'];
                const opacity = player.alive ? 1 : 0.3;

                // Check for active power-ups
                const activePowerUps = player.activePowerUps || [];
                const hasSpeedBoost = activePowerUps.some(p => p.type === PowerUpType.SPEED_BOOST);
                const hasShield = activePowerUps.some(p => p.type === PowerUpType.SHIELD);
                const hasDoublePoints = activePowerUps.some(p => p.type === PowerUpType.DOUBLE_POINTS);

                // Draw power-up effects
                ctx.globalAlpha = opacity;

                // Shield effect - pulsing blue aura
                if (hasShield) {
                  ctx.save();
                  ctx.strokeStyle = '#3b82f6';
                  ctx.lineWidth = thickness + 8;
                  ctx.shadowBlur = 20;
                  ctx.shadowColor = '#3b82f6';
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';

                  ctx.beginPath();
                  for (let i = 0; i < player.snake.length; i++) {
                    const seg = player.snake[i];
                    const x = seg.x * boardSize + boardSize / 2;
                    const y = seg.y * boardSize + boardSize / 2;

                    if (i > 0) {
                      const prevSeg = player.snake[i - 1];
                      const prevX = prevSeg.x * boardSize + boardSize / 2;
                      const prevY = prevSeg.y * boardSize + boardSize / 2;
                      const distance = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
                      if (distance > boardSize * 2) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        continue;
                      }
                    }

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                  }
                  ctx.stroke();
                  ctx.restore();
                }

                // Speed boost effect - yellow glow
                if (hasSpeedBoost) {
                  ctx.shadowBlur = 15;
                  ctx.shadowColor = '#fbbf24';
                }

                // Draw body as continuous path
                ctx.strokeStyle = colors.main;
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.beginPath();

                for (let i = 0; i < player.snake.length; i++) {
                  const seg = player.snake[i];
                  const x = seg.x * boardSize + boardSize / 2;
                  const y = seg.y * boardSize + boardSize / 2;

                  // Check for screen wrap
                  if (i > 0) {
                    const prevSeg = player.snake[i - 1];
                    const prevX = prevSeg.x * boardSize + boardSize / 2;
                    const prevY = prevSeg.y * boardSize + boardSize / 2;
                    const dx = x - prevX;
                    const dy = y - prevY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // If screen wrap, start new path
                    if (distance > boardSize * 2) {
                      ctx.stroke();
                      ctx.beginPath();
                      ctx.moveTo(x, y);
                      continue;
                    }
                  }

                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                }

                ctx.stroke();

                // Draw border
                ctx.strokeStyle = colors.dark;
                ctx.lineWidth = thickness + 4;
                ctx.globalCompositeOperation = 'destination-over';

                ctx.beginPath();
                for (let i = 0; i < player.snake.length; i++) {
                  const seg = player.snake[i];
                  const x = seg.x * boardSize + boardSize / 2;
                  const y = seg.y * boardSize + boardSize / 2;

                  if (i > 0) {
                    const prevSeg = player.snake[i - 1];
                    const prevX = prevSeg.x * boardSize + boardSize / 2;
                    const prevY = prevSeg.y * boardSize + boardSize / 2;
                    const dx = x - prevX;
                    const dy = y - prevY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > boardSize * 2) {
                      ctx.stroke();
                      ctx.beginPath();
                      ctx.moveTo(x, y);
                      continue;
                    }
                  }

                  if (i === 0) {
                    ctx.moveTo(x, y);
                  } else {
                    ctx.lineTo(x, y);
                  }
                }
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';

                // Draw head
                if (player.alive) {
                  const head = player.snake[0];
                  const headX = head.x * boardSize + boardSize / 2;
                  const headY = head.y * boardSize + boardSize / 2;

                  ctx.save();
                  ctx.translate(headX, headY);

                  // Calculate rotation based on direction
                  // Use predicted direction for current player for instant feedback
                  const direction = (player.id === currentPlayerId && predictedDirection) 
                    ? predictedDirection 
                    : player.direction;
                  let angle = 0;
                  if (direction.y === -1) angle = 0;
                  else if (direction.x === 1) angle = Math.PI / 2;
                  else if (direction.y === 1) angle = Math.PI;
                  else if (direction.x === -1) angle = -Math.PI / 2;
                  ctx.rotate(angle);

                  // Draw head circle
                  ctx.fillStyle = colors.light;
                  ctx.beginPath();
                  ctx.arc(0, 0, radius, 0, Math.PI * 2);
                  ctx.fill();

                  // Head border
                  ctx.strokeStyle = colors.main;
                  ctx.lineWidth = 3;
                  ctx.stroke();

                  // Eyes
                  const eyeSize = radius * 0.35;
                  const eyeSpacing = radius * 0.5;
                  const eyeY = -radius * 0.3;

                  // Left eye
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.arc(-eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
                  ctx.fill();

                  // Right eye
                  ctx.beginPath();
                  ctx.arc(eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
                  ctx.fill();

                  // Pupils
                  ctx.fillStyle = '#000000';
                  const pupilSize = eyeSize * 0.6;

                  ctx.beginPath();
                  ctx.arc(-eyeSpacing, eyeY, pupilSize, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.beginPath();
                  ctx.arc(eyeSpacing, eyeY, pupilSize, 0, Math.PI * 2);
                  ctx.fill();

                  // Eye shine
                  ctx.fillStyle = '#ffffff';
                  const shineSize = eyeSize * 0.4;

                  ctx.beginPath();
                  ctx.arc(-eyeSpacing - pupilSize * 0.25, eyeY - pupilSize * 0.25, shineSize, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.beginPath();
                  ctx.arc(eyeSpacing - pupilSize * 0.25, eyeY - pupilSize * 0.25, shineSize, 0, Math.PI * 2);
                  ctx.fill();

                  // Double points sparkles around head
                  if (hasDoublePoints) {
                    ctx.fillStyle = '#eab308';
                    const sparkleCount = 6;
                    const sparkleDistance = radius * 1.5;
                    for (let i = 0; i < sparkleCount; i++) {
                      const angle = (i / sparkleCount) * Math.PI * 2 + Date.now() / 500;
                      const sx = Math.cos(angle) * sparkleDistance;
                      const sy = Math.sin(angle) * sparkleDistance;
                      ctx.beginPath();
                      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                      ctx.fill();
                    }
                  }

                  ctx.restore();
                }

                // Reset shadow effects
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
              });
            }}
            width={boardWidth}
            height={boardHeight}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 2 }}
          />

          {/* Food */}
          <div
            className="absolute bg-red-500 rounded-full animate-pulse"
            style={{
              width: boardSize,
              height: boardSize,
              left: food.x * boardSize,
              top: food.y * boardSize,
              zIndex: 1,
            }}
          />

          {/* Power-Ups */}
          {gameState?.powerUps?.map((powerUp) => {
            const config = POWER_UP_CONFIG[powerUp.type];
            return (
              <div
                key={powerUp.id}
                className="absolute flex items-center justify-center animate-bounce"
                style={{
                  width: boardSize,
                  height: boardSize,
                  left: powerUp.x * boardSize,
                  top: powerUp.y * boardSize,
                  zIndex: 1,
                  filter: `drop-shadow(0 0 8px ${config.color})`,
                }}
              >
                <span className="text-2xl">{config.icon}</span>
              </div>
            );
          })}

          {/* Player Name Labels */}
          {players.map((player) => {
            const head = player.snake[0];
            const activePowerUps = player.activePowerUps || [];
            return (
              <div
                key={`label-${player.id}`}
                className="absolute text-xs font-bold whitespace-nowrap pointer-events-none flex items-center gap-1"
                style={{
                  left: head.x * boardSize,
                  top: head.y * boardSize - 20,
                  color: player.id === currentPlayerId ? "#FFF" : "#AAA",
                  zIndex: 3,
                }}
              >
                <span>{player.name} {!player.alive && "💀"}</span>
                {activePowerUps.map((powerUp, idx) => (
                  <span key={idx} className="text-sm">
                    {POWER_UP_CONFIG[powerUp.type].icon}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Power-Up HUD for Current Player */}
      {currentPlayer && currentPlayer.activePowerUps && currentPlayer.activePowerUps.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {currentPlayer.activePowerUps.map((powerUp, idx) => {
            const config = POWER_UP_CONFIG[powerUp.type];
            const timeLeft = Math.max(0, powerUp.expiresAt - Date.now());
            const duration = powerUp.type === PowerUpType.SPEED_BOOST ? 6000 :
                           powerUp.type === PowerUpType.SHIELD ? 4000 :
                           powerUp.type === PowerUpType.DOUBLE_POINTS ? 12000 : 1000;
            const progress = (timeLeft / duration) * 100;

            return (
              <div
                key={idx}
                className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 border-2 flex flex-col items-center gap-1 min-w-[80px]"
                style={{ borderColor: config.color }}
              >
                <span className="text-2xl">{config.icon}</span>
                <span className="text-xs font-bold text-white">{config.name}</span>
                <span className="text-xs text-gray-300">{Math.ceil(timeLeft / 1000)}s</span>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}



      {/* Spectator Mode (when player is dead) */}
      {!isAlive && !gameOver && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gradient-to-br from-red-900/90 to-orange-900/90 backdrop-blur-sm px-6 py-4 rounded-xl border-2 border-red-500/50 z-10 shadow-2xl max-w-sm">
          <div className="text-center">
            <p className="text-2xl font-bold mb-2">💀 You've been eliminated!</p>
            <p className="text-sm text-gray-200 mb-3">Spectating remaining players...</p>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-300">
                <span className="font-bold text-white">{alivePlayers.length}</span> player{alivePlayers.length !== 1 ? 's' : ''} still alive
              </p>
              <p className="text-xs text-gray-400 mt-1">Waiting for game to finish</p>
            </div>
          </div>
        </div>
      )}

      {/* Scores Sidebar */}
      <div className="absolute  top-10 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 max-w-xs z-10 flex">
        <div className=" flex items-center justify-center gap-4">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      PLAYER_COLORS[player.color].bg
                    }`}
                  />
                  
                  <span
                    className={`text-sm ${
                      !player.alive ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {player.name}
                  </span>
                </div>
                <span className="text-sm font-bold">{player.score}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="py-4 bg-[#0F172A] -mt-3">
        <div className="flex flex-col items-center gap-2">
          <button
            disabled={!isAlive}
            className="bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => handleDirectionButton({ x: 0, y: -1 })}
          >
            <IoMdArrowUp size={24} />
          </button>
          <div className="flex gap-25">
            <button
              disabled={!isAlive}
              className="bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => handleDirectionButton({ x: -1, y: 0 })}
            >
              <IoMdArrowDropleft size={24} />
            </button>
            <button
              disabled={!isAlive}
              className="bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => handleDirectionButton({ x: 1, y: 0 })}
            >
              <IoMdArrowDropright size={24} />
            </button>
          </div>
          <button
            disabled={!isAlive}
            className="bg-linear-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={() => handleDirectionButton({ x: 0, y: 1 })}
          >
            <IoMdArrowDown size={24} />
          </button>
        </div>
      </div>

      {/* Leave Game Modal */}
      {showLeaveModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Leave Game?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave the multiplayer game?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                onClick={() => setShowLeaveModal(false)}
              >
                Stay
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                onClick={handleLeaveGame}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-40">
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 max-w-md mx-4 text-center border-2 border-purple-500/50 shadow-2xl">
            <div className="mb-6">
              {winner ? (
                <>
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                    {winner.id === currentPlayerId ? "You Won!" : `${winner.name} Wins!`}
                  </h2>
                  <p className="text-gray-300">
                    Final Score: <span className="font-bold text-white">{winner.score}</span>
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🤝</div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Game Over!
                  </h2>
                  <p className="text-gray-300">It's a tie!</p>
                </>
              )}
            </div>

            {/* Final Scores */}
            <div className="bg-black/30 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-bold text-gray-300 mb-3">FINAL SCORES</h3>
              <div className="space-y-2">
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        index === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div
                          className={`w-3 h-3 rounded-full ${PLAYER_COLORS[player.color].bg}`}
                        />
                        <span className={`font-semibold ${player.id === currentPlayerId ? 'text-white' : 'text-gray-300'}`}>
                          {player.name} {player.id === currentPlayerId && '(You)'}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-white">{player.score}</span>
                    </div>
                  ))}
              </div>
            </div>

            <button
              onClick={handleLeaveGame}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MultiplayerGamePage = () => {
  return (
    <Suspense fallback={
      <div className="bg-[#0F172A] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
};

export default MultiplayerGamePage;

