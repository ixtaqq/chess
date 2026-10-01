"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Download, RotateCcw, SlidersHorizontal } from "lucide-react";
import MoveHistory from "./MoveHistory";
import type { useChessGame } from "@/lib/useChessGame";
import type { AIDifficulty } from "@/lib/chess-ai";

interface GameSidebarProps {
  game: ReturnType<typeof useChessGame>;
}

const LEVELS: { value: AIDifficulty; label: string; description: string }[] = [
  { value: "easy", label: "Easy", description: "A gentle warm-up. Find your rhythm." },
  { value: "medium", label: "Medium", description: "A thoughtful opponent. Take your time." },
  { value: "hard", label: "Hard", description: "A deeper challenge. Make every move count." },
];

export default function GameSidebar({ game }: GameSidebarProps) {
  const [feedback, setFeedback] = useState("");
  const [fenInput, setFenInput] = useState("");
  const [fenError, setFenError] = useState("");

  async function copyFen() {
    try {
      await navigator.clipboard.writeText(game.fen);
      setFeedback("Position copied to clipboard.");
    } catch {
      setFeedback("Clipboard unavailable. Select and copy the position below.");
    }
  }

  function exportPgn() {
    const url = URL.createObjectURL(new Blob([game.pgn], { type: "application/x-chess-pgn" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "chess-club.pgn";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Your game has been exported.");
  }

  return <aside className="game-panel" aria-label="Game controls">
    <section className="setup-section">
      <div className="section-title"><h2>Make it your game</h2><SlidersHorizontal size={16} /></div>
      <p className="section-description">A little practice. A worthy opponent.</p>
      <div className="mode-switch" aria-label="Opponent">
        <button aria-pressed={game.gameMode === "2player"} onClick={() => game.changeGameMode("2player")}>Play a friend</button>
        <button aria-pressed={game.gameMode === "ai"} onClick={() => game.changeGameMode("ai")}>Play computer</button>
      </div>
      {game.gameMode === "ai" ? <div className="computer-settings">
        <span className="field-label">Difficulty</span>
        <div className="difficulty-switch">{LEVELS.map((level) => <button key={level.value}
          aria-pressed={game.aiDifficulty === level.value} onClick={() => game.changeAIDifficulty(level.value)}>{level.label}</button>)}</div>
        <p className="difficulty-description">{LEVELS.find((level) => level.value === game.aiDifficulty)?.description}</p>
        <div className="side-setting"><span className="field-label">Your pieces</span>
          <div className="color-switch">
            <button aria-pressed={game.aiColor === "b"} onClick={() => game.changeAIColor("b")}><span className="color-dot white" />White</button>
            <button aria-pressed={game.aiColor === "w"} onClick={() => game.changeAIColor("w")}><span className="color-dot black" />Black</button>
          </div>
        </div>
      </div> : <p className="friend-description">Two players, one board. Settle in and take turns.</p>}
      <button className="primary-button" onClick={() => { game.resetGame(); setFeedback(""); }}><RotateCcw size={16} />New game<ArrowUpRight size={17} /></button>
      <p className="reset-note">Changing opponent or color starts a fresh game.</p>
    </section>
    <section className="history-section">
      <div className="section-title"><h2>Scoresheet</h2><span className="move-count">{game.moveHistory.length} {game.moveHistory.length === 1 ? "move" : "moves"}</span></div>
      <MoveHistory moves={game.history} />
      <div className="export-actions">
        <button onClick={copyFen}><Copy size={14} />Copy position</button>
        <button onClick={exportPgn} disabled={!game.moveHistory.length}><Download size={14} />Export PGN</button>
      </div>
      <p className="action-feedback" role="status">{feedback && <><Check size={13} />{feedback}</>}</p>
    </section>
    <details className="position-details">
      <summary>Position tools</summary>
      <label htmlFor="current-fen">Current position (FEN)</label>
      <textarea id="current-fen" value={game.fen} readOnly rows={3} />
      <form onSubmit={(event) => {
        event.preventDefault();
        const error = game.loadFen(fenInput);
        setFenError(error || "");
        if (!error) { setFenInput(""); setFeedback("Position loaded."); }
      }}>
        <label htmlFor="import-fen">Load a position</label>
        <textarea id="import-fen" value={fenInput} onChange={(event) => setFenInput(event.target.value)}
          placeholder="Paste a FEN position" rows={3} aria-invalid={!!fenError} aria-describedby="fen-error" />
        <p id="fen-error" className="form-error" role="alert">{fenError}</p>
        <button className="secondary-button" disabled={!fenInput.trim()}>Load position</button>
      </form>
    </details>
  </aside>;
}
