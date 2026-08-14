type Feature = {
  icon: string
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: 'fa-solid fa-chess-king',
    title: 'Multiple Stockfish Strengths',
    description:
      'Dial the engine from beginner-friendly to full-strength grandmaster, so every game matches your level.'
  },
  {
    icon: 'fa-solid fa-book-open',
    title: 'Opening Explorer',
    description:
      'Study openings move by move and understand the ideas behind them before you play them yourself.'
  },
  {
    icon: 'fa-solid fa-magnifying-glass-chart',
    title: 'Game Analysis',
    description:
      "Review any game move-by-move, spot blunders and missed tactics, and see the engine's best line instead."
  },
  {
    icon: 'fa-solid fa-lock',
    title: '100% Offline & Private',
    description:
      'Every engine call and analysis run happens locally on your machine. No accounts, no data ever leaves your computer.'
  },
  {
    icon: 'fa-solid fa-display',
    title: 'Cross-Platform',
    description:
      'Built with Electron to run natively on Windows, macOS, and Linux from a single lightweight install.'
  },
  {
    icon: 'fa-solid fa-bolt',
    title: 'Lightweight & Fast',
    description:
      'No bloat, no background services. It is just a fast, focused chess app that opens instantly.'
  }
]

const FeatureCard = ({ icon, title, description }: Feature) => {
  return (
    <div className="flex flex-col items-center text-center gap-2 rounded-lg border-1 border-neutral-700 bg-neutral-800 p-6 hover:border-amber-400/50 transition-colors">
      <i className={`${icon} text-amber-400 text-3xl mb-1`} />
      <h3 className="text-amber-100 font-bold text-lg">{title}</h3>
      <p className="text-amber-100/70 text-sm">{description}</p>
    </div>
  )
}

type Step = {
  number: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Choose Your Setup',
    description: 'Pick your side, an engine difficulty, or load a game to analyze.'
  },
  {
    number: '02',
    title: 'Play or Review',
    description: 'Face Stockfish across a range of strengths, or step through an existing game.'
  },
  {
    number: '03',
    title: 'Get Instant Feedback',
    description:
      'See engine evaluations, best lines, and mistakes as they happen. This is all computed locally.'
  }
]

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center w-[85vw] gap-16 pb-16">
      <section className="flex flex-col items-center w-full gap-8">
        <div className="flex flex-col items-center text-center gap-2">
          <h2 className="text-amber-100 font-bold text-3xl mt-4">Everything You Need, All Local</h2>
          <p className="text-amber-100/70 text-base max-w-2xl">
            No sign-ups, no cloud dependency.
          </p>
          <p className="text-amber-100/70 text-base max-w-2xl">
            ChessTactix bundles a full training and analysis toolkit that runs entirely on your machine.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center w-full gap-8">
        <h2 className="text-amber-100 font-bold text-3xl text-center">How It Works</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center gap-2 p-6">
              <span className="text-amber-400/60 font-bold text-4xl">{step.number}</span>
              <h3 className="text-amber-100 font-bold text-lg">{step.title}</h3>
              <p className="text-amber-100/70 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-3 w-full rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-400/10 to-transparent px-8 py-12 text-center">
        <i className="fa-solid fa-chess-knight text-amber-400 text-3xl" />
        <h2 className="text-amber-100 font-bold text-3xl">Try ChessTactix In a Game Against Stockfish</h2>
        <p className="text-amber-100/70 text-base max-w-xl">
          Jump straight into a game pick your side and difficulty, no setup required.
        </p>
        <p className="text-amber-100/70 text-base max-w-xl">
          Pick your side and difficulty, no setup required.
        </p>
        <button className="cursor-pointer active:bg-amber-700 hover:bg-amber-500 text-amber-900 bg-amber-400 px-8 py-3 mt-3 rounded-lg border border-amber-200 text-lg font-bold">
          Play Now
        </button>
      </section>

      <footer className="flex flex-col items-center gap-2 border-t-1 border-neutral-700 w-full pt-8 text-amber-100/50 text-sm">
        <p>ChessTactix</p>
        <a
          href="https://github.com/klaywork2005/chesstactix"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-300 transition-colors"
        >
          View the source on GitHub
        </a>
      </footer>
    </div>
  )
}

export default LandingPage
