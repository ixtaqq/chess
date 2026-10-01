"use client";

import { useEffect, useRef } from "react";
import type { Move } from "chess.js";
import { List } from "lucide-react";

export default function MoveHistory({ moves }: { moves: Move[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [moves]);
  const pairs: { number: string; white?: string; black?: string }[] = [];
  for (const move of moves) {
    const number = move.before.split(" ")[5];
    let row = pairs.at(-1);
    if (!row || row.number !== number) {
      row = { number };
      pairs.push(row);
    }
    if (move.color === "w") row.white = move.san;
    else row.black = move.san;
  }
  return <div className="move-list" ref={scrollRef}>
    {pairs.length === 0 ? <div className="moves-empty">
      <List size={26} strokeWidth={1.3} />
      <p>A blank scoresheet.</p>
      <span>Your story starts with the first move.</span>
    </div> : <table aria-label="Move history">
      <thead><tr><th scope="col">#</th><th scope="col">White</th><th scope="col">Black</th></tr></thead>
      <tbody>{pairs.map((pair, index) => <tr key={`${pair.number}-${index}`}>
        <th scope="row">{pair.number}.</th><td>{pair.white || "…"}</td>
        <td className={index === pairs.length - 1 && pair.black ? "latest-move" : ""}>{pair.black || "—"}</td>
      </tr>)}</tbody>
    </table>}
  </div>;
}
