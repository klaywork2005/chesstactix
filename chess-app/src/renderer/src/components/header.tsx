import chessLogo from '../assets/chesstactix-logo.svg'

type HeaderProps = { onPlayClick: () => void }

const Header = ({ onPlayClick }: HeaderProps) => {
  return (
    <header className="sticky h-24 top-0 z-50 bg-[rgb(15,15,15)] border-b-1 border-neutral-700 text-amber-200">
      <div className="mx-auto flex items-center justify-between">
        <div className="flex justify-between items-center">
          <div
            className="h-24 w-24 bg-amber-200 hover:bg-red-100 cursor-pointer transition-colors"
            style={{
              maskImage: `url(${chessLogo})`,
              maskRepeat: 'no-repeat',
              maskSize: 'contain',
              maskPosition: 'center',
              WebkitMaskImage: `url(${chessLogo})`,
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskSize: 'contain',
              WebkitMaskPosition: 'center'
            }}
            aria-label="ChessTactix Logo"
          />
          <h1 className="-translate-x-2 select-none text-5xl font-bold">ChessTactix</h1>
          <h1 className="select-none text-m px-2 translate-y-3 text-amber-100">by Klay Garcia</h1>
        </div>

        <nav className="flex gap-6 px-8">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onPlayClick()
            }}
            className="select-none hover:text-mauve-300 text-xl"
          >
            Play
          </a>
          
          <a href="#" className="select-none hover:text-mauve-300 text-xl">
            Analyze
          </a>
          
          <a href="#" className="select-none hover:text-mauve-300 text-xl">
            Contact
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Header
