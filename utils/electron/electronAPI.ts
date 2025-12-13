/**
 * Electron API type definitions and helpers
 */

export interface ElectronAPI {
  // Dialog APIs
  openFileDialog: (options?: any) => Promise<{
    canceled: boolean;
    files?: Array<{
      path: string;
      name: string;
      data: string;
      size: number;
      type: string;
    }>;
  }>;
  saveFileDialog: (options?: any) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;

  // File system APIs
  writeFile: (filePath: string, data: string) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // App APIs
  getAppPath: (name: string) => Promise<string>;
  getAppVersion: () => Promise<string>;

  // Shell APIs
  showItemInFolder: (fullPath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;

  // Platform info
  platform: string;
  isElectron: boolean;

  // Update listeners
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
}

export interface WindowAPI {
  minimize: () => void;  // Minimizes to system tray
  maximize: () => void;
  close: () => void;     // Hides to system tray
  quit: () => void;      // Actually quits the application
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    windowAPI?: WindowAPI;
  }
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}

/**
 * Get Electron API (with fallback for web)
 */
export function getElectronAPI(): ElectronAPI | null {
  if (isElectron()) {
    return window.electronAPI!;
  }
  return null;
}

/**
 * Open file picker (Electron or web)
 */
export async function openFilePicker(
  accept: string = 'image/*',
  multiple: boolean = true
): Promise<File[]> {
  const electronAPI = getElectronAPI();

  if (electronAPI) {
    // Use Electron dialog
    const result = await electronAPI.openFileDialog();
    if (result.canceled || !result.files) {
      return [];
    }

    // Convert to File objects
    return result.files.map((file) => {
      const buffer = Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
      return new File([buffer], file.name, { type: file.type });
    });
  } else {
    // Use web file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;

      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(files);
      };

      input.click();
    });
  }
}

/**
 * Save file (Electron or web)
 */
export async function saveFile(
  blob: Blob,
  filename: string
): Promise<boolean> {
  const electronAPI = getElectronAPI();

  if (electronAPI) {
    // Use Electron save dialog
    const result = await electronAPI.saveFileDialog({ defaultPath: filename });
    if (result.canceled || !result.filePath) {
      return false;
    }

    // Convert blob to base64
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });

    // Write file
    const writeResult = await electronAPI.writeFile(result.filePath, base64);
    return writeResult.success;
  } else {
    // Use web download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }
}

/**
 * Get platform-specific paths
 */
export async function getAppDataPath(): Promise<string> {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    return await electronAPI.getAppPath('userData');
  }
  return '';
}

/**
 * Open external URL
 */
export async function openExternalURL(url: string): Promise<void> {
  const electronAPI = getElectronAPI();
  if (electronAPI) {
    await electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}
