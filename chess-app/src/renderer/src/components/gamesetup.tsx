import type { AiOptions, Difficulty, PlayerColor } from '../types'

type GameSetupProps = {
  aiOptions: AiOptions
  onChange: (next: AiOptions) => void
  onStart: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const COLORS: PlayerColor[] = ['white', 'black']

const GameSetup = ({ aiOptions, onChange, onStart }: GameSetupProps) => {
  return (
    <div className="flex flex-col items-center gap-6 rounded-lg bg-neutral-900/60 px-10 py-8 text-amber-100">
      <h2 className="text-2xl font-bold">Play vs AI</h2>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-amber-300">Difficulty</span>
        <div className="flex gap-2">
          {DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => onChange({ ...aiOptions, difficulty })}
              className={`rounded px-4 py-2 capitalize transition-colors ${
                aiOptions.difficulty === difficulty
                  ? 'bg-amber-500 text-neutral-900'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-amber-300">Play as</span>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...aiOptions, playerColor: color })}
              className={`rounded px-4 py-2 capitalize transition-colors ${
                aiOptions.playerColor === color
                  ? 'bg-amber-500 text-neutral-900'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-2 rounded bg-amber-500 px-6 py-3 text-lg font-bold text-neutral-900 transition-colors hover:bg-amber-400"
      >
        Start Game
      </button>
    </div>
  )
}

export default GameSetup
