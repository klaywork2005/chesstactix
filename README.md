<div align="center">

<img src="src/renderer/src/assets/chesstactix-logo.svg" alt="ChessTactix" width="96" />

# ChessTactix

**A desktop chess app: play Stockfish at eight strength levels, or open the
analysis board and watch the engine's top lines update as you move.**

[![Release](https://github.com/klaywork2005/chesstactix/actions/workflows/release.yml/badge.svg)](https://github.com/klaywork2005/chesstactix/actions/workflows/release.yml)
[![CI](https://github.com/klaywork2005/chesstactix/actions/workflows/ci.yml/badge.svg)](https://github.com/klaywork2005/chesstactix/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#installing)

</div>

---

## Contents

- [What it does](#what-it-does)
- [Installing](#installing)
- [Running from source](#running-from-source)
- [Project layout](#project-layout)
- [Available scripts](#available-scripts)
- [Documentation](#documentation)
- [Tech stack](#tech-stack)
- [Licensing](#licensing)

## What it does

**Play against the engine.** Eight strength rungs, from roughly 800 Elo up to
Stockfish at full strength. Pick a rung and a colour, and play. Below 1500 the
engine is handicapped with `Skill Level` and a shallow depth cap; from 1500 up
it uses Stockfish's own calibrated `UCI_LimitStrength`, so those ratings are the
engine authors' numbers rather than ours. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#the-strength-ladder) for the full
ladder and why it is built from two different mechanisms.

**Analyse any position.** The analysis board runs a three-line MultiPV search to
depth 16 and shows each candidate line with its evaluation, rendered in standard
algebraic notation. The best move is drawn on the board as an arrow, and any
alternative within 50 centipawns of it gets one too — so a position with one
clear best move looks different from one with three reasonable choices.

**Review a game move by move.** Every position is a point in a linear history
you can walk with the arrow keys or by clicking a move in the list. Playing a
move from a position you navigated back to discards what came after it and
continues from there — the same undo/redo model as a text editor. On the
analysis board, every position you land on is re-evaluated as you arrive.

**Entirely local.** The engine is WebAssembly running inside the app's own main
process. There are no accounts, no telemetry, and no network calls — nothing
about your games leaves the machine.

## Installing

Download an installer for your platform from the
[latest release](https://github.com/klaywork2005/chesstactix/releases/latest):

| Platform | File | Notes |
| --- | --- | --- |
| Windows | `ChessTactix-<version>-setup.exe` | NSIS wizard, per-user install — no admin prompt |
| macOS | `ChessTactix-<version>-<arch>.dmg` | Separate `arm64` and `x64` builds |
| Linux | `ChessTactix-<version>-<arch>.AppImage` | Portable; `chmod +x` then run |
| Linux (Debian/Ubuntu) | `ChessTactix-<version>-<arch>.deb` | `sudo apt install ./ChessTactix-*.deb` |

> [!NOTE]
> Builds are **not code-signed**. Windows SmartScreen will show a "Windows
> protected your PC" notice (choose *More info → Run anyway*) and macOS
> Gatekeeper will refuse the first launch (right-click the app → *Open*). This
> is expected until signing certificates are configured, and is documented in
> [docs/RELEASING.md](docs/RELEASING.md#code-signing).

## Running from source

Requires **Node.js 22** or newer.

```bash
git clone https://github.com/klaywork2005/chesstactix.git
cd chesstactix
npm install
npm run dev
```

`npm run dev` starts electron-vite with hot module replacement in the renderer
and a watch-rebuild for the main and preload processes.

> [!TIP]
> `npm install` pulls the `stockfish` package, which ships every build of the
> engine it offers — around 240 MB. Only the `lite-single` build is packaged
> into releases; the rest are filtered out in
> [electron-builder.yml](electron-builder.yml).

## Project layout

```
chesstactix/
├── .github/
│   ├── ISSUE_TEMPLATE/     Bug report and feature request forms
│   └── workflows/          ci.yml (typecheck + lint), release.yml (installers)
├── build/                  Installer resources: icons, entitlements, license text
├── docs/                   ARCHITECTURE.md, RELEASING.md, generated API docs
├── resources/              Runtime assets shipped with the app (window icon)
└── src/
    ├── main/               Electron main process — owns the Stockfish engine
    │   ├── index.ts        Window creation, lifecycle, IPC handler registration
    │   └── stockfish.ts    UCI driver: strength presets, best-move and MultiPV search
    ├── preload/            The context-isolated bridge between the two processes
    │   ├── index.ts        Exposes window.api via contextBridge
    │   └── index.d.ts      Ambient types for window.api, consumed by the renderer
    └── renderer/           React UI (Chromium)
        └── src/
            ├── components/ Screens (landing, setup, game, analysis) and panels
            ├── hooks/      useChessHistory, useBoardScale, useElementSize
            ├── utils/      Evaluation formatting, SAN conversion, material, strength
            └── types.ts    Types shared across the renderer
```

The three `src/` directories are compiled as **two separate TypeScript
programs** — `tsconfig.node.json` for main and preload, `tsconfig.web.json` for
the renderer — which is why a handful of types are deliberately duplicated
rather than imported.
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#the-two-typescript-programs)
explains the constraint and where the duplicates live.

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the app with HMR |
| `npm start` | Preview the last production build |
| `npm run build` | Typecheck, then build all three bundles into `out/` |
| `npm run typecheck` | Typecheck both TS programs (`:node` and `:web` run individually) |
| `npm run lint` | ESLint across the repo, Prettier rules included |
| `npm run format` | Rewrite the repo with Prettier |
| `npm run docs` | Generate the TypeDoc API reference into `docs/api/` |
| `npm run build:win` | Windows NSIS installer → `dist/` |
| `npm run build:mac` | macOS `.dmg` + `.zip` → `dist/` |
| `npm run build:linux` | Linux `.AppImage` + `.deb` → `dist/` |
| `npm run build:unpack` | Runnable unpacked app, no installer → `dist/win-unpacked/` |

Each installer must be built on the OS it targets. To produce all three at once,
push a `v*` tag and let CI do it — see [docs/RELEASING.md](docs/RELEASING.md).

## Documentation

| Document | Covers |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Process model, the IPC path, engine lifecycle, renderer state flow |
| [docs/RELEASING.md](docs/RELEASING.md) | Cutting a release, the tag→installer pipeline, signing |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, code style, the checks a PR must pass |
| [CHANGELOG.md](CHANGELOG.md) | Notable changes, newest first |
| `docs/api/` | TypeDoc reference, generated on demand with `npm run docs` |

## Tech stack

| Layer | Choice |
| --- | --- |
| Shell | [Electron](https://www.electronjs.org/) 39, [electron-vite](https://electron-vite.org/) 5 |
| UI | [React](https://react.dev/) 19, [Tailwind CSS](https://tailwindcss.com/) 4, [react-chessboard](https://github.com/Clariity/react-chessboard) 5 |
| Rules | [chess.js](https://github.com/jhlywa/chess.js) — move generation, legality, SAN, FEN |
| Engine | [Stockfish](https://stockfishchess.org/) 18, `lite-single` WebAssembly build, driven over UCI |
| Packaging | [electron-builder](https://www.electron.build/) 26 |
| Quality | TypeScript 5.9 (strict), ESLint 9, Prettier 3 |

## Licensing

ChessTactix is licensed under the **GNU General Public License v3.0** — see
[LICENSE](LICENSE).

This is not a free choice. The app ships Stockfish, which is itself GPL-3.0, and
the GPL requires that anything distributed with it be distributed under the same
terms. Practically, that means every release must be accompanied by its complete
corresponding source — which is this repository. The Windows installer displays
[build/license.txt](build/license.txt) during setup for the same reason.
