# ChessTactix

A desktop chess app: play against Stockfish at eight strength levels, or open
the analysis board and see the engine's top candidate lines as you move.

Built with Electron, React and TypeScript. The engine is
[Stockfish](https://stockfishchess.org/) compiled to WebAssembly, running in
the main process and driven over UCI.

## Development

```bash
npm install
npm run dev
```

`npm run typecheck` and `npm run lint` cover the two TypeScript programs
(main/preload and renderer) and the lint rules.

## Building installers

Each installer is built on the OS it targets — a `.dmg` can only be produced
on macOS, and the Linux targets need Linux tooling. There is no way around
this from a single machine.

```bash
npm run build:win     # dist/ChessTactix-<version>-setup.exe  (NSIS installer)
npm run build:mac     # dist/ChessTactix-<version>-<arch>.dmg + .zip
npm run build:linux   # dist/ChessTactix-<version>-<arch>.AppImage + .deb
npm run build:unpack  # dist/win-unpacked/ -- runnable app, no installer
```

To build all three, push a `v*` tag: `.github/workflows/release.yml` runs the
matrix on Windows, macOS and Linux runners and uploads the installers to the
GitHub release. `workflow_dispatch` runs the same build without publishing.

The Windows installer is a normal wizard: it installs per-user (no admin
prompt), creates Start Menu and desktop shortcuts, and registers an
uninstaller under Apps & features. Nothing is code-signed, so Windows
SmartScreen and macOS Gatekeeper will both warn on first run until
certificates are configured.

## Licensing

Stockfish is licensed under the **GPL-3.0**, and this app ships it, so the
distributed app is GPL-3.0 too — `build/license.txt` (shown by the Windows
installer) carries the license text, and the source is this repository.
