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
    <div className="flex flex-col items-center justify-center gap-8 rounded-lg bg-neutral-900/60 w-[40vw] h-[65vh] text-amber-100">
      <h2 className="text-4xl font-bold">Play vs AI</h2>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm uppercase tracking-wide text-amber-200">Difficulty</span>
        <div className="flex gap-2">
          {DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              onClick={() => onChange({ ...aiOptions, difficulty })}
              className={`flex justify-center rounded px-8 py-3 w-24 capitalize transition-colors ${
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
        <span className="text-sm uppercase tracking-wide text-amber-200">Play as</span>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...aiOptions, playerColor: color })}
              className={`flex justify-center rounded px-8 py-3 w-24 capitalize transition-colors ${
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
        className="cursor-pointer mt-4 rounded bg-amber-500 px-8 py-3 text-3xl font-bold text-amber-950 transition-colors hover:bg-amber-600"
      >
        Start Game
      </button>
    </div>
  )
}

export default GameSetup
