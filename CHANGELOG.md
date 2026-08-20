# Changelog

All notable changes to ChessTactix are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project documentation: `README.md`, `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`,
  and `docs/RELEASING.md`.
- `LICENSE` (GPL-3.0) at the repository root — the licence was declared in
  `package.json` and shipped in the Windows installer, but was not present as a
  repository file.
- TypeDoc API reference, generated into `docs/api/` with `npm run docs`.
- TSDoc comments across the exported API surface: the IPC bridge, hooks, and
  utility modules.
- Continuous integration workflow running typecheck and lint on every push and
  pull request.
- GitHub issue forms and a pull request template.
- `.gitattributes`, normalising line endings to LF regardless of checkout
  platform.

### Changed

- **Repository restructured.** The application moved from `chess-app/` to the
  repository root, so a clone is directly installable and runnable. The release
  workflow's working directory and artifact paths were updated to match.
- Root `.gitignore` expanded to cover build output, tool caches, TypeScript
  incremental state, generated API docs, code-signing material, and editor and
  OS cruft.

### Fixed

- Two missing explicit return types (`background.tsx`, `header.tsx`) that failed
  the `@typescript-eslint/explicit-function-return-type` rule.
- CRLF line endings that had crept into `header.tsx`.

### Removed

- A stray root `package.json`, `package-lock.json`, and a committed
  `node_modules/` directory containing an unused `tailwind-scrollbar-hide`
  dependency. The `scrollbar-hide` utility is defined directly in
  `src/renderer/src/assets/main.css` and never used the package.
- `tsconfig.web.tsbuildinfo`, a build artifact that was tracked in version
  control.

## [1.0.0] — 2026-08-18

First complete release.

### Added

- **Play against Stockfish** across eight strength levels, from roughly 800 Elo
  to full engine strength, playing as either colour. Levels 1–3 use `Skill Level`
  with a shallow depth cap; levels 4–7 use Stockfish's calibrated
  `UCI_LimitStrength`.
- **Analysis board** with a three-line MultiPV search to depth 16, showing each
  candidate line's evaluation and its continuation in standard algebraic
  notation.
- **Board arrows** for the engine's best move, plus any alternative within 50
  centipawns of it.
- **Evaluation bar** scaled through the standard logistic curve, so it reads
  sensitively near equality and saturates gently once a position is decided.
- **Move history navigation** — click any ply or use the arrow keys to walk the
  game. Playing from an earlier position branches from there. On the analysis
  board, each position is re-evaluated as you reach it.
- **Capture tray and material balance**, derived from the position itself so it
  stays correct for any position reached through history.
- **Promotion dialog** rendered on the promoting square, queen first.
- **Resizable board** with the size preference persisted across screens and
  restarts.
- **Landing page** and game setup screen.
- Installers for Windows (NSIS), macOS (`.dmg` and `.zip`, arm64 and x64), and
  Linux (`.AppImage` and `.deb`), built by a tag-triggered GitHub Actions
  release workflow.

[Unreleased]: https://github.com/klaywork2005/chesstactix/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/klaywork2005/chesstactix/releases/tag/v1.0.0
