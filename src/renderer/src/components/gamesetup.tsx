import { STRENGTH_LEVELS, MIN_LEVEL, MAX_LEVEL, getStrength } from '../utils/strength'
import type { AiOptions, PlayerColor, StrengthLevel } from '../types'

type GameSetupProps = {
  /** The current selection. Owned by App, so it survives leaving this screen. */
  aiOptions: AiOptions
  /** Called with the full next selection whenever either control changes. */
  onChange: (next: AiOptions) => void
  /** Starts the game with the current selection. */
  onStart: () => void
}

const COLORS: PlayerColor[] = ['white', 'black']

/**
 * The pre-game screen: pick an engine strength and a side.
 *
 * Fully controlled -- it holds no state of its own, so the choices persist when
 * the screen unmounts and are still selected on the next visit.
 *
 * The strength control is a slider *and* a row of clickable Elo ticks. The
 * ticks make every rung reachable without dragging and keep the whole ladder
 * visible at once, which a bare slider cannot do.
 */
const GameSetup = ({ aiOptions, onChange, onStart }: GameSetupProps): React.JSX.Element => {
  const strength = getStrength(aiOptions.level)

  // where the current rung sits along the track, 0 at the weakest and 1 at
  // the strongest -- used to place the readout above the thumb
  const progress = (aiOptions.level - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL)

  return (
    <div className="bg-neutral-900 border-1 border-amber-300 rounded-lg flex w-full max-w-2xl flex-col px-10 py-8 text-amber-100">
      <h2 className="text-4xl font-bold text-amber-100">Play vs AI</h2>
      <p className="mt-2 text-[15px] text-amber-100/50">
        Pick a strength and a side. You can change both from the New Game button later.
      </p>

      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-neutral-800 pb-1.5">
          <h3 className=" font-semibold tracking-[0.18em] text-amber-200/60 uppercase">
            Engine strength
          </h3>
          <span className="font-mono text-sm text-amber-200/60">
            {aiOptions.level} / {MAX_LEVEL}
          </span>
        </div>

        {/* Readout: the Elo is the headline, the name is the gloss. */}
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-4xl leading-none text-amber-100">~{strength.elo}</span>
          <span className="text-[15px] text-amber-100/60"> {strength.name} ELO Level</span>
        </div>

        <input
          type="range"
          min={MIN_LEVEL}
          max={MAX_LEVEL}
          step={1}
          value={aiOptions.level}
          onChange={(event) =>
            onChange({ ...aiOptions, level: Number(event.target.value) as StrengthLevel })
          }
          aria-label="Engine strength"
          aria-valuetext={`Level ${aiOptions.level}, approximately ${strength.elo} Elo, ${strength.name}`}
          className="app-slider mt-7 w-full"
          style={{ '--progress': `${progress * 100}%` } as React.CSSProperties}
        />

        {/* Tick marks: every rung is clickable, so the slider is usable
            without dragging and the whole ladder stays visible at once. */}
        <div className="mt-3 flex justify-between">
          {STRENGTH_LEVELS.map((rung) => {
            const isCurrent = rung.level === aiOptions.level
            return (
              <button
                key={rung.level}
                type="button"
                onClick={() => onChange({ ...aiOptions, level: rung.level })}
                title={`${rung.name} — approx. ${rung.elo} Elo`}
                className={`cursor-pointer text-xs transition-colors ${
                  isCurrent ? 'text-amber-200' : 'text-amber-200/25 hover:text-amber-200/60'
                }`}
              >
                {rung.elo}
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-amber-100/60">
          Ratings are approximate. The top five rungs use Stockfish&rsquo;s own strength limiter;
          the weakest three sit below its floor and are estimated.
        </p>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-neutral-800 pb-1.5">
          <h3 className=" font-semibold tracking-[0.18em] text-amber-200/60 uppercase">Play as</h3>
        </div>

        <div className="mt-5 flex gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...aiOptions, playerColor: color })}
              className={`w-28 cursor-pointer rounded px-6 py-2.5 text-[15px] capitalize transition-colors ${
                aiOptions.playerColor === color
                  ? 'bg-amber-400 font-bold text-amber-950'
                  : 'bg-neutral-800 text-amber-100/70 hover:bg-neutral-700 hover:text-amber-100'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onStart}
        className="mt-14 cursor-pointer self-start rounded bg-amber-400 px-8 py-3 text-lg font-bold text-amber-950 transition-colors hover:bg-amber-300 active:bg-amber-500"
      >
        Start game
      </button>
    </div>
  )
}

export default GameSetup
