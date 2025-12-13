/**
 * Electron main process
 * Handles window management, IPC, native features, and system tray
 */

const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Determine if running in development mode
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let tray = null;
let isQuitting = false;

/**
 * Create a simple tray icon programmatically
 * Uses a 16x16 PNG with a simple "T" design for Tissaia
 */
function createTrayIcon() {
  // Create a 16x16 icon using nativeImage
  // This is a simple blue square with transparency
  const size = 16;
  const icon = nativeImage.createEmpty();

  // Try to load icon from file, fallback to empty image
  const iconPath = path.join(__dirname, 'tray-icon.png');
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  // Return a simple colored icon as fallback
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA' +
    'jElEQVQ4T2NkoBAwUqifgdoGMDIyMjAxMDAw/P//n+HHjx8M////Z2BkZGT4////f4b///' +
    '8zMDIyMjAyMjIwMjIyMDAyMjL8Z2RkZPj//z/D////GRgZGRn+MzAw/GdgYGD4z8DA8J+B' +
    'gYHhPwMDw38GBoYGRkZGBgYGBoYGBgYGhv8MDAwMDAwMDMOzDQAhYSoRCr1a7AAAAABJ' +
    'RU5ErkJggg=='
  );
}

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

  // Handle minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Minimize to tray when minimized
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * Create system tray with context menu
 */
function createTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Tissaia AI',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Hide to Tray',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Restart',
      click: () => {
        app.relaunch();
        isQuitting = true;
        app.quit();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Tissaia AI',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Tissaia AI - Photo Restoration');
  tray.setContextMenu(contextMenu);

  // Toggle window on tray icon click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Double-click shows window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * App ready event
 */
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

/**
 * Handle before-quit to set quitting flag
 */
app.on('before-quit', () => {
  isQuitting = true;
});

/**
 * Quit when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit - stay in tray
    // app.quit();
  }
});

/**
 * IPC Handlers
 */

// Window control handlers
ipcMain.on('window:minimize', () => {
  if (mainWindow) {
    mainWindow.hide(); // Minimize to tray
  }
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) {
    mainWindow.hide(); // Hide to tray instead of closing
  }
});

ipcMain.on('window:quit', () => {
  isQuitting = true;
  app.quit();
});

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
