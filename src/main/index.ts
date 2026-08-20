import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getBestMove, analyzePosition } from './stockfish'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // sized for the three-column board layout: a large centered board with a
    // move list and an engine/info rail either side of it. The board tracks
    // whatever space is left over, so the minimums only have to be the point
    // below which the rails stop having usable room beside it.
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Packaged builds pick up build/icon.icns automatically, but the dev-mode
  // dock icon doesn't -- set it explicitly so the app icon is uniform in dev too.
  if (process.platform === 'darwin') {
    app.dock?.setIcon(icon)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Runs the Stockfish engine (Node-only, hence main process) and hands the
  // resulting move back to the renderer's ChessGame component.
  ipcMain.handle('chess:getBestMove', (_event, fen: string, level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) =>
    getBestMove(fen, level)
  )

  // Runs a MultiPV search for the Analysis page -- returns several ranked
  // candidate lines instead of just one move.
  ipcMain.handle('chess:analyzePosition', (_event, fen: string, multiPv: number, depth: number) =>
    analyzePosition(fen, multiPv, depth)
  )

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
