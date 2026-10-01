"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, ArrowDownUp, BookOpen, ChevronRight, Crown, Undo2 } from "lucide-react";
import GameSidebar from "@/components/GameSidebar";
import CapturedPieces from "@/components/CapturedPieces";
import { useChessGame } from "@/lib/useChessGame";
import { PIECE_VALUES } from "@/lib/game-state";
import type { GameStatus } from "@/lib/types";
import type { Color } from "chess.js";

const ChessBoard = dynamic(() => import("@/components/ChessBoard"), {
  ssr: false, loading: () => <div className="board-placeholder" aria-label="Loading chess board" />,
});

const STATUS_LABELS: Record<GameStatus, string> = {
  playing: "", check: "Check. Protect your king.", checkmate: "Checkmate",
  stalemate: "Draw by stalemate", draw: "Draw", insufficient: "Draw by insufficient material",
  threefold: "Draw by repetition", "fifty-move": "Draw by the fifty-move rule",
};

export default function ChessPage() {
  const game = useChessGame();
  const [flipped, setFlipped] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const orientation = (game.gameMode === "ai" && game.aiColor === "w") !== flipped ? "black" : "white";
  const bottomColor = orientation === "white" ? "w" : "b";
  const topColor = bottomColor === "w" ? "b" : "w";
  const colorName = game.turn === "w" ? "White" : "Black";
  const statusText = game.aiError || (game.status === "checkmate"
    ? `${game.turn === "w" ? "Black" : "White"} wins by checkmate`
    : game.isGameOver ? STATUS_LABELS[game.status]
    : game.isAIThinking ? "Computer is thinking…" : `${colorName} to move`);

  function player(color: Color) {
    const computer = game.gameMode === "ai" && game.aiColor === color;
    const name = computer ? "The computer" : game.gameMode === "ai" ? "You" : color === "w" ? "White player" : "Black player";
    const material = (side: Color) => game.capturedPieces[side].reduce((total, piece) => total + PIECE_VALUES[piece], 0);
    return <div className={`player-row ${game.turn === color && !game.isGameOver ? "active-player" : ""}`}>
      <div className={`player-avatar ${color === "w" ? "white-avatar" : "black-avatar"}`} aria-hidden="true">{color === "w" ? "♔" : "♚"}</div>
      <div className="player-info"><strong>{name}</strong><span>{color === "w" ? "White" : "Black"} pieces{computer ? ` · ${game.aiDifficulty}` : ""}</span></div>
      <CapturedPieces pieces={game.capturedPieces[color]} color={color} materialAdvantage={material(color) - material(color === "w" ? "b" : "w")} />
      {game.turn === color && !game.isGameOver && <span className="player-turn">{computer ? "Thinking" : "To move"}<i /></span>}
    </div>;
  }

  return <div className="app-shell">
    <a className="skip-link" href="#play">Skip to board</a>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Chess Club home"><span className="brand-icon"><Crown size={21} strokeWidth={1.7} /></span><span>chess<span className="brand-club">club.</span></span></Link>
      <nav aria-label="Main navigation"><a href="#play" className="nav-active">Play<span /></a>
        <button aria-expanded={showGuide} onClick={() => setShowGuide(!showGuide)}>How to play</button></nav>
      <span className="header-note"><i />A good day for a game.</span>
    </header>
    <main id="play" className="main-content">
      <div className="page-heading"><div><p className="eyebrow">THE BOARD IS YOURS</p><h1>A little pause.<br className="mobile-break" /> A better move.</h1><p className="page-description">Slow down. Think ahead. Enjoy the game.</p></div>
        <div className="game-type"><span className="game-type-icon">∞</span><div><strong>Take your time</strong><span>Casual chess · No clock</span></div></div>
      </div>
      {showGuide && <section className="guide" aria-label="How to play"><BookOpen size={20} /><div><h2>Your first move</h2><p>White moves first. Click a piece, then a highlighted square, or drag it to its destination. You can also use Tab and Enter to select squares. Keep your king safe; checkmate ends the game.</p><p>Play a friend on this device or choose the computer. Undo takes back your last turn. Right-click and drag on the board to draw an arrow.</p></div><button className="text-button" onClick={() => setShowGuide(false)}>Got it</button></section>}
      <div className="play-layout">
        <section className="board-section" aria-label="Play chess">
          {player(topColor)}
          <div className="board-frame"><ChessBoard fen={game.fen} lastMove={game.lastMove} disabled={game.isGameOver || game.isAIThinking || !!game.aiError} orientation={orientation} onMove={game.makeMove} /></div>
          {player(bottomColor)}
          <div className="board-toolbar"><div className={`game-status ${game.status === "check" ? "in-check" : ""}`} role="status" aria-live="polite"><i />{statusText}{game.status === "check" && <span> · Check</span>}</div>
            <div className="board-actions"><button disabled={!game.canUndo} onClick={game.undoMove} title="Undo last turn" aria-label="Undo last turn"><Undo2 size={16} /><span>Undo</span></button>
              <button onClick={() => setFlipped(!flipped)} title="Flip board" aria-label="Flip board"><ArrowDownUp size={16} /><span>Flip</span></button></div>
          </div>
          <p className="board-hint">Click to move, or drag a piece. The next move is yours.</p>
        </section>
        <div className="panel-column"><GameSidebar game={game} />
          <div className="club-note"><span aria-hidden="true">♞</span><div><p>Every master was<br /> once a beginner.</p><small>ONE MOVE AT A TIME.</small></div><ArrowUpRight size={18} /></div>
        </div>
      </div>
    </main>
    <footer className="site-footer"><span>Made for the love of the game.</span><a href="https://github.com/ixtaqq/chess" target="_blank" rel="noreferrer">Open source<ChevronRight size={13} /></a><span className="footer-mark">64 squares. Endless possibilities.</span></footer>
  </div>;
}
