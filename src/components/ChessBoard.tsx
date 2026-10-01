"use client";

import { createContext, forwardRef, useContext, useMemo, useRef, useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import type { CustomSquareProps } from "react-chessboard/dist/chessboard/types";
import { Chess, type Square, type PieceSymbol } from "chess.js";

interface ChessBoardProps {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  disabled: boolean;
  orientation: "white" | "black";
  onMove: (source: Square, target: Square, promotion?: PieceSymbol) => boolean;
}

const BoardPosition = createContext<Chess | null>(null);
const PIECE_NAMES: Record<PieceSymbol, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

const BoardSquare = forwardRef<HTMLDivElement, CustomSquareProps>(function BoardSquare(
  { children, square, style }, ref
) {
  const piece = useContext(BoardPosition)?.get(square);
  const description = piece ? `${piece.color === "w" ? "White" : "Black"} ${PIECE_NAMES[piece.type]}` : "Empty square";
  return <div ref={ref} style={style} role="button" tabIndex={0} aria-label={square} aria-describedby={`piece-${square}`}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.currentTarget.click();
      }
    }}><span id={`piece-${square}`} className="sr-only">{description}</span>{children}</div>;
});

const PROMOTIONS: { piece: PieceSymbol; name: string; symbol: string }[] = [
  { piece: "q", name: "Queen", symbol: "♛" },
  { piece: "r", name: "Rook", symbol: "♜" },
  { piece: "b", name: "Bishop", symbol: "♝" },
  { piece: "n", name: "Knight", symbol: "♞" },
];

export default function ChessBoard({ fen, lastMove, disabled, orientation, onMove }: ChessBoardProps) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [selection, setSelection] = useState<{ fen: string; square: Square } | null>(null);
  const [promotion, setPromotion] = useState<{ fen: string; from: Square; to: Square } | null>(null);
  const position = useMemo(() => new Chess(fen), [fen]);
  const selected = selection?.fen === fen && !disabled ? selection.square : null;
  const pendingPromotion = promotion?.fen === fen && !disabled ? promotion : null;
  const legalMoves = selected ? position.moves({ square: selected, verbose: true }) : [];

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function move(from: Square, to: Square) {
    if (disabled) return false;
    const candidate = position.moves({ square: from, verbose: true }).find((item) => item.to === to);
    if (!candidate) return false;
    if (candidate.promotion) {
      setPromotion({ fen, from, to });
      return false;
    }
    const moved = onMove(from, to);
    if (moved) setSelection(null);
    return moved;
  }

  function selectSquare(square: Square) {
    if (disabled || pendingPromotion) return;
    if (selected && move(selected, square)) return;
    const piece = position.get(square);
    setSelection(piece?.color === position.turn() && square !== selected ? { fen, square } : null);
  }

  const styles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    styles[lastMove.from] = { backgroundColor: "#c6cba0" };
    styles[lastMove.to] = { backgroundColor: "#b7c287" };
  }
  if (selected) styles[selected] = { backgroundColor: "#d5c784" };
  for (const item of legalMoves) {
    styles[item.to] = { background: position.get(item.to)
      ? "radial-gradient(circle, transparent 78%, #243c4270 80%)"
      : "radial-gradient(circle, #243c4260 18%, transparent 20%)" };
  }
  if (position.isCheck()) {
    const king = position.board().flat().find((piece) => piece?.type === "k" && piece.color === position.turn());
    if (king) styles[king.square] = { backgroundColor: "#c88670" };
  }

  return <div className="board-container" ref={container} aria-label="Chess board">
    {width > 0 ? <BoardPosition.Provider value={position}><Chessboard id="main-board" position={fen} boardWidth={width}
      boardOrientation={orientation} onPieceDrop={move} onSquareClick={selectSquare}
      onPromotionCheck={() => false} customSquare={BoardSquare}
      arePiecesDraggable={!disabled && !pendingPromotion}
      isDraggablePiece={({ piece }) => piece[0] === position.turn()}
      customSquareStyles={styles} animationDuration={0}
      customDarkSquareStyle={{ backgroundColor: "#729084" }}
      customLightSquareStyle={{ backgroundColor: "#e9ebdf" }}
      customNotationStyle={{ fontSize: "12px", fontFamily: "inherit", fontWeight: "600" }}
      customBoardStyle={{ borderRadius: "3px", overflow: "hidden" }} /></BoardPosition.Provider>
      : <div className="board-placeholder" />}
    {pendingPromotion && <div className="promotion-backdrop">
      <div className="promotion-picker" role="dialog" aria-modal="true" aria-labelledby="promotion-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") setPromotion(null);
          if (event.key === "Tab") {
            const buttons = event.currentTarget.querySelectorAll("button");
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }}>
        <h3 id="promotion-title">Choose your promotion</h3>
        <div>{PROMOTIONS.map((option) => <button key={option.piece} autoFocus={option.piece === "q"}
          aria-label={`Promote to ${option.name.toLowerCase()}`}
          onClick={() => { onMove(pendingPromotion.from, pendingPromotion.to, option.piece); setPromotion(null); setSelection(null); }}>
          <span aria-hidden="true">{option.symbol}</span>{option.name}
        </button>)}</div>
        <button className="text-button" onClick={() => setPromotion(null)}>Cancel</button>
      </div>
    </div>}
  </div>;
}
