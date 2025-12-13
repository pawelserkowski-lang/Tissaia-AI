/**
 * Electron main process
 * Handles window management, IPC, and native features
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Determine if running in development mode
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

/**
 * Create main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    backgroundColor: '#0f172a',
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window events
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * App ready event
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit when all windows are closed
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * IPC Handlers
 */

// File selection dialog
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });

  if (result.canceled) {
    return { canceled: true };
  }

  // Read file contents
  const files = result.filePaths.map((filePath) => {
    const buffer = fs.readFileSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      data: buffer.toString('base64'),
      size: buffer.length,
      type: getFileType(filePath),
    };
  });

  return { canceled: false, files };
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options.defaultPath || 'untitled',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled) {
    return { canceled: true };
  }

  return { canceled: false, filePath: result.filePath };
});

// Write file
ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
  try {
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get app path
ipcMain.handle('app:getPath', async (event, name) => {
  return app.getPath(name);
});

// Get app version
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

// Show item in folder
ipcMain.handle('shell:showItemInFolder', (event, fullPath) => {
  shell.showItemInFolder(fullPath);
});

// Open external URL
ipcMain.handle('shell:openExternal', (event, url) => {
  shell.openExternal(url);
});

/**
 * Utility functions
 */

function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Auto-updater (optional)
 * Uncomment to enable auto-updates
 */
// const { autoUpdater } = require('electron-updater');
//
// autoUpdater.on('update-available', () => {
//   mainWindow.webContents.send('update-available');
// });
//
// autoUpdater.on('update-downloaded', () => {
//   mainWindow.webContents.send('update-downloaded');
// });
//
// app.on('ready', () => {
//   autoUpdater.checkForUpdatesAndNotify();
// });
