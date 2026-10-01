"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Chess, validateFen, type Square, type PieceSymbol, type Color } from "chess.js";
import type { GameMode } from "./types";
import type { AIDifficulty, AIMove } from "./chess-ai";
import type { AIRequest } from "./chess-ai.worker";
import { getGameSnapshot, undoPlayerTurn } from "./game-state";

export function useChessGame() {
  const [game] = useState(() => new Chess());
  const [snapshot, setSnapshot] = useState(() => getGameSnapshot(game));
  const [gameMode, setGameMode] = useState<GameMode>("2player");
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("medium");
  const [aiColor, setAiColor] = useState<Color>("b");
  const [aiError, setAiError] = useState("");
  const revision = useRef(0);
  const isAIThinking = gameMode === "ai" && snapshot.turn === aiColor && !snapshot.isGameOver && !aiError;

  const sync = useCallback(() => {
    revision.current += 1;
    setSnapshot(getGameSnapshot(game));
    setAiError("");
  }, [game]);

  useEffect(() => {
    if (gameMode !== "ai" || snapshot.turn !== aiColor || snapshot.isGameOver) return;
    const worker = new Worker(new URL("./chess-ai.worker.ts", import.meta.url));
    const requestedRevision = revision.current;
    worker.onmessage = (event: MessageEvent<AIMove | null>) => {
      if (revision.current !== requestedRevision) return;
      const move = event.data;
      if (move) {
        game.move(move);
        sync();
      }
    };
    worker.onerror = () => {
      if (revision.current === requestedRevision) {
        setAiError("The computer could not finish its move. Start a new game or switch to a friend.");
      }
    };
    const request: AIRequest = { fen: snapshot.fen, pgn: snapshot.pgn, difficulty: aiDifficulty };
    worker.postMessage(request);
    return () => worker.terminate();
  }, [snapshot, gameMode, aiColor, aiDifficulty, game, sync]);

  const makeMove = useCallback((from: Square, to: Square, promotion: PieceSymbol = "q") => {
    if (game.isGameOver() || (gameMode === "ai" && game.turn() === aiColor)) return false;
    const legal = game.moves({ square: from, verbose: true }).find(
      (move) => move.to === to && (!move.promotion || move.promotion === promotion)
    );
    if (!legal) return false;
    game.move(legal);
    sync();
    return true;
  }, [game, gameMode, aiColor, sync]);

  const resetGame = useCallback(() => {
    game.reset();
    sync();
  }, [game, sync]);

  const canUndo = snapshot.history.some((move) => gameMode !== "ai" || move.color !== aiColor);
  const undoMove = useCallback(() => {
    if (!canUndo) return;
    undoPlayerTurn(game, gameMode === "ai" ? aiColor : undefined);
    sync();
  }, [game, gameMode, aiColor, canUndo, sync]);

  const loadFen = useCallback((fen: string): string | null => {
    const validation = validateFen(fen.trim());
    if (!validation.ok) return validation.error || "Enter a valid FEN position.";
    game.load(fen.trim());
    sync();
    return null;
  }, [game, sync]);

  const changeGameMode = useCallback((mode: GameMode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    resetGame();
  }, [gameMode, resetGame]);

  const changeAIColor = useCallback((color: Color) => {
    if (color === aiColor) return;
    setAiColor(color);
    resetGame();
  }, [aiColor, resetGame]);

  return {
    ...snapshot, makeMove, resetGame, undoMove, loadFen, canUndo,
    gameMode, aiDifficulty, aiColor, aiError, isAIThinking,
    changeGameMode, changeAIDifficulty: setAiDifficulty, changeAIColor,
  };
}
