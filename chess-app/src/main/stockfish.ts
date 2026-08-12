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
