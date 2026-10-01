import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { getGameStatus, getGameSnapshot, undoPlayerTurn } from "../src/lib/game-state.ts";
import { getBestMove } from "../src/lib/chess-ai.ts";

test("initial position has a clean scoresheet and white to move", () => {
  const state = getGameSnapshot(new Chess());
  assert.equal(state.turn, "w");
  assert.equal(state.status, "playing");
  assert.deepEqual(state.moveHistory, []);
  assert.deepEqual(state.capturedPieces, { w: [], b: [] });
});

test("captures, notation and last move come from actual history", () => {
  const game = new Chess();
  for (const move of ["e4", "d5", "exd5"]) game.move(move);
  const state = getGameSnapshot(game);
  assert.deepEqual(state.capturedPieces.w, ["p"]);
  assert.deepEqual(state.lastMove, { from: "e4", to: "d5" });
  assert.deepEqual(state.moveHistory, ["e4", "d5", "exd5"]);
  const imported = new Chess();
  imported.loadPgn(state.pgn);
  assert.equal(imported.fen(), game.fen());
});

test("local undo takes one move and rebuilds captures", () => {
  const game = new Chess();
  for (const move of ["e4", "d5", "exd5"]) game.move(move);
  undoPlayerTurn(game);
  assert.deepEqual(getGameSnapshot(game).capturedPieces.w, []);
  assert.deepEqual(game.history(), ["e4", "d5"]);
});

test("AI undo takes the completed human and computer turn", () => {
  const game = new Chess();
  for (const move of ["e4", "e5", "Nf3", "Nc6"]) game.move(move);
  undoPlayerTurn(game, "b");
  assert.deepEqual(game.history(), ["e4", "e5"]);
});

test("undo during a pending AI turn takes only the latest human move", () => {
  const game = new Chess();
  for (const move of ["e4", "e5", "Nf3"]) game.move(move);
  undoPlayerTurn(game, "b");
  assert.deepEqual(game.history(), ["e4", "e5"]);
});

test("playing black retains the computer opening when undoing a turn", () => {
  const game = new Chess();
  for (const move of ["e4", "e5", "Nf3"]) game.move(move);
  undoPlayerTurn(game, "w");
  assert.deepEqual(game.history(), ["e4"]);
  assert.equal(game.turn(), "b");
});

test("fool's mate is checkmate with white as the losing side", () => {
  const game = new Chess();
  for (const move of ["f3", "e5", "g4", "Qh4#"]) game.move(move);
  assert.equal(getGameStatus(game), "checkmate");
  assert.equal(getGameSnapshot(game).turn, "w");
  assert.match(getGameSnapshot(game).pgn, /\[Result "0-1"\]/);
  assert.match(getGameSnapshot(game).pgn, /Qh4# 0-1$/);
});

test("stalemate is distinguished from other draws", () => {
  assert.equal(getGameStatus(new Chess("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1")), "stalemate");
});

test("insufficient material is reported before generic draw", () => {
  assert.equal(getGameStatus(new Chess("7k/8/8/8/8/8/8/K7 w - - 0 1")), "insufficient");
});

test("threefold repetition survives PGN serialization for the worker", () => {
  const game = new Chess();
  for (const move of ["Nf3", "Nf6", "Ng1", "Ng8", "Nf3", "Nf6", "Ng1", "Ng8"]) game.move(move);
  assert.equal(getGameStatus(game), "threefold");
  const copy = new Chess();
  copy.loadPgn(game.pgn());
  assert.equal(getGameStatus(copy), "threefold");
});

test("fifty-move rule is reported explicitly", () => {
  assert.equal(getGameStatus(new Chess("7k/8/8/8/8/8/R7/K7 w - - 100 51")), "fifty-move");
});

test("a loaded position keeps setup headers and black move numbering in PGN", () => {
  const game = new Chess("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 12");
  game.move("e5");
  assert.match(game.pgn(), /\[SetUp "1"\]/);
  assert.match(game.pgn(), /12\. \.\.\. e5/);
  const copy = new Chess();
  copy.loadPgn(game.pgn());
  assert.equal(copy.fen(), game.fen());
});

for (const difficulty of ["easy", "medium", "hard"]) {
  test(`AI ${difficulty} returns a legal move without modifying the game`, () => {
    const game = new Chess("7k/8/6K1/8/8/8/R7/8 w - - 0 1");
    const before = game.fen();
    const move = getBestMove(game, difficulty, "w");
    assert.equal(game.fen(), before);
    assert.deepEqual(game.history(), []);
    assert.ok(move);
    assert.ok(game.move(move));
  });
}

test("AI finds mate for black", () => {
  const game = new Chess();
  for (const move of ["f3", "e5", "g4"]) game.move(move);
  const move = getBestMove(game, "medium", "b");
  assert.ok(move);
  game.move(move);
  assert.ok(game.isCheckmate());
});

test("AI declines to move in a terminal position", () => {
  const game = new Chess("7k/5K2/6Q1/8/8/8/8/8 b - - 0 1");
  assert.equal(getBestMove(game, "medium", "b"), null);
  const insufficient = new Chess("7k/8/8/8/8/8/8/K7 w - - 0 1");
  assert.equal(getBestMove(insufficient, "easy", "w"), null);
});
