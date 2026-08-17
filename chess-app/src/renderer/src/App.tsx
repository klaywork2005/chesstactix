import './assets/main.css'
import { useState } from 'react'
import Background from './components/background'
import Header from './components/header'
import LandingPage from './components/landingpage'
import ChessGame from './components/chessgame'
import GameSetup from './components/gamesetup'
import Analysis from './components/analysis'
import type { AiOptions } from './types'

type View = 'landing' | 'setup' | 'ai' | 'analysis'

const App = () => {
  const [view, setView] = useState<View>('landing')
  const [aiOptions, setAiOptions] = useState<AiOptions>({
    difficulty: 'easy',
    playerColor: 'white'
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Background />

      <Header
        onHeaderLogoClick={() => setView('landing')}
        onPlayClick={() => setView('setup')}
        onAnalyzeClick={() => setView('analysis')}
        onContactClick={() => setView('landing')}
      />

      <main className="flex flex-1 items-center justify-center">
        {view === 'landing' && (
          <LandingPage onLandingPagePlayButtonClick={() => setView('setup')} />
        )}
        {view === 'setup' && (
          <GameSetup aiOptions={aiOptions} onChange={setAiOptions} onStart={() => setView('ai')} />
        )}
        {view === 'ai' && <ChessGame aiOptions={aiOptions} onNewGame={() => setView('setup')} />}
        {view === 'analysis' && <Analysis onBack={() => setView('landing')} />}
      </main>
    </div>
  )
}

export default App
