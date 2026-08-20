import { Chessboard } from 'react-chessboard'
import { STRENGTH_LEVELS } from '../utils/strength'

type LandingPageProps = {
  onLandingPagePlayButtonClick: () => void
}

// Landing page chess game
const HERO_POSITION = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'

const CAPABILITIES: { term: string; detail: string }[] = [
  {
    term: 'Engine',
    detail:
      'Stockfish 18 running as a local process, across eight strength settings from roughly 800 Elo up to its full AI strength.'
  },
  {
    term: 'Analysis',
    detail:
      'Multi-line search to depth 16, with evaluations and best lines for every position in a game.'
  },
  {
    term: 'Review',
    detail:
      'Step through any game move by move. Every position is re-analyzed as you navigate to it.'
  },
  {
    term: 'Privacy',
    detail: 'No accounts, no telemetry, no network calls. Nothing ever leaves your local machine.'
  }
]

const LandingPage = ({ onLandingPagePlayButtonClick }: LandingPageProps): React.JSX.Element => {
  return (
    <div className="flex w-full max-w-[88rem] flex-col px-10">
      {/* Hero: the claim on the left, the product itself on the right. */}
      <section className="flex flex-col items-center gap-14 py-10 lg:flex-row lg:justify-between lg:gap-20">
        <div className="flex max-w-xl flex-col items-start">
          <span className="tracking-[0.2em] font-bold text-amber-200/80  border-b-1 pb-2 border-neutral-600/50">
            AVAILABLE ON: WINDOWS , MACOS OR LINUX
          </span>

          <h2 className="mt-4 text-5xl leading-[1.05] font-bold text-amber-100 lg:text-6xl">
            Play the most powerful chess engine,
            <br />
            Understand why
            <br />
            you lost.
          </h2>

          <p className="mt-6 max-w-md text-base leading-relaxed text-amber-100/60">
            A desktop chess app with a real local engine behind it. Play a game at any strength, or
            walk back through a game or opening of your choice and see how good your moves are.
          </p>

          <div className="mt-9 flex items-center gap-6">
            <button
              type="button"
              onClick={onLandingPagePlayButtonClick}
              className="cursor-pointer rounded bg-amber-400 px-7 py-3 text-base font-bold text-amber-950 transition-colors hover:bg-amber-300 active:bg-amber-500"
            >
              Play now
            </button>
            <span className="translate-y-4 -translate-x-2 text-xs tracking-wider text-amber-200/50">
              *No account required
            </span>
          </div>
        </div>

        {/* Static, non-interactive — this is the hero image, not a playable board. */}
        <div
          className="w-full max-w-[26rem] flex-none lg:max-w-[30rem]"
          aria-hidden="true"
          role="presentation"
        >
          <Chessboard
            options={{
              position: HERO_POSITION,
              allowDragging: false,
              allowDrawingArrows: false,
              showNotation: false,
              id: 'landing-hero'
            }}
          />
        </div>
      </section>

      {/* The strength ladder, drawn from the same table the setup slider uses
          so the two can never drift apart. */}
      <section className="border-t border-neutral-800 py-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-2xl font-bold text-amber-100">Eight strengths, one slider</h3>
          <span className="text-[15px] text-amber-100/50">
            Pick the engine opponent you can actually beat.
          </span>
        </div>

        <ol className="mt-9 flex items-end gap-1.5">
          {STRENGTH_LEVELS.map((rung, i) => (
            <li key={rung.level} className="flex flex-1 flex-col items-center gap-3">
              {/* a rising bar per rung, so the ladder reads as a ramp */}
              <div
                className="w-full rounded-t-sm bg-amber-400/70"
                style={{ height: `${1.25 + i * 0.75}rem` }}
                aria-hidden="true"
              />
              <div className="flex flex-col items-center gap-0.5 border-t border-neutral-700 pt-2.5 text-center">
                <span className=" text-amber-100/85">~{rung.elo}</span>
                <span className="leading-tight text-amber-100/60">{rung.name}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Capabilities as a definition list on hairline rules -- no boxes. */}
      <section className="border-t border-neutral-800 py-16">
        <dl className="flex flex-col">
          {CAPABILITIES.map((capability) => (
            <div
              key={capability.term}
              className="flex flex-col gap-1.5 border-b border-neutral-800/60 py-5 sm:flex-row sm:gap-10"
            >
              <dt className="w-40 flex-none  font-bold tracking-[0.18em] text-amber-200/45 uppercase">
                {capability.term}
              </dt>
              <dd className="max-w-2xl text-[15px] leading-relaxed text-amber-100/65">
                {capability.detail}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="flex items-center justify-between pb-16 text-lg text-amber-100/50">
        <span>ChessTactix was created Klay Garcia</span>
        <a
          href="https://github.com/klaywork2005/chesstactix"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-amber-100/70"
        >
          Source on GitHub
        </a>
      </footer>
    </div>
  )
}

export default LandingPage
