import './assets/main.css'
import Background from './components/background'
import Header from './components/header'
import ChessGame from './components/chessgame'

const App = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Background />
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <ChessGame />
      </main>
    </div>
  )
}

export default App
