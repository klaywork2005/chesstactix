<!--
Thanks for contributing. Keep one concern per pull request -- a formatting
sweep bundled with a behaviour change is very hard to review.
-->

## What this changes

<!-- A sentence or two. Link the issue it closes, if there is one: Closes #12 -->

## Why

<!--
The reasoning that is not obvious from the diff. If you rejected another
approach, say so -- that is the part reviewers cannot reconstruct.
-->

## How it was tested

<!--
There is no automated test suite yet, so describe the manual verification:
which screens you exercised, at which strength level, from which position.
-->

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Comments explain _why_, not what; exported API has TSDoc
- [ ] `CHANGELOG.md` updated under `## [Unreleased]`, if a user would notice this
- [ ] Docs updated in this PR, if this touches any of:
  - the IPC surface (`src/main/index.ts` + `src/preload/` + `docs/ARCHITECTURE.md`)
  - the strength ladder (both `STRENGTH_PRESETS` **and** `STRENGTH_LEVELS`)
  - a type duplicated across the process boundary (all three copies)
  - packaging (`electron-builder.yml` + `docs/RELEASING.md`)
