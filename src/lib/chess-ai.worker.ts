import { Chess } from "chess.js";
import { getBestMove, type AIDifficulty } from "./chess-ai";

export interface AIRequest {
  fen: string;
  pgn: string;
  difficulty: AIDifficulty;
}

self.onmessage = (event: MessageEvent<AIRequest>) => {
  const { fen, pgn, difficulty } = event.data;
  const game = new Chess(fen);
  if (pgn) game.loadPgn(pgn);
  self.postMessage(getBestMove(game, difficulty, game.turn()));
};
