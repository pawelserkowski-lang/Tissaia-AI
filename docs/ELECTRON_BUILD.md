# Electron Build Guide

<div align="center">

![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?style=for-the-badge&logo=electron)
![Platforms](https://img.shields.io/badge/Platforms-Win%20%7C%20Mac%20%7C%20Linux-00ffa3?style=for-the-badge)
![Builder](https://img.shields.io/badge/Builder-electron--builder-blue?style=for-the-badge)

**Complete guide for building Tissaia AI as a desktop application.**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Development](#development)
- [Building](#building)
- [Platform-Specific Notes](#platform-specific-notes)
- [Distribution](#distribution)
- [Auto-Updates](#auto-updates)
- [Troubleshooting](#troubleshooting)

---

## Overview

Tissaia AI can be packaged as a native desktop application using Electron. This provides:

| Benefit | Description |
|---------|-------------|
| **Native Experience** | Full desktop integration |
| **Offline Support** | Work without internet |
| **File System Access** | Direct folder access |
| **Native Menus** | Application menu bar |
| **System Tray** | Background operation |
| **Auto-Updates** | Seamless updates |

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| Git | 2.x | Version control |

### Platform-Specific Requirements

**macOS:**
- macOS 10.15+ (Catalina)
- Xcode Command Line Tools
- Apple Developer ID (for signing)

**Windows:**
- Windows 10 or later
- Windows SDK (optional, for native modules)

**Linux:**
- Ubuntu 18.04+ or equivalent
- `rpm` and `dpkg` for building packages

---

## Project Setup

### Directory Structure

```
Tissaia-AI/
├── electron/
│   ├── main.js              # Main process
│   └── preload.js           # Preload script
├── dist/                    # Vite build output
├── release/                 # Electron build output
└── package.json             # Scripts and dependencies
```

### Installation

```bash
# Install dependencies
npm install

# Install Electron dependencies
cd electron
npm install
cd ..
```

---

## Development

### Running in Development Mode

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

This will:
1. Start the Vite dev server on port 5174
2. Launch Electron pointing to the dev server
3. Enable hot reload for both frontend and Electron

### Development with Backend

```bash
# Start all services
npm run dev:all:electron
```

This runs:
- Frontend dev server (Vite)
- Backend API server (Express)
- Electron app

---

## Building

### Build Web Assets First

```bash
# Build frontend
npm run build
```

Creates an optimized production build in `dist/`.

### Build Electron App

```bash
# Build for current platform
npm run electron:build

# Build for specific platform
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

### Build Output

```
release/
├── mac/
│   ├── Tissaia AI.app
│   └── Tissaia AI.dmg
├── win/
│   ├── Tissaia AI Setup.exe
│   └── Tissaia AI Portable.exe
└── linux/
    ├── tissaia-ai.AppImage
    ├── tissaia-ai.deb
    └── tissaia-ai.rpm
```

---

## Platform-Specific Notes

### macOS

```bash
npm run electron:build:mac
```

**Outputs:**
- **DMG installer** - Drag-and-drop disk image
- **ZIP archive** - Portable application bundle

**Code Signing (optional but recommended):**
```bash
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"

npm run electron:build:mac
```

**Notarization (required for macOS 10.15+):**
- Ensures app runs without security warnings
- Requires Apple Developer account

### Windows

```bash
npm run electron:build:win
```

**Outputs:**
- **NSIS installer** - Full installer with desktop shortcuts
- **Portable executable** - Standalone .exe (no installation)

**Code Signing (optional):**
```bash
export CSC_LINK="/path/to/certificate.pfx"
export CSC_KEY_PASSWORD="certificate-password"

npm run electron:build:win
```

### Linux

```bash
npm run electron:build:linux
```

**Outputs:**
- **AppImage** - Universal Linux application
- **DEB package** - For Debian/Ubuntu systems
- **RPM package** - For Fedora/RHEL systems

**Running AppImage:**
```bash
chmod +x tissaia-ai.AppImage
./tissaia-ai.AppImage
```

---

## Configuration

### electron-builder Configuration

Create or edit `electron-builder.json`:

```json
{
  "appId": "com.tissaia.ai",
  "productName": "Tissaia AI",
  "copyright": "Copyright © 2024 EPS AI Solutions",

  "directories": {
    "output": "release",
    "buildResources": "build"
  },

  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],

  "mac": {
    "category": "public.app-category.photography",
    "icon": "build/icon.icns",
    "target": ["dmg", "zip"]
  },

  "win": {
    "icon": "build/icon.ico",
    "target": ["nsis", "portable"]
  },

  "linux": {
    "icon": "build/icons",
    "category": "Graphics",
    "target": ["AppImage", "deb", "rpm"]
  },

  "nsis": {
    "oneClick": false,
    "perMachine": true,
    "allowToChangeInstallationDirectory": true
  }
}
```

### Application Icons

Place icons in the `build/` directory:

| Platform | File | Size |
|----------|------|------|
| macOS | `icon.icns` | 512x512 |
| Windows | `icon.ico` | 256x256 |
| Linux | `icons/` folder | Multiple sizes |

---

## Native Features

### Provided APIs

The app provides unified APIs that work in both Electron and browser:

```typescript
import { openFilePicker, saveFile, isElectron } from './utils/electron/electronAPI';

// Check if running in Electron
if (isElectron()) {
  // Electron-specific code
}

// File picker (native in Electron, browser fallback)
const files = await openFilePicker('image/*', true);

// Save file (native dialog in Electron, download in browser)
await saveFile(blob, 'image.jpg');
```

### Native Features List

| Feature | Electron | Web |
|---------|----------|-----|
| File dialogs | Native OS dialogs | Browser file input |
| Drag and drop | System file D&D | Browser D&D |
| Menu bar | Native application menu | N/A |
| Notifications | System notifications | Browser notifications |
| Auto-updates | electron-updater | N/A |
| System tray | Yes | N/A |
| Deep linking | Custom URL scheme | N/A |

---

## Auto-Updates

### Setup with GitHub Releases

1. **Configure publish settings:**

```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "Tissaia-AI"
  }
}
```

2. **Generate GitHub token** with `repo` scope

3. **Set environment variable:**
```bash
export GH_TOKEN="your-github-token"
```

4. **Build and publish:**
```bash
npm run electron:build -- --publish always
```

### Update Check Code

```javascript
// In main.js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', (info) => {
  // Notify user
});

autoUpdater.on('update-downloaded', (info) => {
  // Prompt to restart
});
```

---

## Distribution

### macOS Distribution

**App Store:**
1. Build with Mac App Store configuration
2. Submit via Xcode or Transporter

**Direct Distribution:**
1. Notarize the app with Apple
2. Distribute DMG file

### Windows Distribution

**Microsoft Store:**
1. Build with APPX target
2. Submit via Partner Center

**Direct Distribution:**
1. Optionally sign with EV certificate
2. Distribute installer or portable exe

### Linux Distribution

**Snap Store:**
```bash
npm install --save-dev electron-builder-snapcraft
# Add snap target to config
```

**Direct Distribution:**
1. Host AppImage or DEB/RPM packages
2. Provide installation instructions

---

## Performance Optimization

### Reduce Bundle Size

```json
{
  "asar": true,
  "compression": "maximum",
  "files": [
    "dist/**/*",
    "electron/**/*",
    "!**/*.map",
    "!**/node_modules/**/*.md"
  ]
}
```

### Lazy Loading

```javascript
// Don't import at top level
// import heavyModule from 'heavy-module';

// Import when needed
async function processImage() {
  const { processImage } = await import('heavy-module');
  // Use module
}
```

---

## Security

### Best Practices

1. **Disable Node Integration:**
```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  preload: path.join(__dirname, 'preload.js')
}
```

2. **Use Preload Scripts:**
```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data)
});
```

3. **Content Security Policy:**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'">
```

4. **Validate All IPC:**
```javascript
ipcMain.handle('save-file', async (event, data) => {
  // Validate data before processing
  if (!isValidData(data)) {
    throw new Error('Invalid data');
  }
  // Process...
});
```

---

## Troubleshooting

### Build Fails on macOS

**Error:** "Developer ID certificate not found"

**Solution:**
```bash
# Skip code signing
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run electron:build:mac
```

### Windows Build Issues

**Error:** "ENOENT: no such file or directory, open 'build/icon.ico'"

**Solution:**
```bash
mkdir -p build
# Add icon.ico to build directory
```

### Linux Dependencies

**Error:** "Missing required dependencies"

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install libnss3 libatk1.0-0 libatk-bridge2.0-0

# Fedora
sudo dnf install nss atk at-spi2-atk
```

### Large Bundle Size

**Issue:** Application is too large

**Solutions:**
- Enable ASAR compression (default)
- Remove unused dependencies
- Exclude development files and source maps
- Use `files` array to specify only needed files

---

## Resources

| Resource | Link |
|----------|------|
| Electron Documentation | https://www.electronjs.org/docs |
| electron-builder | https://www.electron.build/ |
| electron-updater | https://www.electron.build/auto-update |
| Security Best Practices | https://www.electronjs.org/docs/latest/tutorial/security |

---

## Support

| Channel | Link |
|---------|------|
| GitHub Issues | [Open an issue](https://github.com/your-repo/Tissaia-AI/issues) |
| Documentation | See `docs/` directory |
| Email | support@tissaia-ai.com |

---

<div align="center">

**[Back to README](../README.md)** | **[Chrome Extension](CHROME_EXTENSION.md)** | **[Contributing](CONTRIBUTING.md)**

</div>
