import './assets/main.css'
import { useState } from 'react'
import Background from './components/background'
import Header from './components/header'
import LandingPage from './components/landingpage'
import ChessGame from './components/chessgame'
import GameSetup from './components/gamesetup'
import type { AiOptions } from './types'

type GameMode = 'setup' | 'ai'

const App = () => {
  const [mode, setMode] = useState<GameMode>('setup')
  const [aiOptions, setAiOptions] = useState<AiOptions>({
    difficulty: 'easy',
    playerColor: 'white'
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Background />

      <Header onPlayClick={() => setMode('setup')} />

      <main className="flex flex-1 items-center justify-center">
        <LandingPage />
      </main>
{/*
      <main className="flex flex-1 items-center justify-center">
        {mode === 'setup' ? (
          <GameSetup aiOptions={aiOptions} onChange={setAiOptions} onStart={() => setMode('ai')} />
        ) : (
          <ChessGame aiOptions={aiOptions} onNewGame={() => setMode('setup')} />
        )}
      </main> */}
      
    </div>
  )
}

export default App
