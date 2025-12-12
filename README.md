# Tissaia | Architect Engine

## Overview
Tissaia is a high-fidelity photo restoration and analysis dashboard designed with a futuristic, cyberpunk-inspired "Architect Engine" aesthetic. It simulates a professional forensic image processing environment powered by AI agents working in a coordinated pipeline to analyze, segment, and restore vintage photographs.

## Architecture Overview

### Multi-Agent Pipeline System
Tissaia implements a sophisticated 4-stage pipeline where specialized AI agents handle different aspects of photo restoration:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  STAGE 1    │───▶│   STAGE 2    │───▶│  STAGE 3    │───▶│   STAGE 4    │
│  Ingestion  │    │  Detection   │    │ Smart Crop  │    │   Alchemy    │
│  Heuristics │    │  (YOLO AI)   │    │  Protocol   │    │ (Restoration)│
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### Agent Roles

#### 1. **Ingestion Agent (Stage 1)**
- **Purpose**: Initial file analysis and preprocessing
- **Technology**: Edge Detection + Hough Transform (simulated OpenCV.js)
- **Responsibilities**:
  - Load and validate raw scan files
  - Generate thumbnail previews
  - Perform fast heuristic analysis to estimate photo count
  - Create initial bounding box proposals
- **Location**: `hooks/useFileScanner.ts:simulateFastScan()`

#### 2. **Detection Agent (Stage 2)**
- **Purpose**: Neural object detection for precise photo segmentation
- **Technology**: Google Gemini Vision AI (gemini-3-pro-preview)
- **Responsibilities**:
  - Analyze flatbed scanner images
  - Detect individual photographs with bounding boxes
  - Calculate confidence scores for each detection
  - Determine rotation angles (0°, 90°, 180°, 270°)
  - Implement adaptive retry strategies if count mismatches
- **Location**: `services/geminiService.ts:analyzeImage()`
- **Configuration**: `config/pipeline.config.ts:STAGE_2_DETECTION`

#### 3. **Smart Crop Agent (Stage 3)**
- **Purpose**: Intelligent cropping with hygiene cuts
- **Technology**: Client-side Canvas API
- **Responsibilities**:
  - Map normalized coordinates (0-1000) to pixel values
  - Apply 10% margin cuts to remove scanner artifacts
  - Handle rotation transformations
  - Export high-quality PNG crops
- **Location**: `utils/image/processing.ts:cropImage()`
- **Configuration**: `config/pipeline.config.ts:STAGE_3_SMART_CROP`

#### 4. **Alchemy Agent (Stage 4)**
- **Purpose**: Generative AI restoration
- **Technology**: Google Gemini Image Generation (gemini-3-pro-image-preview)
- **Responsibilities**:
  - Outpainting: Regenerate missing 10% borders
  - Hygiene: Remove scratches, dust, and artifacts
  - Detail Enhancement: Enhance facial features and sharpness
  - Color Grading: Apply vintage "Kodak Portra 400" profile
- **Location**: `services/geminiService.ts:restoreImage()`
- **Configuration**: `config/pipeline.config.ts:STAGE_4_ALCHEMY`

### Orchestration Layer

#### Context Providers
- **LogContext** (`context/LogContext.tsx`): Centralized logging system tracking all agent operations
- **Agent Coordinator**: `hooks/useFileScanner.ts` manages workflow and agent communication

#### State Management
- **Primary Controller**: `App.tsx` - Central state manager
- **File Repository**: Maintains `ScanFile[]` array with status tracking
- **Lifecycle States**:
  ```
  UPLOADING → PRE_ANALYZING → PENDING_VERIFICATION → DETECTING → CROPPED → RESTORING → RESTORED
  ```

### UI Components

#### Views
- **FileListView**: Data ingestion interface with drag-drop support
- **CropMapView**: Interactive segmentation visualization with detected bounding boxes
- **MagicSpellView**: Restoration results gallery (before/after comparison)
- **LogsView**: Real-time agent activity monitoring

#### Navigation
- **Sidebar**: Main navigation with agent status indicators
- **TopBar**: Context-aware header with session controls
- **Launcher**: BIOS-style boot sequence with biometric authentication simulation

## Tech Stack

### Core Technologies
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS (via CDN)
- **Build Tool**: Vite 5.x
- **AI Services**: Google Generative AI (@google/genai)
- **Icons**: FontAwesome 6

### Design System
- **Theme**: Dark cyberpunk (bg-gray-950: #050a0a)
- **Accent Color**: Tissaia Neon (#00ffa3)
- **Glass Morphism**: Backdrop blur effects with semi-transparent panels
- **Animations**: Custom CSS keyframes for scan effects and transitions

## Setup & Running

### Prerequisites
- Node.js 18+ installed
- Google Gemini API Key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Quick Start

#### Automated Launcher (Recommended)

**Windows:**
```cmd
LAUNCH_TISSAIA.bat
```
or
```cmd
START_TISSAIA.cmd
```

**Linux / macOS:**
```bash
chmod +x start.sh
./start.sh
```

The launcher will:
1. Check for Node.js installation
2. Run `npm install` if dependencies are missing
3. Prompt for your Gemini API Key and create `.env` file
4. Start the development server

#### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Tissaia-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file in the project root:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will open automatically at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```
   Output will be in the `dist/` directory.

### Running as a Chrome App (Local Mode with Hidden Terminals)

This setup allows you to run Tissaia as a standalone Chrome application without visible terminal windows.

#### Method 1: Using Chrome App Mode (Recommended)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Serve the built files**

   **Windows** - Create `serve-silent.vbs`:
   ```vbscript
   Set WshShell = CreateObject("WScript.Shell")
   WshShell.Run "cmd /c cd /d """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & """ && npx serve -s dist -l 5173", 0, False
   Set WshShell = Nothing
   ```

   **Linux/macOS** - Create `serve-silent.sh`:
   ```bash
   #!/bin/bash
   cd "$(dirname "$0")"
   nohup npx serve -s dist -l 5173 > /dev/null 2>&1 &
   echo $! > .serve.pid
   ```
   ```bash
   chmod +x serve-silent.sh
   ```

3. **Create Chrome App Launcher**

   **Windows** - Create `launch-chrome-app.vbs`:
   ```vbscript
   Set WshShell = CreateObject("WScript.Shell")
   WshShell.Run """C:\Program Files\Google\Chrome\Application\chrome.exe"" --app=http://localhost:5173 --window-size=1920,1080 --window-position=0,0", 1, False
   Set WshShell = Nothing
   ```

   **Linux** - Create `launch-chrome-app.sh`:
   ```bash
   #!/bin/bash
   google-chrome --app=http://localhost:5173 --window-size=1920,1080 --window-position=0,0 &
   ```

   **macOS** - Create `launch-chrome-app.sh`:
   ```bash
   #!/bin/bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --app=http://localhost:5173 --window-size=1920,1080 --window-position=0,0 &
   ```

4. **Launch the application**
   - **Windows**: Double-click `serve-silent.vbs`, then `launch-chrome-app.vbs`
   - **Linux/macOS**: Run `./serve-silent.sh && ./launch-chrome-app.sh`

5. **Stop the server (when done)**

   **Windows**: Open Task Manager and end the `node.exe` process running serve

   **Linux/macOS**:
   ```bash
   kill $(cat .serve.pid)
   rm .serve.pid
   ```

#### Method 2: Using Vite Dev Server (Development Mode)

1. **Create silent dev server launcher**

   **Windows** - Create `dev-silent.vbs`:
   ```vbscript
   Set WshShell = CreateObject("WScript.Shell")
   WshShell.Run "cmd /c cd /d """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & """ && npm run dev", 0, False
   Set WshShell = Nothing
   ```

   **Linux/macOS** - Create `dev-silent.sh`:
   ```bash
   #!/bin/bash
   cd "$(dirname "$0")"
   nohup npm run dev > /dev/null 2>&1 &
   echo $! > .dev.pid
   ```

2. **Launch Chrome in app mode** (wait 3-5 seconds for server to start)
   Use the same Chrome launchers from Method 1

3. **Stop the dev server**
   - **Windows**: Kill the node.exe process
   - **Linux/macOS**: `kill $(cat .dev.pid) && rm .dev.pid`

#### Method 3: All-in-One Launcher Script

**Windows** - Create `LAUNCH_CHROME_APP.bat`:
```batch
@echo off
echo Starting Tissaia Chrome App...
start /min cmd /c "npm run build && npx serve -s dist -l 5173"
timeout /t 5 /nobreak > nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1920,1080
```

**Linux/macOS** - Create `launch-chrome-app-all.sh`:
```bash
#!/bin/bash
echo "Building and launching Tissaia Chrome App..."
npm run build > /dev/null 2>&1
nohup npx serve -s dist -l 5173 > /dev/null 2>&1 &
echo $! > .serve.pid
sleep 3
if [[ "$OSTYPE" == "darwin"* ]]; then
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --app=http://localhost:5173 --window-size=1920,1080 &
else
    google-chrome --app=http://localhost:5173 --window-size=1920,1080 &
fi
```

#### Chrome App Mode Features
- No browser UI (address bar, tabs, bookmarks)
- Dedicated window with app-like experience
- Custom window size and position
- Perfect for kiosk mode or dedicated workstations

#### Troubleshooting

**Port already in use:**
```bash
# Find process using port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <process_id> /F

# Linux/macOS
lsof -ti:5173 | xargs kill -9
```

**Chrome path not found:**
- Update the Chrome executable path in launch scripts to match your installation
- Common paths:
  - Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`
  - Linux: `/usr/bin/google-chrome` or `/usr/bin/chromium-browser`
  - macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

**Server not starting:**
- Ensure port 5173 is not blocked by firewall
- Check if Node.js is in PATH: `node --version`
- Try running manually first: `npm run dev` or `npx serve -s dist -l 5173`

## Usage Workflow

1. **Authentication**: Click through the BIOS boot sequence
2. **Upload Scans**: Drag-and-drop flatbed scanner images (JPEG, PNG, WebP)
3. **Verification**: Review auto-detected photo count (Stage 1 heuristics)
4. **Confirm**: Click "ZATWIERDŹ" to trigger Stage 2 AI detection
5. **Review Crops**: Inspect detected bounding boxes in Crop Map view
6. **Restore**: Click "ROZPOCZNIJ RESTAURACJĘ" to launch Stage 4 Alchemy
7. **Download**: Export restored photos from Magic Spell view

## Configuration

### Pipeline Tuning
Edit `config/pipeline.config.ts` to adjust:
- AI model selection and temperature
- Retry strategies for detection
- Crop margins and rotation handling
- Restoration prompt directives

### Global Constraints
```typescript
max_concurrent_restorations: 3        // Parallel restoration limit
max_input_file_size_mb: 50            // Upload size limit
supported_mime_types: ["image/png", "image/jpeg", "image/webp", "image/heic"]
```

## Performance Optimization

- **Concurrency**: Stages 3 & 4 run in parallel with configurable limits
- **Memory Management**: Automatic blob URL cleanup to prevent memory leaks
- **Lazy Loading**: Components render on-demand based on active view
- **Caching**: Log buffer limited to 100 entries (rolling window)

## Development

### Project Structure
```
Tissaia-AI/
├── components/          # React UI components
│   ├── FileListView.tsx
│   ├── CropMapView.tsx
│   ├── MagicSpellView.tsx
│   ├── LogsView.tsx
│   ├── Launcher.tsx
│   ├── Sidebar.tsx
│   └── TopBar.tsx
├── config/              # Pipeline configuration
│   ├── pipeline.config.ts
│   └── constants.ts
├── context/             # React context providers
│   └── LogContext.tsx
├── hooks/               # Custom React hooks
│   └── useFileScanner.ts
├── services/            # AI service integrations
│   ├── geminiService.ts
│   └── mock/
├── types/               # TypeScript type definitions
│   ├── pipeline.types.ts
│   ├── domain.types.ts
│   └── ui.types.ts
├── utils/               # Utility functions
│   ├── grid/
│   └── image/
└── App.tsx             # Root application component
```

### Adding New Agents

1. **Define agent interface** in `types/pipeline.types.ts`
2. **Implement agent logic** in `services/` or `hooks/`
3. **Register in pipeline** via `config/pipeline.config.ts`
4. **Add logging** through `useLogger()` context
5. **Update UI** to reflect new stage in views

### Mock Mode
If no API key is provided, the system runs in simulation mode:
- Stage 2: Returns grid-based mock detections
- Stage 4: Applies simple canvas filters as restoration placeholders

## Versioning

### v1.1.0 (Current)
- Dynamic grid layout for 8+ photo scans
- One-click "Approve All" workflow
- Fast scan heuristics (Phase PRE-A)
- Auto-scaling crop labels for high-density scans
- Comprehensive error handling across all stages

### v1.0.0
- Initial release with 4-stage pipeline
- Gemini AI integration
- Glassmorphic UI design system

## License

Proprietary - EPS AI Solutions

## Support

For issues, feature requests, or questions:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Documentation: See `architecture.md` and `AGENTS.md`

---

**Built with ❤️ using React, TypeScript, and Generative AI**
