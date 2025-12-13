# Tissaia AI - Launcher Guide

## 🚀 Quick Start

### Windows
```bash
# Double-click or run:
launch.bat
```

### Linux / Mac
```bash
# Make executable (first time only):
chmod +x launch.sh

# Run:
./launch.sh
```

## ✨ Features

The new all-in-one launcher (`launch_tissaia.py`) provides:

### 1. **Automated Requirements Checking**
   - Verifies Node.js installation
   - Verifies npm installation
   - Checks for Chrome/Chromium (optional)

### 2. **Dependency Management**
   - Automatically detects if `node_modules` is missing
   - Installs dependencies with progress indicator
   - Handles npm errors gracefully

### 3. **Configuration Setup**
   - Checks for `.env` file
   - Prompts for Google Gemini API key if missing
   - Supports demo mode (no API key required)

### 4. **Development Server**
   - Starts Vite dev server automatically
   - Waits for server to be ready before launching browser
   - Monitors server health

### 5. **Chrome App Mode**
   - Launches Chrome in standalone app mode (no browser UI)
   - Falls back to default browser if Chrome not found
   - Optimized window size (1280x800)

### 6. **Comprehensive Logging**
   - **Startup Log**: `logs/startup_YYYYMMDD_HHMMSS.log`
   - **Debug Log**: `logs/debug.log` (all debug operations)
   - **Chat Log**: `logs/chat.log` (AI interactions)
   - **Server Log**: `logs/server.log` (Vite output)
   - **NPM Install Log**: `logs/npm_install.log`

### 7. **System Tray Integration** (Optional)
   - Minimizes to system tray
   - Right-click menu for quick access
   - Clean shutdown handling

## 📋 Requirements

### Required
- **Python 3.7+** - For running the launcher
- **Node.js 16+** - For the application
- **npm** - For dependency management

### Optional
- **pystray** - For system tray support
- **Pillow** - For tray icon generation
- **Chrome/Chromium** - For app mode (falls back to default browser)

Install optional Python dependencies:
```bash
pip install -r requirements.txt
# or
pip install pystray pillow
```

## 🔍 Logging System

### Log Locations
All logs are stored in the `logs/` directory:

```
logs/
├── startup_20231213_104530.log  # Timestamped startup logs
├── debug.log                     # Debug operations
├── chat.log                      # AI chat interactions
├── server.log                    # Vite dev server output
└── npm_install.log              # Dependency installation
```

### Log Types

#### 1. System Logs (In-App)
- Visible in the "LOGS" view in the application
- Persisted to browser localStorage
- Auto-saved across sessions

#### 2. Chat Logs
- Records all AI interactions
- Format: `[TIMESTAMP] [USER/AI] message | metadata`
- Includes file analysis requests and AI responses

#### 3. Debug Logs
- Detailed operation logs for troubleshooting
- Includes AI request/response details
- JSON-formatted metadata

### Exporting Logs

From the application's **LOGS** view:

1. **Export All Logs** - Downloads combined system + chat + debug logs
2. **Export Chat** - Downloads only AI interaction logs
3. **Export Debug** - Downloads only debug logs

Downloaded files are named: `tissaia_[type]_[timestamp].log`

## 🛠️ Troubleshooting

### Launcher won't start
```bash
# Check Python installation
python3 --version

# Check if script is executable (Linux/Mac)
chmod +x launch.sh
chmod +x launch_tissaia.py
```

### System tray not working
```bash
# Install optional dependencies
pip install pystray pillow

# The launcher will still work without system tray
```

### Server fails to start
- Check `logs/server.log` for Vite errors
- Verify port 5173 is not in use
- Check `logs/npm_install.log` for dependency issues

### Chrome doesn't launch in app mode
- The launcher will automatically fall back to your default browser
- Chrome app mode is optional

## 📝 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
API_KEY=your_google_gemini_api_key_here
```

**Get your API key**: https://makersuite.google.com/app/apikey

### Demo Mode

To run without an API key (uses mock data):
1. Leave `.env` empty or don't create it
2. Press Enter when prompted for API key
3. Application will use simulated AI responses

## 🎯 Advanced Usage

### Direct Python Launch

```bash
python3 launch_tissaia.py
```

### Custom Port (Manual)

Edit `vite.config.ts` to change the default port:

```typescript
export default defineConfig({
  server: {
    port: 3000  // Change from 5173
  }
})
```

Then update `launch_tissaia.py`:

```python
self.dev_server_url = "http://localhost:3000"
self.dev_server_port = 3000
```

## 🔄 Migration from Old Scripts

### Old Scripts (Legacy)
- `start.sh` - Basic Linux/Mac launcher
- `LAUNCH_TISSAIA.bat` - Basic Windows launcher

### New Launcher (Recommended)
- `launch.sh` - Wrapper for Python launcher (Linux/Mac)
- `launch.bat` - Wrapper for Python launcher (Windows)
- `launch_tissaia.py` - Main launcher with all features

**Migration is seamless** - old scripts still work, but the new launcher provides enhanced features.

## 🐛 Debug Mode

To see detailed debug output, check:
- `logs/debug.log` - All debug operations
- Browser Console (F12) - Client-side debugging
- `logs/server.log` - Vite server output

## 🆘 Getting Help

1. Check the logs in `logs/` directory
2. Review `logs/startup_[timestamp].log` for initialization issues
3. Check browser console (F12) for client-side errors
4. Review the main [README.md](README.md) for architecture details

## 📄 License

This launcher is part of the Tissaia AI project.
