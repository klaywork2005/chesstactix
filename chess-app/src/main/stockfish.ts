import stockfish from 'stockfish'

// Mirrored (as plain string unions) in src/preload/index.d.ts and
// src/renderer/src/types.ts, since each lives in a separate TS program.
type Difficulty = 'easy' | 'medium' | 'hard'

type StockfishEngine = {
  listener: ((line: string) => void) | null
  sendCommand: (command: string) => void
}

// Skill Level is Stockfish's own 0-20 strength dial; depth caps how many
// plies it searches. Both combine to make "easy" actually easy rather than
// just slow.
const DIFFICULTY_PRESETS: Record<Difficulty, { skillLevel: number; depth: number }> = {
  easy: { skillLevel: 3, depth: 5 },
  medium: { skillLevel: 10, depth: 10 },
  hard: { skillLevel: 20, depth: 16 }
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

async function requestBestMove(fen: string, difficulty: Difficulty): Promise<string | null> {
  const engine = await getEngine()
  const preset = DIFFICULTY_PRESETS[difficulty]

  engine.sendCommand(`setoption name Skill Level value ${preset.skillLevel}`)
  engine.sendCommand(`position fen ${fen}`)

  const bestMovePromise = waitForBestMove(engine)
  engine.sendCommand(`go depth ${preset.depth}`)

  return bestMovePromise
}

// Returns a UCI move string like "e2e4" (or "e7e8q" for a promotion), or
// null if the position has no legal moves.
export function getBestMove(fen: string, difficulty: Difficulty): Promise<string | null> {
  const result = queue.then(() => requestBestMove(fen, difficulty))
  // keep the queue alive even if this request fails, so later ones still run
  queue = result.catch(() => undefined)
  return result
}

// One candidate line from a MultiPV search. `scoreCp`/`scoreMate` are
// mutually exclusive and relative to the side to move (positive = good for
// whoever's turn it is), matching UCI's own convention.
export type EngineLine = {
  rank: number
  depth: number
  scoreCp: number | null
  scoreMate: number | null
  pv: string[]
}

async function requestAnalysis(
  fen: string,
  multiPv: number,
  depth: number
): Promise<EngineLine[]> {
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
  // it explicitly every time rather than assuming the previous value.
  engine.sendCommand(`setoption name MultiPV value ${multiPv}`)
  engine.sendCommand(`position fen ${fen}`)
  engine.sendCommand(`go depth ${depth}`)

  await searchDone

  // Reset MultiPV to 1 afterwards so getBestMove() (used for the AI
  // opponent) isn't left paying for a multi-line search it never asked for.
  engine.sendCommand('setoption name MultiPV value 1')

  return Array.from(lines.values()).sort((a, b) => a.rank - b.rank)
}

// Returns up to `multiPv` candidate lines for the position, best first.
export function analyzePosition(
  fen: string,
  multiPv: number,
  depth: number
): Promise<EngineLine[]> {
  const result = queue.then(() => requestAnalysis(fen, multiPv, depth))
  queue = result.catch(() => undefined)
  return result
}
