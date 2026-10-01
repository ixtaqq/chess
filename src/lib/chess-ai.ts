import { Chess, type PieceSymbol, type Color, type Square } from "chess.js";

// Piece values in centipawns
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables (from white's perspective, index 0 = a8)
// Encourages pieces to go to good squares
const PST: Record<PieceSymbol, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

// Endgame king table (separate from main PST since "ke" is not a valid PieceSymbol)
const KING_ENDGAME_PST: number[] = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
];

export type AIDifficulty = "easy" | "medium" | "hard";

const DIFFICULTY_DEPTH: Record<AIDifficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 4,
};

// Material count to detect endgame
function countMaterial(game: Chess): { white: number; black: number } {
  const board = game.board();
  let white = 0;
  let black = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell) {
        const val = cell.type === "k" ? 0 : PIECE_VALUES[cell.type];
        if (cell.color === "w") white += val;
        else black += val;
      }
    }
  }
  return { white, black };
}

function isEndgame(game: Chess): boolean {
  const { white, black } = countMaterial(game);
  // Endgame: total material on board is low (both sides combined < queen + rook + minor)
  return white + black < 2800;
}

// Evaluate board from white's perspective
function evaluate(game: Chess): number {
  if (game.isCheckmate()) {
    // Checkmate is bad for the side to move
    return game.turn() === "w" ? -99999 : 99999;
  }
  if (game.isStalemate() || game.isDraw()) {
    return 0;
  }

  const board = game.board();
  const endgame = isEndgame(game);
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      // PST index: for white, row 0 = rank 8 (top), for black mirror
      const pstIndex = piece.color === "w" ? row * 8 + col : (7 - row) * 8 + col;
      const pstTable = piece.type === "k" && endgame ? KING_ENDGAME_PST : PST[piece.type];
      const pstBonus = pstTable[pstIndex];

      const value = PIECE_VALUES[piece.type] + pstBonus;
      score += piece.color === "w" ? value : -value;
    }
  }

  return score;
}

// Move ordering: captures and checks first for better alpha-beta pruning
function orderMoves(game: Chess) {
  const moves = game.moves({ verbose: true });
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Prioritize captures (MVV-LVA)
    if (a.captured) scoreA += PIECE_VALUES[a.captured] * 10 - PIECE_VALUES[a.piece];
    if (b.captured) scoreB += PIECE_VALUES[b.captured] * 10 - PIECE_VALUES[b.piece];

    // Prioritize promotions
    if (a.promotion) scoreA += PIECE_VALUES[a.promotion];
    if (b.promotion) scoreB += PIECE_VALUES[b.promotion];

    return scoreB - scoreA;
  });
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluate(game);
  }

  const moves = orderMoves(game);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const eval_ = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const eval_ = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

export interface AIMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

/**
 * Get the best move for the AI using minimax with alpha-beta pruning.
 * Called in a Web Worker so the board stays responsive during search.
 */
export function getBestMove(
  game: Chess,
  difficulty: AIDifficulty = "medium",
  aiColor: Color = "b"
): AIMove | null {
  if (game.isGameOver()) return null;
  const depth = DIFFICULTY_DEPTH[difficulty];
  const moves = game.moves({ verbose: true });

  if (moves.length === 0) return null;

  const isMaximizing = aiColor === "w";

  let bestMove: AIMove | null = null;
  let bestEval = isMaximizing ? -Infinity : Infinity;

  // Add slight randomness for easy difficulty
  const randomFactor = difficulty === "easy" ? 0.3 : 0;

  const orderedMoves = orderMoves(game);

  for (const move of orderedMoves) {
    game.move(move);
    const eval_ = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing);
    game.undo();

    // Add randomness for easy mode
    const adjustedEval = eval_ + (randomFactor * (Math.random() - 0.5) * 100);

    if (isMaximizing) {
      if (adjustedEval > bestEval) {
        bestEval = adjustedEval;
        bestMove = { from: move.from, to: move.to, promotion: move.promotion };
      }
    } else {
      if (adjustedEval < bestEval) {
        bestEval = adjustedEval;
        bestMove = { from: move.from, to: move.to, promotion: move.promotion };
      }
    }
  }

  return bestMove;
}


