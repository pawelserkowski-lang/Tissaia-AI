# Tissaia | Architect Engine

<div align="center">

![Version](https://img.shields.io/badge/version-1.1.0-00ffa3?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.1.4-646CFF?style=for-the-badge&logo=vite)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

**A high-fidelity photo restoration and analysis dashboard with a futuristic cyberpunk aesthetic.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [API](#-api-reference)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Pipeline Stages](#-pipeline-stages)
- [Tech Stack](#-tech-stack)
- [Configuration](#-configuration)
- [Deployment Options](#-deployment-options)
- [API Reference](#-api-reference)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Tissaia** is a professional forensic image processing environment powered by AI agents working in a coordinated pipeline to analyze, segment, and restore vintage photographs from flatbed scanner images.

### What Does Tissaia Do?

1. **Ingests** scanned photographs from flatbed scanners (potentially containing multiple photos per scan)
2. **Detects** and segments individual photos automatically using AI
3. **Crops** them intelligently with hygiene margins
4. **Restores** them using generative AI (scratches, dust, color correction)

### Key Highlights

| Feature | Description |
|---------|-------------|
| **Multi-Photo Detection** | Detect 1-50+ photos from a single flatbed scan |
| **AI-Powered Analysis** | Google Gemini Vision AI for precise segmentation |
| **Smart Cropping** | Automatic 10% hygiene margins, rotation handling |
| **Generative Restoration** | Outpainting, scratch removal, color grading |
| **Batch Processing** | Queue-based parallel processing with pause/resume |
| **Multiple Platforms** | Web, Desktop (Electron), Chrome Extension, PWA |

---

## ✨ Features

### Core Processing Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  STAGE 1    │───▶│   STAGE 2    │───▶│  STAGE 3    │───▶│   STAGE 4    │
│  Ingestion  │    │  Detection   │    │ Smart Crop  │    │   Alchemy    │
│  Heuristics │    │  (YOLO AI)   │    │  Protocol   │    │ (Restoration)│
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### User Interface

| View | Purpose |
|------|---------|
| **FileListView** | Data ingestion with drag-drop support |
| **CropMapView** | Interactive segmentation visualization |
| **MagicSpellView** | Before/after restoration gallery |
| **LogsView** | Real-time agent activity monitoring |
| **Launcher** | BIOS-style boot sequence |

### Backend Infrastructure

- **Node.js/Express API Server** - Optional backend for server-side processing
- **Secure API Key Management** - Keys stored server-side, never exposed to client
- **Winston Logging** - Comprehensive file-based logging (`backend/logs/`)
- **File Upload Handling** - Multer-based multipart uploads with validation
- **Health Monitoring** - `/health` endpoint for container/service monitoring
- **Auto File Cleanup** - Temporary files automatically cleaned after 1 hour

### Security & Validation

- **Content Security Policy (CSP)** - Protection against XSS and code injection
- **Security Headers** - X-Frame-Options, X-Content-Type-Options, HSTS
- **Input Validation** - Comprehensive client and server-side validation
- **File Validation** - Magic bytes checking, size limits, type verification
- **Sanitization** - HTML escaping, filename sanitization, XSS prevention
- **Rate Limiting** - Configurable request limits per IP

### User Experience

- **Error Boundaries** - Graceful error handling with recovery options
- **Keyboard Shortcuts** - 12 power-user shortcuts (press `?` for help)
- **Theme System** - 5 themes (Dark, Light, Cyberpunk, Classic, High Contrast)
- **Loading Skeletons** - Professional loading states instead of spinners
- **PWA Support** - Installable as native app on any device
- **Offline Mode** - Service worker caching for offline access

### Performance & Analytics

- **Web Vitals Monitoring** - Track LCP, FID, CLS, FCP, TTFB
- **Performance Tracking** - Real-time performance insights
- **Local Analytics** - Privacy-respecting usage analytics
- **Batch Processing** - Queue-based parallel processing

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm | 9+ |
| Google Gemini API Key | [Get one here](https://makersuite.google.com/app/apikey) |

### Installation Methods

#### Method 1: All-in-One Launcher (Recommended)

The comprehensive Python-based launcher provides automated setup with Chrome app mode.

**Windows:**
```cmd
launch.bat
```

**Linux / macOS:**
```bash
chmod +x launch.sh
./launch.sh
```

**Features:**
- ✅ Automated requirements checking (Node.js, npm, Chrome)
- ✅ Dependency installation with progress indicator
- ✅ API key configuration wizard
- ✅ Chrome app mode (standalone window)
- ✅ Comprehensive logging

#### Method 2: Manual Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd Tissaia-AI

# 2. Install dependencies
npm install

# 3. Configure environment
cat > .env << EOF
API_KEY=your_gemini_api_key_here
EOF

# 4. Start development server
npm run dev
```

The app will open automatically at `http://localhost:5174`

#### Method 3: With Backend Server

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings:
# GEMINI_API_KEY=your_key
# VITE_USE_BACKEND=true
# VITE_API_URL=http://localhost:3001

# 2. Run frontend and backend together
npm run dev:all
```

---

## 🏗 Architecture

### Multi-Agent Pipeline System

Tissaia implements a sophisticated 4-stage pipeline where specialized AI agents handle different aspects of photo restoration.

#### Agent Roles

##### 1. Ingestion Agent (Stage 1)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Initial file analysis and preprocessing |
| **Technology** | Edge Detection + Hough Transform |
| **Location** | `hooks/useFileScanner.ts:simulateFastScan()` |

**Responsibilities:**
- Load and validate raw scan files
- Generate thumbnail previews
- Perform fast heuristic analysis to estimate photo count
- Create initial bounding box proposals

##### 2. Detection Agent (Stage 2)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Neural object detection for precise photo segmentation |
| **Technology** | Google Gemini Vision AI (`gemini-3-pro-preview`) |
| **Location** | `services/geminiService.ts:analyzeImage()` |
| **Configuration** | `config/pipeline.config.ts:STAGE_2_DETECTION` |

**Responsibilities:**
- Analyze flatbed scanner images
- Detect individual photographs with bounding boxes
- Calculate confidence scores for each detection
- Determine rotation angles (0°, 90°, 180°, 270°)
- Implement adaptive retry strategies

##### 3. Smart Crop Agent (Stage 3)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Intelligent cropping with hygiene cuts |
| **Technology** | Client-side Canvas API |
| **Location** | `utils/image/processing.ts:cropImage()` |
| **Configuration** | `config/pipeline.config.ts:STAGE_3_SMART_CROP` |

**Responsibilities:**
- Map normalized coordinates (0-1000) to pixel values
- Apply 10% margin cuts to remove scanner artifacts
- Handle rotation transformations
- Export high-quality PNG crops

##### 4. Alchemy Agent (Stage 4)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Generative AI restoration |
| **Technology** | Google Gemini Image Generation (`gemini-3-pro-image-preview`) |
| **Location** | `services/geminiService.ts:restoreImage()` |
| **Configuration** | `config/pipeline.config.ts:STAGE_4_ALCHEMY` |

**Responsibilities:**
- Outpainting: Regenerate missing 10% borders
- Hygiene: Remove scratches, dust, and artifacts
- Detail Enhancement: Enhance facial features and sharpness
- Color Grading: Apply vintage "Kodak Portra 400" profile

### State Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         App.tsx (Central Controller)                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Authentication │ Navigation │ File Repository │ Resource Management    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ LogContext│   │useScanner │   │ ThemeCtx  │
            └───────────┘   └───────────┘   └───────────┘
```

**File Lifecycle States:**
```
UPLOADING → PRE_ANALYZING → PENDING_VERIFICATION → DETECTING → CROPPED → RESTORING → RESTORED
```

---

## ⚙ Pipeline Stages

### Stage 1: Ingestion Heuristics

```typescript
// Location: hooks/useFileScanner.ts

interface Stage1Result {
  thumbnail: string;         // Base64 thumbnail
  estimatedCount: number;    // Estimated photo count
  boundingBoxProposals: Box[]; // Initial proposals
}
```

**Processing Steps:**
1. Load raw image file
2. Generate thumbnail (300px max dimension)
3. Run edge detection
4. Apply Hough Transform for line detection
5. Estimate photo count based on detected boundaries

### Stage 2: Neural Detection

```typescript
// Location: services/geminiService.ts

interface DetectionResult {
  boxes: BoundingBox[];      // Detected photo regions
  confidence: number[];      // Confidence scores (0-1)
  rotations: number[];       // Rotation angles in degrees
}

interface BoundingBox {
  x: number;      // Normalized X (0-1000)
  y: number;      // Normalized Y (0-1000)
  width: number;  // Normalized width
  height: number; // Normalized height
}
```

**AI Prompt Strategy:**
```
Analyze this flatbed scanner image. Detect all individual photographs.
Return JSON with bounding boxes in normalized coordinates (0-1000).
Include confidence scores and rotation angles for each detection.
```

### Stage 3: Smart Crop

```typescript
// Location: utils/image/processing.ts

interface CropOptions {
  marginPercent: number;  // Default: 10%
  rotation: number;       // 0, 90, 180, 270
  outputFormat: 'png' | 'jpeg';
  quality: number;        // 0-1
}

async function cropImage(
  source: HTMLImageElement,
  box: BoundingBox,
  options: CropOptions
): Promise<Blob>
```

**Margin Calculation:**
```
Final Width = Box Width × (1 - 2 × marginPercent)
Final Height = Box Height × (1 - 2 × marginPercent)
```

### Stage 4: Alchemy Restoration

```typescript
// Location: services/geminiService.ts

interface RestorationOptions {
  outpaint: boolean;      // Regenerate borders
  denoising: boolean;     // Remove scratches/dust
  enhance: boolean;       // Sharpen details
  colorGrade: string;     // Color profile name
}

interface RestorationResult {
  restoredImage: string;  // Base64 PNG
  appliedOperations: string[];
}
```

**Restoration Pipeline:**
1. **Outpainting** - Regenerate the 10% that was cut in Stage 3
2. **Hygiene** - Remove dust, scratches, artifacts
3. **Enhancement** - Sharpen faces, improve details
4. **Color Grading** - Apply vintage color profile

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.1 | UI Framework |
| TypeScript | 5.3.3 | Type Safety |
| Vite | 5.1.4 | Build Tool |
| Tailwind CSS | CDN | Styling |
| FontAwesome | 6.x | Icons |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.21.2 | HTTP Server |
| Multer | 1.4.5 | File Uploads |
| Winston | 3.17.0 | Logging |
| tsx | 4.19.2 | TypeScript Execution |

### AI/ML

| Technology | Purpose |
|------------|---------|
| Google Gemini Vision | Image analysis and detection |
| Google Gemini Image | Generative restoration |
| Canvas API | Client-side image processing |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| Vitest | 1.0.4 | Test Runner |
| @testing-library/react | 16.0.0 | Component Testing |
| @vitest/ui | 1.0.4 | Test UI |

### Design System

```css
/* Core Theme */
--tissaia-bg: #050a0a;        /* Primary background */
--tissaia-accent: #00ffa3;    /* Neon green accent */
--glass-bg: rgba(0,0,0,0.6);  /* Glass morphism */
--glass-blur: blur(16px);     /* Backdrop blur */
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
API_KEY=your_gemini_api_key_here

# Backend Mode (Optional)
VITE_USE_BACKEND=true
VITE_API_URL=http://localhost:3001
GEMINI_API_KEY=your_gemini_api_key_here
BACKEND_PORT=3001

# Feature Flags (Optional)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
```

### Pipeline Configuration

Edit `config/pipeline.config.ts`:

```typescript
export const PIPELINE_CONFIG = {
  // Global constraints
  max_concurrent_restorations: 3,
  max_input_file_size_mb: 50,
  supported_mime_types: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic'
  ],

  // Stage 2: Detection
  STAGE_2_DETECTION: {
    model: 'gemini-3-pro-preview',
    temperature: 0.1,
    maxRetries: 3,
    retryDelay: 1000
  },

  // Stage 3: Smart Crop
  STAGE_3_SMART_CROP: {
    marginPercent: 0.10,
    outputFormat: 'png',
    maxDimension: 4096
  },

  // Stage 4: Alchemy
  STAGE_4_ALCHEMY: {
    model: 'gemini-3-pro-image-preview',
    colorProfile: 'kodak-portra-400',
    enhanceDetails: true
  }
};
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts help |
| `Ctrl/Cmd + U` | Upload files |
| `Ctrl/Cmd + E` | Export current view |
| `Ctrl/Cmd + L` | Toggle logs |
| `Ctrl/Cmd + D` | Delete selected |
| `Ctrl/Cmd + A` | Select all |
| `Space` | Quick preview |
| `Esc` | Close modals |
| `←/→` | Navigate gallery |
| `1-4` | Switch views |

---

## 📦 Deployment Options

### 1. Web Application

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

### 2. Desktop Application (Electron)

```bash
# Development
npm run electron:dev

# Build for current platform
npm run electron:build

# Platform-specific builds
npm run electron:build:mac
npm run electron:build:win
npm run electron:build:linux
```

See [ELECTRON_BUILD.md](docs/ELECTRON_BUILD.md) for detailed instructions.

### 3. Docker Container

```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t tissaia-ai .
docker run -p 5174:5174 tissaia-ai
```

### 4. Chrome Extension

1. Build the extension: `npm run build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `chrome-extension` directory

See [CHROME_EXTENSION.md](docs/CHROME_EXTENSION.md) for detailed instructions.

### 5. Progressive Web App (PWA)

The app is PWA-ready. Users can install it directly from the browser:
- **Desktop**: Click the install icon in the address bar
- **Mobile**: Use "Add to Home Screen" option

---

## 📡 API Reference

### Backend Endpoints

#### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Analyze Image

```http
POST /api/analyze
Content-Type: multipart/form-data
```

**Request:**
- `image` (file): Image file to analyze

**Response:**
```json
{
  "success": true,
  "data": {
    "boxes": [
      { "x": 50, "y": 100, "width": 400, "height": 300 }
    ],
    "confidence": [0.95],
    "rotations": [0]
  }
}
```

#### Restore Image

```http
POST /api/restore
Content-Type: application/json
```

**Request:**
```json
{
  "image": "base64...",
  "options": {
    "outpaint": true,
    "enhance": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "restoredImage": "base64..."
  }
}
```

See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for full API reference.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [architecture.md](architecture.md) | Technical architecture and design decisions |
| [AGENTS.md](AGENTS.md) | AI agent protocols and automation |
| [IMPROVEMENTS.md](IMPROVEMENTS.md) | Roadmap and improvement suggestions |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Full API reference |
| [docs/CHROME_EXTENSION.md](docs/CHROME_EXTENSION.md) | Chrome extension guide |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Contribution guidelines |
| [docs/ELECTRON_BUILD.md](docs/ELECTRON_BUILD.md) | Desktop app building |
| [USER_PREFERENCES.md](USER_PREFERENCES.md) | Configuration reference |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/your-username/Tissaia-AI.git
cd Tissaia-AI

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature

# Make changes, then commit
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

---

## 📄 License

**Proprietary** - EPS AI Solutions

All rights reserved. This software is provided for authorized use only.

---

## 🆘 Support

| Channel | Link |
|---------|------|
| GitHub Issues | [Open an issue](https://github.com/your-repo/Tissaia-AI/issues) |
| Documentation | See `docs/` directory |
| Email | support@tissaia-ai.com |

---

## 📈 Version History

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

---

<div align="center">

**Built with ❤️ using React, TypeScript, and Generative AI**

[⬆ Back to Top](#tissaia--architect-engine)

</div>
