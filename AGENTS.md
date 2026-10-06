# Chess Club

A local chess app for two players on one device or a computer opponent.

## Stack

- Next.js 16.3.8 App Router, React 19.2.4, TypeScript 5.
- Tailwind CSS 4 plus semantic styles in `src/app/globals.css`.
- chess.js owns all chess rules; react-chessboard renders the board.
- npm with `package-lock.json`. Node 22.23.3 is verified on this machine.

## Commands

In PowerShell, load the workspace runtime with `. 'E:\Workspace\Project\Use-Node22.ps1'`.

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Development | `npm run dev -- --hostname 127.0.0.1 --port 3000` |
| Build | `npm run build` |
| Production | `npm run start -- --hostname 127.0.0.1 --port 3000` |
| Tests | `npm test` |
| Types | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Dependencies | `npm audit` |

## Layout and conventions

- `src/app/` contains the page, root layout, favicon, and styles.
- `src/components/` contains board, scoresheet, controls, and captured pieces.
- `src/lib/useChessGame.ts` owns the live game and cancellable worker lifecycle.
- `src/lib/game-state.ts` derives captures, status, notation, and undo behavior.
- `src/lib/chess-ai.ts` searches positions; `chess-ai.worker.ts` runs it off the UI thread.
- `tests/game.test.mjs` uses Node's built-in test runner and real chess.js games.
- Use named types, double quotes, semicolons, and the `@/` alias for app imports.
- Validate FEN before loading. Derive game state from chess.js rather than parallel counters.
- Keep worker cancellation correct on undo, reset, opponent changes, and color changes.

## Verification

Run build, test, typecheck, and lint. Exercise gameplay in a production browser:
both opponent modes and colors, AI cancellation, keyboard/click/drag moves,
castling, en passant, promotion, undo, draws, FEN import, clipboard, and PGN export.
Check narrow phone widths for horizontal overflow. Never substitute a build for UI verification.

## Shared agent workflow

Read `E:\workspace\agent-homebase\PROJECT-WORKFLOW.md` for the shared workflow.
Use the globally available skills that match the task and the project checks above.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
