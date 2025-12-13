# Building Tissaia AI as Desktop Application

This guide explains how to build and distribute Tissaia AI as an Electron desktop application.

## Prerequisites

- Node.js 18+ and npm
- Git
- (macOS only) Xcode Command Line Tools
- (Windows only) Windows SDK

## Installation

```bash
# Install dependencies
npm install

# Install Electron dependencies
cd electron
npm install
cd ..
```

## Development

### Running in Development Mode

```bash
# Start the development server
npm run dev

# In another terminal, start Electron
npm run electron:dev
```

This will:
1. Start the Vite dev server on port 5173
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

## Building for Production

### Build Web Assets

```bash
# Build frontend
npm run build
```

This creates an optimized production build in the `dist` directory.

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

Built applications are created in the `release` directory:

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
    └── tissaia-ai.deb
```

## Platform-Specific Builds

### macOS

```bash
npm run electron:build:mac
```

Outputs:
- **DMG installer**: Drag-and-drop disk image
- **ZIP archive**: Portable application bundle

**Code Signing (optional):**
```bash
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"

npm run electron:build:mac
```

### Windows

```bash
npm run electron:build:win
```

Outputs:
- **NSIS installer**: Full installer with desktop shortcuts
- **Portable executable**: Standalone .exe (no installation)

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

Outputs:
- **AppImage**: Universal Linux application
- **DEB package**: For Debian/Ubuntu systems

## Features

### Native Features

- **File dialogs**: Native open/save dialogs
- **Drag and drop**: System file drag-and-drop
- **Menu bar**: Native application menus
- **Notifications**: System notifications
- **Auto-updates**: Automatic update checking (optional)
- **Window management**: Minimize, maximize, close
- **Deep linking**: Custom URL scheme support

### Cross-Platform APIs

The app provides unified APIs that work in both Electron and web:

```typescript
import { openFilePicker, saveFile } from './utils/electron/electronAPI';

// Works in Electron and browser
const files = await openFilePicker('image/*', true);

// Save with native dialog in Electron, download in browser
await saveFile(blob, 'image.jpg');
```

## Configuration

### electron-builder.json

Configure build settings in `electron-builder.json`:

```json
{
  "appId": "com.tissaia.ai",
  "productName": "Tissaia AI",
  "directories": {
    "output": "release"
  },
  "mac": {
    "category": "public.app-category.productivity",
    "icon": "build/icon.icns"
  },
  "win": {
    "icon": "build/icon.ico"
  },
  "linux": {
    "icon": "build/icon.png",
    "category": "Graphics"
  }
}
```

### Icons

Place platform-specific icons in the `build` directory:

- **macOS**: `build/icon.icns` (512x512)
- **Windows**: `build/icon.ico` (256x256)
- **Linux**: `build/icon.png` (512x512)

## Auto-Updates

### GitHub Releases

1. Configure publish settings in `electron-builder.json`:

```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "Tissaia-AI"
  }
}
```

2. Generate GitHub token with `repo` scope

3. Set environment variable:

```bash
export GH_TOKEN="your-github-token"
```

4. Build and publish:

```bash
npm run electron:build -- --publish always
```

### Custom Update Server

See [electron-updater documentation](https://www.electron.build/auto-update) for custom servers.

## Troubleshooting

### Build Fails on macOS

**Error**: "Developer ID certificate not found"

**Solution**: Either:
- Skip code signing: `export CSC_IDENTITY_AUTO_DISCOVERY=false`
- Or provide valid certificate (see Code Signing above)

### Windows Build Issues

**Error**: "ENOENT: no such file or directory, open 'build/icon.ico'"

**Solution**: Create icon file:
```bash
mkdir -p build
# Add icon.ico to build directory
```

### Linux Dependencies Missing

**Error**: "Missing required dependencies"

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install libnss3 libatk1.0-0 libatk-bridge2.0-0

# Fedora
sudo dnf install nss atk at-spi2-atk
```

### Large Bundle Size

**Issue**: Application is too large

**Solutions**:
- Enable compression in electron-builder
- Remove unused dependencies
- Exclude development files
- Use `asar` archiving (enabled by default)

## Distribution

### macOS

**App Store:**
1. Build with Mac App Store configuration
2. Submit via Xcode or Transporter

**Direct Distribution:**
1. Notarize the app with Apple
2. Distribute DMG file

### Windows

**Microsoft Store:**
1. Build with appx target
2. Submit via Partner Center

**Direct Distribution:**
1. Optionally sign with EV certificate
2. Distribute installer or portable exe

### Linux

**Snap Store:**
```bash
npm install --save-dev electron-builder-snapcraft
# Add snap target to electron-builder.json
```

**Direct Distribution:**
1. Host AppImage or DEB package
2. Provide installation instructions

## Performance Optimization

### Reduce Bundle Size

```javascript
// In electron-builder.json
{
  "asar": true,
  "compression": "maximum",
  "files": [
    "dist/**/*",
    "electron/**/*",
    "!**/*.map"
  ]
}
```

### Lazy Loading

Load heavy modules only when needed:

```javascript
// Don't import at top level
// import heavyModule from 'heavy-module';

// Import when needed
async function processImage() {
  const { processImage } = await import('heavy-module');
  // Use module
}
```

## Security

### Best Practices

1. **Disable Node Integration**:
```javascript
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true
}
```

2. **Use Preload Scripts**:
```javascript
// Expose only necessary APIs
contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('open-file')
});
```

3. **Validate User Input**:
```javascript
// Sanitize all user input before processing
const sanitized = sanitize(userInput);
```

4. **Content Security Policy**:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'">
```

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [electron-updater](https://www.electron.build/auto-update)
- [Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-repo/Tissaia-AI/issues
- Discord: https://discord.gg/tissaia-ai
- Email: support@tissaia-ai.com
