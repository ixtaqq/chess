import { Chess, type PieceSymbol } from "chess.js";
import type { CapturedPieces, GameStatus } from "./types";

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

export function getGameStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return "checkmate";
  if (game.isStalemate()) return "stalemate";
  if (game.isInsufficientMaterial()) return "insufficient";
  if (game.isThreefoldRepetition()) return "threefold";
  if (game.isDrawByFiftyMoves()) return "fifty-move";
  if (game.isDraw()) return "draw";
  return game.isCheck() ? "check" : "playing";
}

export function getGameSnapshot(game: Chess) {
  const status = getGameStatus(game);
  const result = status === "checkmate" ? (game.turn() === "w" ? "0-1" : "1-0")
    : game.isDraw() ? "1/2-1/2" : "*";
  game.setHeader("Result", result);
  const history = game.history({ verbose: true });
  const capturedPieces: CapturedPieces = { w: [], b: [] };
  for (const move of history) {
    if (move.captured) capturedPieces[move.color].push(move.captured);
  }
  for (const color of ["w", "b"] as const) {
    capturedPieces[color].sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]);
  }
  const last = history.at(-1);
  return {
    fen: game.fen(),
    pgn: game.pgn(),
    turn: game.turn(),
    status,
    isGameOver: game.isGameOver(),
    moveHistory: history.map((move) => move.san),
    history,
    capturedPieces,
    lastMove: last ? { from: last.from, to: last.to } : null,
  };
}

export function undoPlayerTurn(game: Chess, aiColor?: "w" | "b") {
  const last = game.history({ verbose: true }).at(-1);
  if (!last) return;
  game.undo();
  if (aiColor && last.color === aiColor && game.history().length > 0) game.undo();
}
