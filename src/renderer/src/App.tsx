import './assets/main.css'
import { useState } from 'react'
import Background from './components/background'
import Header from './components/header'
import LandingPage from './components/landingpage'
import ChessGame from './components/chessgame'
import GameSetup from './components/gamesetup'
import Analysis from './components/analysis'
import type { AiOptions } from './types'

/** The four screens the app can show. There is no router; this union is it. */
type View = 'landing' | 'setup' | 'ai' | 'analysis'

/**
 * Root component: the header, the background, and whichever screen is active.
 *
 * Holds the only genuinely cross-screen state -- the {@link AiOptions} chosen
 * during setup, which the game screen then plays under. Everything else lives
 * in the screen that owns it, or in `useChessHistory` / `useBoardScale`.
 */
const App = (): React.JSX.Element => {
  const [view, setView] = useState<View>('landing')
  // Kept here rather than in GameSetup so the choices survive leaving the setup
  // screen: starting a game unmounts it, and "New Game" returns to it with the
  // previous level and colour still selected.
  const [aiOptions, setAiOptions] = useState<AiOptions>({
    level: 3,
    playerColor: 'white'
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Background />

      <Header
        onHeaderLogoClick={() => setView('landing')}
        onPlayClick={() => setView('setup')}
        onAnalyzeClick={() => setView('analysis')}
      />

      {/* The landing page scrolls from the top; every other view is a single
          screen that centers itself in whatever height is left below the header.

          The board views additionally get `min-h-0`, which drops the automatic
          minimum height a flex item takes from its own content. Without it the
          main element could never be shorter than the board it contains, so a
          board sized from the measured height would hold its own space open and
          never shrink when the window got shorter. The scrolling views keep the
          automatic minimum, since there they are what makes the page scroll. */}
      <main
        className={`flex flex-1 justify-center ${view === 'landing' ? 'items-start' : 'items-center'} ${
          view === 'ai' || view === 'analysis' ? 'min-h-0' : ''
        }`}
      >
        {view === 'landing' && (
          <LandingPage onLandingPagePlayButtonClick={() => setView('setup')} />
        )}
        {view === 'setup' && (
          <GameSetup aiOptions={aiOptions} onChange={setAiOptions} onStart={() => setView('ai')} />
        )}
        {view === 'ai' && <ChessGame aiOptions={aiOptions} onNewGame={() => setView('setup')} />}
        {view === 'analysis' && <Analysis />}
      </main>
    </div>
  )
}

export default App
