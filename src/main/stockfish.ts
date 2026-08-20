import stockfish from 'stockfish'

// Mirrored in src/preload/index.d.ts and src/renderer/src/types.ts, since
// each lives in a separate TS program. The renderer owns the human-facing
// names for these rungs (src/renderer/src/utils/strength.ts); this module
// owns only what the engine needs to actually play at them.
type StrengthLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

type StockfishEngine = {
  listener: ((line: string) => void) | null
  sendCommand: (command: string) => void
}

// Stockfish offers two different ways to play below full strength, and the
// ladder needs both:
//
//   UCI_LimitStrength + UCI_Elo is the engine's own calibrated handicap, so
//   an Elo asked for here is an Elo the authors stand behind. It only goes
//   down to 1320 though, which is well above a beginner.
//
//   Skill Level (0-20) plus a shallow depth cap is the only way to get
//   weaker than that. The Elo figures on those bottom rungs are our
//   estimates rather than the engine's, which is why the UI calls the whole
//   scale approximate.
//
// `depth` is always set: an unbounded `go` has no time control to stop it.
type StrengthPreset = {
  elo: number
  depth: number
  // when null, the engine plays at full strength and Skill Level applies
  uciElo: number | null
  skillLevel: number
}

const STRENGTH_PRESETS: Record<StrengthLevel, StrengthPreset> = {
  1: { elo: 800, depth: 1, uciElo: null, skillLevel: 0 },
  2: { elo: 1000, depth: 2, uciElo: null, skillLevel: 2 },
  3: { elo: 1200, depth: 3, uciElo: null, skillLevel: 4 },
  4: { elo: 1500, depth: 16, uciElo: 1500, skillLevel: 20 },
  5: { elo: 1800, depth: 16, uciElo: 1800, skillLevel: 20 },
  6: { elo: 2100, depth: 16, uciElo: 2100, skillLevel: 20 },
  7: { elo: 2500, depth: 16, uciElo: 2500, skillLevel: 20 },
  8: { elo: 3190, depth: 16, uciElo: null, skillLevel: 20 }
}

// Every strength-affecting option is sticky across commands on a reused
// engine instance, so each search has to state all of them rather than
// assume whatever the previous caller left behind.
function applyStrength(engine: StockfishEngine, preset: StrengthPreset): void {
  engine.sendCommand(`setoption name Skill Level value ${preset.skillLevel}`)
  engine.sendCommand(`setoption name UCI_LimitStrength value ${preset.uciElo !== null}`)
  if (preset.uciElo !== null) {
    engine.sendCommand(`setoption name UCI_Elo value ${preset.uciElo}`)
  }
}

// Lazily create a single engine instance and reuse it for the app's
// lifetime -- loading the WASM engine has real startup cost.
let enginePromise: Promise<StockfishEngine> | null = null

// Stockfish only has one `listener` slot, so concurrent getBestMove() calls
// would clobber each other's callbacks. This queue serializes them.
let queue: Promise<unknown> = Promise.resolve()

async function initEngine(): Promise<StockfishEngine> {
  // 'lite-single' avoids the worker_threads/SharedArrayBuffer setup the
  // full multi-threaded build needs, at the cost of some engine strength --
  // plenty strong for a casual opponent.
  const engine = (await stockfish('lite-single')) as StockfishEngine

  // Standard UCI handshake: "uci" -> "uciok", then "isready" -> "readyok".
  await new Promise<void>((resolve) => {
    engine.listener = (line: string) => {
      if (line === 'uciok') {
        engine.sendCommand('isready')
      } else if (line === 'readyok') {
        engine.listener = null
        resolve()
      }
    }
    engine.sendCommand('uci')
  })

  return engine
}

function getEngine(): Promise<StockfishEngine> {
  if (!enginePromise) {
    enginePromise = initEngine()
  }
  return enginePromise
}

function waitForBestMove(engine: StockfishEngine): Promise<string | null> {
  return new Promise((resolve) => {
    engine.listener = (line: string) => {
      const match = /^bestmove (\S+)/.exec(line)
      if (match) {
        engine.listener = null
        resolve(match[1] === '(none)' ? null : match[1])
      }
    }
  })
}

async function requestBestMove(fen: string, level: StrengthLevel): Promise<string | null> {
  const engine = await getEngine()
  const preset = STRENGTH_PRESETS[level]

  applyStrength(engine, preset)
  engine.sendCommand(`position fen ${fen}`)

  const bestMovePromise = waitForBestMove(engine)
  engine.sendCommand(`go depth ${preset.depth}`)

  return bestMovePromise
}

/**
 * Asks the engine for its move in a position, played at the given strength.
 *
 * Backs the `chess:getBestMove` IPC channel. Requests are queued behind any
 * search already in flight -- the engine binding has a single listener slot, so
 * concurrent searches would clobber each other's callbacks.
 *
 * @param fen - The position to move in.
 * @param level - Which rung of the strength ladder to play at. Every
 * strength-affecting UCI option is restated on each call, so this never
 * inherits the previous caller's settings.
 * @returns A UCI move string such as `'e2e4'` (or `'e7e8q'` for a promotion),
 * or `null` if the position has no legal moves.
 */
export function getBestMove(fen: string, level: StrengthLevel): Promise<string | null> {
  const result = queue.then(() => requestBestMove(fen, level))
  // keep the queue alive even if this request fails, so later ones still run
  queue = result.catch(() => undefined)
  return result
}

/**
 * One candidate line from a MultiPV search.
 *
 * `scoreCp` and `scoreMate` are mutually exclusive, and both are relative to
 * the side to move (positive = good for whoever's turn it is), matching UCI's
 * own convention. Rendering one from White's perspective is what
 * `utils/engine.ts` is for.
 */
export type EngineLine = {
  /** The line's `multipv` rank: 1 is the engine's best. */
  rank: number
  /** Search depth the line was reported at, in plies. */
  depth: number
  /** Evaluation in centipawns, or `null` if this line ends in a forced mate. */
  scoreCp: number | null
  /** Moves to mate (negative if being mated), or `null` for a centipawn score. */
  scoreMate: number | null
  /** The principal variation as UCI move strings, e.g. `['e2e4', 'e7e5']`. */
  pv: string[]
}

async function requestAnalysis(fen: string, multiPv: number, depth: number): Promise<EngineLine[]> {
  const engine = await getEngine()
  const lines = new Map<number, EngineLine>()

  const searchDone = new Promise<void>((resolve) => {
    engine.listener = (line: string) => {
      if (line.startsWith('bestmove')) {
        engine.listener = null
        resolve()
        return
      }

      // Only "info ... pv ..." lines carry a candidate line; progress-only
      // lines (nps, hashfull, ...) don't and should just be ignored.
      const pvMatch = /\bpv (.+)$/.exec(line)
      if (!line.startsWith('info') || !pvMatch) {
        return
      }

      const multipvMatch = /\bmultipv (\d+)/.exec(line)
      const depthMatch = /\bdepth (\d+)/.exec(line)
      const cpMatch = /\bscore cp (-?\d+)/.exec(line)
      const mateMatch = /\bscore mate (-?\d+)/.exec(line)

      if (!multipvMatch || !depthMatch) {
        return
      }

      lines.set(Number(multipvMatch[1]), {
        rank: Number(multipvMatch[1]),
        depth: Number(depthMatch[1]),
        scoreCp: cpMatch ? Number(cpMatch[1]) : null,
        scoreMate: mateMatch ? Number(mateMatch[1]) : null,
        pv: pvMatch[1].trim().split(' ')
      })
    }
  })

  // Reusing one engine instance means MultiPV is sticky across calls -- set
  // it explicitly every time rather than assuming the previous value. The
  // same goes for the strength options: analysis must always run at full
  // strength, or a game played against a handicapped opponent would leave
  // the analysis board quietly evaluating at that same low Elo.
  engine.sendCommand(`setoption name MultiPV value ${multiPv}`)
  applyStrength(engine, STRENGTH_PRESETS[8])
  engine.sendCommand(`position fen ${fen}`)
  engine.sendCommand(`go depth ${depth}`)

  await searchDone

  // Reset MultiPV to 1 afterwards so getBestMove() (used for the AI
  // opponent) isn't left paying for a multi-line search it never asked for.
  engine.sendCommand('setoption name MultiPV value 1')

  return Array.from(lines.values()).sort((a, b) => a.rank - b.rank)
}

/**
 * Runs a MultiPV search and returns the engine's ranked candidate lines.
 *
 * Backs the `chess:analyzePosition` IPC channel, and shares the request queue
 * with {@link getBestMove}.
 *
 * Always searches at **full strength**, whatever level the last game was played
 * at. Without that, analysing after a game against a handicapped opponent would
 * quietly evaluate at that same low Elo. `MultiPV` is likewise set on entry and
 * reset to 1 on exit, so the AI opponent never pays for a multi-line search it
 * did not ask for.
 *
 * @param fen - The position to analyse.
 * @param multiPv - How many candidate lines to ask for.
 * @param depth - Search depth in plies. Always bounded: an unbounded `go` has
 * no time control to stop it.
 * @returns Up to `multiPv` lines, best first. See {@link EngineLine}.
 */
export function analyzePosition(
  fen: string,
  multiPv: number,
  depth: number
): Promise<EngineLine[]> {
  const result = queue.then(() => requestAnalysis(fen, multiPv, depth))
  queue = result.catch(() => undefined)
  return result
}
