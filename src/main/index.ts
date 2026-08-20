/**
 * Electron main process entry point.
 *
 * Owns the application window and lifecycle, and registers the IPC handlers
 * that expose the chess engine to the renderer. The engine itself lives in
 * `./stockfish` -- it is a Node module and so can only run here, which is the
 * constraint the whole process split is built around.
 *
 * @packageDocumentation
 */

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getBestMove, analyzePosition } from './stockfish'

/**
 * Creates the application window and loads the renderer into it.
 *
 * Called once at startup, and again on macOS when the dock icon is clicked
 * with no windows open.
 */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    // sized for the three-column board layout: a large centered board with a
    // move list and an engine/info rail either side of it. The board tracks
    // whatever space is left over, so the minimums only have to be the point
    // below which the rails stop having usable room beside it.
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 900,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // The preload script imports @electron-toolkit/preload, which a fully
      // sandboxed preload cannot require. Context isolation is still on and
      // nodeIntegration is still off, so the renderer itself remains an
      // ordinary web page with no Node access.
      sandbox: false
    }
  })

  // `show: false` above plus this handler avoids the white flash of an empty
  // window
  // nothing is shown until the renderer has painted its first frame.
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Anything that asks to open a new window -- the header's GitHub link, the
  // mailto: contact link -- is handed to the OS instead. Denying the in-app
  // navigation is what stops an external page from ever loading inside the
  // app's own privileged window.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // In development the renderer is served by electron-vite's dev server, which
  // is what provides hot module replacement; a packaged build loads the bundle
  // that electron-vite wrote to out/renderer instead.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Most Electron APIs are unavailable until the app is ready, so all startup
// work -- IPC registration included -- hangs off this promise.
app.whenReady().then(() => {
  // Groups the app's windows under one taskbar entry and attributes its
  // notifications on Windows.
  //
  // NOTE: this is still electron-vite's scaffold default and does not match
  // the `appId` in electron-builder.yml (com.klaygarcia.chesstactix). Changing
  // it would be correct, but it is a behavioural change rather than a cosmetic
  // one -- Windows keys taskbar pinning and notification history off this
  // string, so existing installs would lose both.
  electronApp.setAppUserModelId('com.electron')

  // Packaged builds pick up build/icon.icns automatically, but the dev-mode
  // dock icon doesn't -- set it explicitly so the app icon is uniform in dev too.
  if (process.platform === 'darwin') {
    app.dock?.setIcon(icon)
  }

  // Binds F12 to DevTools in development, and swallows the reload shortcuts in
  // production -- a packaged desktop app should not reload like a web page.
  // See https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Scaffold leftover from electron-vite's template. Harmless, and useful for
  // confirming the IPC channel is alive at all when debugging the two real
  // handlers below.
  ipcMain.on('ping', () => console.log('pong'))

  // The two real IPC handlers. Both delegate straight to ./stockfish, which
  // serialises them behind a single shared engine instance -- see the module
  // for why concurrent searches cannot be allowed.
  //
  // Plays a move for the AI opponent, at the strength the game was set up with.
  // Consumed by the ChessGame component.
  ipcMain.handle('chess:getBestMove', (_event, fen: string, level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) =>
    getBestMove(fen, level)
  )

  // Runs a MultiPV search for the analysis board: several ranked candidate
  // lines rather than a single move, always at full engine strength.
  ipcMain.handle('chess:analyzePosition', (_event, fen: string, multiPv: number, depth: number) =>
    analyzePosition(fen, multiPv, depth)
  )

  createWindow()

  // macOS convention: clicking the dock icon with no windows open reopens one
  // rather than doing nothing, because the app is still running.
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// The mirror of the above: on macOS an app with no windows stays running until
// the user quits it explicitly with Cmd+Q, so only the other platforms treat
// the last window closing as a quit.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
