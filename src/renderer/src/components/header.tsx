import chessLogo from '../assets/chesstactix-logo.svg'

type HeaderProps = {
  /** Returns to the landing page. */
  onHeaderLogoClick: () => void
  /** Opens the game setup screen. */
  onPlayClick: () => void
  /** Opens the analysis board. */
  onAnalyzeClick: () => void
}

// Opened in a new window so Electron's setWindowOpenHandler passes it to
// shell.openExternal, which hands the mailto off to the default mail client.
const CONTACT_MAILTO =
  'mailto:klayworkwork2005@gmail.com' +
  '?subject=' +
  encodeURIComponent('ChessTactix') +
  '&body=' +
  encodeURIComponent('Hi Klay,')

/**
 * The persistent top bar: brand, source link, and the three-way nav.
 *
 * The logo is drawn as a CSS mask over a background colour rather than as an
 * `<img>`, so a single monochrome SVG can be recoloured on hover without
 * shipping a second asset. External links open in a new window, which
 * `setWindowOpenHandler` in the main process turns into an OS-level open.
 */
const Header = ({
  onHeaderLogoClick,
  onPlayClick,
  onAnalyzeClick
}: HeaderProps): React.JSX.Element => {
  return (
    <header className="sticky h-24 top-0 z-50 bg-neutral-950 border-b-1 border-neutral-700 text-amber-200">
      <div className="mx-auto grid grid-cols-3 items-center">
        <div className="flex justify-start items-center">
          <button
            type="button"
            onClick={onHeaderLogoClick}
            className="h-24 w-24 border-0 p-0 bg-amber-200 hover:bg-red-100 cursor-pointer transition-colors"
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
          <h1 className="select-none text-sm px-2 -translate-x-2 translate-y-3 text-amber-100">
            by Klay Garcia
          </h1>
        </div>
        <div className="flex items-center justify-center">
          <i className="text-white fa-brands fa-github object-cover text-xl" />
          <a
            href="https://github.com/klaywork2005/chesstactix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-bold text-blue-300 underline underline-offset-6 px-1"
          >
            View Source
          </a>
        </div>

        <nav className="flex gap-6 px-8 justify-end">
          <button
            type="button"
            onClick={onPlayClick}
            className="select-none border-0 bg-transparent p-0 cursor-pointer hover:text-mauve-300 text-2xl"
          >
            Play
          </button>

          <button
            type="button"
            onClick={onAnalyzeClick}
            className="select-none border-0 bg-transparent p-0 cursor-pointer hover:text-mauve-300 text-2xl"
          >
            Analyze
          </button>

          <a
            href={CONTACT_MAILTO}
            target="_blank"
            rel="noopener noreferrer"
            className="select-none border-0 bg-transparent p-0 cursor-pointer hover:text-mauve-300 text-2xl text-amber-200 no-underline"
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Header
