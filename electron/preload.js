/**
 * Electron preload script
 * Exposes safe IPC methods to renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods to renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog APIs
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // File system APIs
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),

  // App APIs
  getAppPath: (name) => ipcRenderer.invoke('app:getPath', name),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Shell APIs
  showItemInFolder: (fullPath) => ipcRenderer.invoke('shell:showItemInFolder', fullPath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Platform info
  platform: process.platform,
  isElectron: true,

  // Update listeners
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
});

/**
 * Expose safe window management
 */
contextBridge.exposeInMainWorld('windowAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
