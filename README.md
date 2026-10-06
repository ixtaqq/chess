# Chess Club

A quiet place for a game of chess. Play a friend on the same device or challenge the computer at three difficulty levels.

## Run locally

Installed at `E:\Workspace\Project\web\chess`. This project uses npm and Node 22 or newer.

```powershell
Set-Location 'E:\Workspace\Project\web\chess'
. 'E:\Workspace\Project\Use-Node22.ps1'
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open <http://localhost:3000>. For a production run:

```powershell
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

On a fresh clone, install with `npm ci` first.

## Playing

- Click a piece and a legal destination, or drag a piece. Tab and Enter/Space also select squares.
- Legal moves, the last move, and a king in check are highlighted.
- Choose a friend or computer in the game panel. Computer games support White or Black and Easy, Medium, or Hard.
- New game resets the board. Changing opponent or color starts a new game.
- Undo takes back one move locally, or the last human/computer turn against the computer. It also cancels a pending search.
- Flip changes the view. Right-click and drag to annotate the board with an arrow.
- Choose queen, rook, bishop, or knight when a pawn promotes.
- Copy position copies FEN. Export PGN downloads the game with setup headers and the result.
- Position tools accepts FEN for studying a position; invalid input leaves the board unchanged.

Games live in the current browser session. Refreshing starts a fresh game. Friend mode is for sharing one device.

## Verification

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
npm audit
```

The tests cover legal AI moves at each level, search preserving the original game, mate, draws, captures, undo before and after an AI response, playing Black, and PGN round trips.

## Design and engineering references

This redesign uses the existing Next.js/chess.js/react-chessboard stack. Its warm ivory surfaces, green board, editorial headings, and compact controls follow the interaction guidance in [Emil Kowalski's design engineering skill](https://github.com/emilkowalski/skills/tree/main/skills/emil-design-eng). Motion is reserved for brief button feedback, with reduced-motion support.

The debugging and verification work follows [pstack](https://github.com/cursor/plugins/tree/main/pstack): reproduce defects, fix their causes, derive game state from the rules engine, preserve type safety, and verify the running production app directly.

| Before | After | Why |
| --- | --- | --- |
| Fixed 560px board | Board measured from its container | Fits phones and desktops |
| Drag-only interaction | Click, drag, and keyboard selection | Makes legal destinations visible and usable |
| Search on the UI thread | Cancellable Web Worker | Controls remain responsive during hard search |
| AI state synchronized through several refs | Worker follows the actual game snapshot and settings | Computer opens correctly when playing White |
| Generic draw result | Specific draw reasons | Makes game endings understandable |
| Hand-built PGN move string | chess.js PGN with setup and result | Preserves loaded positions and final outcomes |
