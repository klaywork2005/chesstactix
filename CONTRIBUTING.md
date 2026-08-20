# Contributing to ChessTactix

Thanks for taking an interest. This document covers getting set up, the
conventions the codebase follows, and what a change needs to pass before it can
be merged.

- [Getting set up](#getting-set-up)
- [The checks](#the-checks)
- [Code style](#code-style)
- [Conventions worth knowing](#conventions-worth-knowing)
- [Commits and pull requests](#commits-and-pull-requests)
- [Reporting bugs](#reporting-bugs)
- [Licensing of contributions](#licensing-of-contributions)

## Getting set up

Requires **Node.js 22** or newer.

```bash
git clone https://github.com/klaywork2005/chesstactix.git
cd chesstactix
npm install
npm run dev
```

`npm install` is slow the first time — the `stockfish` package ships every build
of the engine it offers, around 240 MB. This is expected.

For debugging, the repository ships VS Code launch configurations
([.vscode/launch.json](.vscode/launch.json)). **Debug All** starts the main
process under the Node debugger and attaches Chrome DevTools to the renderer at
the same time.

Before anything non-trivial, read
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The process split and the
duplicated cross-boundary types are the two things most likely to trip you up,
and both are explained there.

## The checks

Every pull request must pass these. CI
([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs them on push, but run
them locally first:

```bash
npm run typecheck   # both TS programs -- main/preload and renderer
npm run lint        # ESLint, with Prettier rules enforced as lint errors
```

If lint complains only about formatting, `npm run format` fixes it.

There is no test suite yet. Until there is, describe in your pull request how you
verified the change by hand — which screens you exercised, and with what.

## Code style

Prettier owns formatting; there is nothing to argue about and nothing to
hand-align. The configuration is in [.prettierrc.yaml](.prettierrc.yaml): single
quotes, no semicolons, 100-column width, no trailing commas. Line endings are LF,
enforced by [.gitattributes](.gitattributes).

Beyond formatting, match what is already there:

**Comments explain why, not what.** This codebase is unusually well commented and
the standard is worth holding. A comment that restates the code earns nothing; a
comment that records a constraint, a rejected alternative, or a bug the code is
shaped to avoid is the most valuable thing in the file. Compare:

```ts
// bad -- says what the line already says
// set the listener to null
engine.listener = null

// good -- says why this shape exists
// Stockfish only has one `listener` slot, so concurrent getBestMove() calls
// would clobber each other's callbacks. This queue serializes them.
let queue: Promise<unknown> = Promise.resolve()
```

**Exported API gets TSDoc.** Exported functions, hooks, and types carry `/** */`
doc comments — they drive editor hovers and the generated reference. Internal
helpers can keep using plain `//` comments.

```bash
npm run docs      # regenerate docs/api/ and check your comments render
```

**Naming and file conventions.** Component files are lowercase
(`enginepanel.tsx`); hooks are camelCase and prefixed `use`; utility modules are
lowercase (`gamestatus.ts`). Components are arrow-function consts with an
explicit return type — `(): React.JSX.Element` — and a default export. ESLint
enforces the return type.

**Types.** `strict` is on and `any` is not acceptable in new code. Prefer narrow
unions (`'w' | 'b'`, `1 | 2 | ... | 8`) over `string` and `number` where the
domain is genuinely closed.

## Conventions worth knowing

**Three types are duplicated on purpose.** `StrengthLevel` and `EngineLine`
appear in `src/main/stockfish.ts`, `src/preload/index.d.ts`, and
`src/renderer/src/types.ts`. The main/preload and renderer sources are separate
TypeScript programs and cannot import from each other. If you change one, change
all three — each definition carries a comment naming the others.

**The strength ladder is defined twice.** `STRENGTH_PRESETS` (engine settings, in
`src/main/stockfish.ts`) and `STRENGTH_LEVELS` (Elo and display name, in
`src/renderer/src/utils/strength.ts`) describe the same eight rungs from
different sides of the same boundary. Same rule applies.

**Adding an IPC channel takes three edits**, not two: the handler in
`src/main/index.ts`, the wrapper in `src/preload/index.ts`, and the signature in
`src/preload/index.d.ts`. Skipping the last one leaves a call that works at
runtime but does not typecheck.

**Evaluation scores flip sign.** UCI reports scores relative to the side to move;
chess convention states them from White's perspective. Anything that displays an
evaluation must take `sideToMove` and flip. The bug is invisible on White's move,
so it survives casual testing.

**Never assume a UCI option survived the last call.** The engine instance is
reused for the app's lifetime and options are sticky. Set what you depend on,
every time.

## Commits and pull requests

Write commit subjects in the imperative mood, under about 72 characters, saying
what the commit does:

```
Add en-passant highlight to the analysis board
Fix eval sign on Black's move in the engine panel
```

[Conventional Commits](https://www.conventionalcommits.org/) prefixes (`feat:`,
`fix:`, `docs:`) are welcome but not required. Use the body to explain *why* when
the reason is not obvious from the diff.

For pull requests:

- Branch off `main`.
- Keep one concern per pull request. A formatting sweep bundled with a behaviour
  change is very hard to review.
- Fill in the [pull request template](.github/pull_request_template.md) — what
  changed, why, and how you tested it.
- Add an entry under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) for
  anything a user would notice.
- Update the docs alongside the code. A change to the strength ladder, the IPC
  surface, or the packaging filters should update
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) in the same pull request.

## Reporting bugs

Open an issue using the bug report form. The details that actually speed up a
fix are the **FEN of the position** (visible in the analysis board's state) or
the move list, the **strength level**, your **OS and app version**, and whether
you were running an installed build or from source.

For anything security-sensitive, do not open a public issue — email the address
in the app's Contact link.

## Licensing of contributions

ChessTactix is GPL-3.0, because it ships Stockfish and the GPL requires it.
Contributions are accepted under the same licence. By opening a pull request you
agree your changes are licensed under GPL-3.0 — see [LICENSE](LICENSE).
