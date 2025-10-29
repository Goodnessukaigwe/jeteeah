"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface GameContextType {
  score: number;
  highScore: number;
  setScore: (score: number | ((prevScore: number) => number)) => void;
  updateHighScore: (score: number) => void;
  resetScore: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [score, setScoreState] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== "undefined") {
      const savedHighScore = localStorage.getItem("snakeHighScore");
      return savedHighScore ? parseInt(savedHighScore, 10) : 0;
    }
    return 0;
  });

  const setScore = useCallback(
    (newScore: number | ((prevScore: number) => number)) => {
      setScoreState(newScore);
    },
    []
  );

  const updateHighScore = useCallback(
    (newScore: number) => {
      if (newScore > highScore) {
        setHighScore(newScore);
        if (typeof window !== "undefined") {
          localStorage.setItem("snakeHighScore", newScore.toString());
        }
      }
    },
    [highScore]
  );

  const resetScore = useCallback(() => {
    setScoreState(0);
  }, []);

  return (
    <GameContext.Provider
      value={{ score, highScore, setScore, updateHighScore, resetScore }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
