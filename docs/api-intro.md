# ChessTactix API reference

Generated from the TSDoc comments in the source. This covers the modules that
form ChessTactix's internal API surface — the engine driver, the IPC bridge, the
shared hooks, and the pure utility functions. React components are deliberately
excluded: their contracts are their prop types, which read better in the source
than in a generated page.

Regenerate with:

```bash
npm run docs
```

Start with:

- **`main/stockfish`** — the UCI driver. The only module that speaks to the
  engine, and the one that owns the strength presets and the request queue.
- **`preload/index`** — the two functions the renderer is allowed to call, and
  the `window.api` declaration that types them.
- **`renderer/hooks/useChessHistory`** — the game-history model both board
  screens are built on.
- **`renderer/utils/engine`** — evaluation formatting and PV-to-SAN conversion,
  including the score-sign convention that trips people up.

For how the pieces fit together — the process model, the IPC path, the reasons
behind the duplicated types — read
[ARCHITECTURE.md](https://github.com/klaywork2005/chesstactix/blob/main/docs/ARCHITECTURE.md)
first. This reference documents the parts; that document explains the whole.
