# Architecture Documentation

<div align="center">

![Architecture](https://img.shields.io/badge/Architecture-Multi--Agent%20Pipeline-00ffa3?style=for-the-badge)
![Pattern](https://img.shields.io/badge/Pattern-Event%20Driven-blue?style=for-the-badge)
![State](https://img.shields.io/badge/State-Context%20API-purple?style=for-the-badge)

**Technical architecture, design patterns, and implementation details for Tissaia AI.**

</div>

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Directory Structure](#directory-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Design System](#design-system)
- [Performance Optimization](#performance-optimization)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

Tissaia AI follows a **multi-agent pipeline architecture** where specialized AI agents handle different aspects of photo restoration. The system is built using modern React patterns with a clean separation of concerns.

### Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Separation of Concerns** | Distinct layers for UI, business logic, and data |
| **Single Responsibility** | Each component/hook has one clear purpose |
| **Composition over Inheritance** | React hooks and functional components |
| **Dependency Injection** | Context providers for cross-cutting concerns |
| **Event-Driven** | Async operations with callbacks and promises |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  UI Layer   │  │   Hooks     │  │  Services   │  │    Utilities        │ │
│  │  (React)    │  │ (Business)  │  │  (AI/API)   │  │ (Image Processing)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                     │           │
│         └────────────────┴────────────────┴─────────────────────┘           │
│                                    │                                        │
│                          ┌─────────┴─────────┐                              │
│                          │   Context Layer   │                              │
│                          │  (State/Logging)  │                              │
│                          └─────────┬─────────┘                              │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ HTTP/HTTPS
┌────────────────────────────────────┼────────────────────────────────────────┐
│                              SERVER (Optional)                               │
├────────────────────────────────────┼────────────────────────────────────────┤
│                                    │                                        │
│  ┌──────────────┐  ┌──────────────┴──────────────┐  ┌────────────────────┐ │
│  │   Express    │  │         Routes              │  │    Services        │ │
│  │   Server     │──│  /api/analyze, /api/restore │──│  Gemini, Storage   │ │
│  └──────────────┘  └─────────────────────────────┘  └────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Google Gemini   │  │  Google Gemini   │  │      Cloud Storage       │  │
│  │  Vision API      │  │  Image API       │  │   (Google Drive, etc.)   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Multi-Agent Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MULTI-AGENT PIPELINE SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   STAGE 1   │    │   STAGE 2   │    │   STAGE 3   │    │   STAGE 4   │  │
│  │  Ingestion  │───▶│  Detection  │───▶│ Smart Crop  │───▶│   Alchemy   │  │
│  │  Heuristics │    │  (YOLO AI)  │    │  Protocol   │    │(Restoration)│  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│        │                  │                  │                  │          │
│        ▼                  ▼                  ▼                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Thumbnail  │    │  Bounding   │    │   Cropped   │    │  Restored   │  │
│  │  + Count    │    │   Boxes     │    │   Images    │    │   Images    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
│  Orchestration: hooks/useFileScanner.ts                                     │
│  Logging: context/LogContext.tsx                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
Tissaia-AI/
├── App.tsx                      # Root application component
├── index.tsx                    # React entry point
├── index.html                   # HTML template
│
├── components/                  # React UI components
│   ├── FileListView.tsx        # Data ingestion interface
│   ├── CropMapView.tsx         # Segmentation visualization
│   ├── MagicSpellView.tsx      # Restoration gallery
│   ├── LogsView.tsx            # Activity monitoring
│   ├── Launcher.tsx            # BIOS boot sequence
│   ├── Sidebar.tsx             # Navigation controller
│   ├── TopBar.tsx              # Context-aware header
│   ├── ThemeSwitcher.tsx       # Theme selector
│   ├── LanguageSwitcher.tsx    # Language selector
│   ├── KeyboardShortcutsHelp.tsx # Shortcuts guide
│   ├── ErrorBoundary.tsx       # Error handling
│   ├── LoadingSkeleton.tsx     # Loading placeholders
│   ├── Tooltip.tsx             # Reusable tooltip
│   ├── ImageEditor/            # Advanced image editing
│   ├── CloudStorage/           # Cloud integration
│   └── Onboarding/             # Tutorial components
│
├── hooks/                       # Custom React hooks
│   ├── useFileScanner.ts       # Main orchestration hook
│   ├── useAnalytics.ts         # Local analytics
│   ├── useBatchProcessor.ts    # Queue processing
│   ├── useFormValidation.ts    # Form validation
│   ├── useImageEditor.ts       # Image editing
│   ├── useKeyboardShortcuts.ts # Keyboard shortcuts
│   ├── usePerformanceMonitoring.ts # Web Vitals
│   ├── useOnboarding.ts        # Tutorial management
│   ├── useIndexedDB.ts         # IndexedDB operations
│   ├── useMobileDetection.ts   # Device detection
│   ├── useTouchGestures.ts     # Touch handling
│   ├── useVirtualScroll.ts     # Virtual scrolling
│   ├── useWebWorker.ts         # Web Worker offloading
│   └── useCloudStorage.ts      # Cloud storage
│
├── services/                    # External service integrations
│   ├── geminiService.ts        # Google Gemini API
│   ├── backendApiService.ts    # Backend API client
│   └── mock/                   # Mock services for demo
│       └── mockGeminiService.ts
│
├── config/                      # Configuration
│   ├── pipeline.config.ts      # Pipeline configuration
│   └── constants.ts            # Application constants
│
├── context/                     # React context providers
│   ├── LogContext.tsx          # Centralized logging
│   ├── ThemeContext.tsx        # Theme management
│   └── I18nContext.tsx         # Internationalization
│
├── types/                       # TypeScript definitions
│   ├── pipeline.types.ts       # Pipeline types
│   ├── domain.types.ts         # Domain entities
│   └── ui.types.ts             # UI state types
│
├── utils/                       # Utility functions
│   ├── image/                  # Image processing
│   │   └── processing.ts
│   ├── grid/                   # Grid calculations
│   │   └── gridCalculator.ts
│   ├── validation/             # Validation utilities
│   │   └── validators.ts
│   ├── database/               # Database utilities
│   │   └── indexedDB.ts
│   ├── i18n/                   # Internationalization
│   │   └── formatters.ts
│   ├── performance/            # Performance optimization
│   │   └── optimization.ts
│   ├── cloud/                  # Cloud storage
│   │   └── cloudProvider.ts
│   ├── pwa/                    # PWA utilities
│   │   └── serviceWorker.ts
│   ├── electron/               # Electron integration
│   │   └── electronAPI.ts
│   └── onboarding/             # Onboarding utilities
│       └── steps.ts
│
├── backend/                     # Node.js backend
│   ├── server.ts               # Express server
│   ├── routes/                 # API endpoints
│   │   ├── analyze.ts
│   │   └── restore.ts
│   ├── services/               # Backend services
│   │   ├── gemini.ts
│   │   ├── logger.ts
│   │   └── storage.ts
│   ├── middleware/             # Express middleware
│   └── types/                  # Backend types
│
├── tests/                       # Test suite
│   ├── setup.ts                # Test configuration
│   ├── utils/                  # Utility tests
│   ├── hooks/                  # Hook tests
│   └── integration/            # Integration tests
│
├── public/                      # Static assets
│   ├── pwa-icons/              # PWA icons
│   └── manifest.json           # PWA manifest
│
├── chrome-extension/            # Chrome extension
│   ├── manifest.json           # Extension manifest
│   ├── background.js           # Service worker
│   ├── popup.html/js           # Popup interface
│   └── icons/                  # Extension icons
│
├── electron/                    # Desktop application
│   ├── main.js                 # Main process
│   └── preload.js              # Preload script
│
└── data/                        # Mock data
    └── mockData.ts             # Test data
```

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx (Root Controller)
├── Launcher.tsx (Boot Sequence)
└── Main Dashboard
    ├── Sidebar.tsx (Navigation)
    ├── TopBar.tsx (Header)
    └── Content Area
        ├── FileListView.tsx
        ├── CropMapView.tsx
        ├── MagicSpellView.tsx
        └── LogsView.tsx
```

### Component Patterns

#### Container Components
Handle state and logic, delegate rendering to presentational components.

```typescript
// FileListView.tsx - Container Component
export const FileListView: React.FC<Props> = ({ files, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const { log } = useLogger();

  const handleDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    log('system', `Uploading ${acceptedFiles.length} files`);
    await onUpload(acceptedFiles);
    setUploading(false);
  };

  return <FileListPresentation files={files} onDrop={handleDrop} />;
};
```

#### Presentational Components
Pure rendering components with no internal state.

```typescript
// LoadingSkeleton.tsx - Presentational Component
export const FileListSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-20 bg-gray-800 rounded" />
    ))}
  </div>
);
```

### Hook Architecture

Hooks encapsulate business logic and can be composed together.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOOK COMPOSITION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  useFileScanner (Main Orchestrator)                                         │
│  ├── useState (file state)                                                  │
│  ├── useLogger (logging)                                                    │
│  ├── useBatchProcessor (queue management)                                   │
│  └── Internal Functions                                                     │
│      ├── simulateFastScan() → Stage 1                                       │
│      ├── analyzeWithAI() → Stage 2                                          │
│      ├── cropImages() → Stage 3                                             │
│      └── restoreImages() → Stage 4                                          │
│                                                                             │
│  useImageEditor (Image Manipulation)                                         │
│  ├── useState (editor state)                                                │
│  ├── useCallback (memoized operations)                                      │
│  └── Internal Functions                                                     │
│      ├── setBrightness()                                                    │
│      ├── setContrast()                                                      │
│      ├── rotate()                                                           │
│      └── exportImage()                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Express Server Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXPRESS SERVER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Middleware Stack                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ CORS → Helmet (Security) → Rate Limiter → Body Parser → Routes       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Routes                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │ GET /health     │  │ POST /api/      │  │ POST /api/restore           │ │
│  │                 │  │      analyze    │  │                             │ │
│  │ Health check    │  │ Image analysis  │  │ Image restoration           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                             │
│  Services                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │ GeminiService   │  │ StorageService  │  │ LoggerService               │ │
│  │ (AI operations) │  │ (File handling) │  │ (Winston logging)           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Request → CORS → Helmet → Rate Limit → Body Parser → Route Handler → Response
                                                          │
                                                          ▼
                                                    Service Layer
                                                          │
                                                          ▼
                                                    External API
                                                    (Gemini, etc.)
```

---

## Data Flow

### File Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FILE PROCESSING FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. USER INPUT                                                              │
│  ┌─────────────┐                                                            │
│  │ Drag & Drop │ ──┐                                                        │
│  └─────────────┘   │                                                        │
│  ┌─────────────┐   ├──▶ handleUpload(files)                                 │
│  │ File Dialog │ ──┘                                                        │
│  └─────────────┘                                                            │
│                                                                             │
│  2. FILE CREATION                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Create ScanFile object with:                                          │ │
│  │ - id: unique identifier                                                │ │
│  │ - file: raw File object                                                │ │
│  │ - preview: ObjectURL for display                                       │ │
│  │ - status: UPLOADING                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  3. STAGE 1 (Pre-Analysis)                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ status: PRE_ANALYZING                                                  │ │
│  │ → Generate thumbnail                                                   │ │
│  │ → Run edge detection                                                   │ │
│  │ → Estimate photo count                                                 │ │
│  │ status: PENDING_VERIFICATION                                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  4. USER VERIFICATION                                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ User confirms estimated photo count                                    │ │
│  │ → Click "ZATWIERDŹ" (Approve)                                          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  5. STAGE 2 (AI Detection)                                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ status: DETECTING                                                      │ │
│  │ → Send to Gemini Vision API                                            │ │
│  │ → Receive bounding boxes                                               │ │
│  │ → Store detections in file.detectedCrops                               │ │
│  │ status: CROPPED                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  6. STAGE 3 (Cropping)                                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ For each detected crop:                                                │ │
│  │ → Calculate pixel coordinates                                          │ │
│  │ → Apply margin cuts                                                    │ │
│  │ → Handle rotation                                                      │ │
│  │ → Export as PNG blob                                                   │ │
│  │ → Store in file.croppedImages                                          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  7. STAGE 4 (Restoration)                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ status: RESTORING                                                      │ │
│  │ For each cropped image:                                                │ │
│  │ → Send to Gemini Image API                                             │ │
│  │ → Receive restored image                                               │ │
│  │ → Store in file.restoredImages                                         │ │
│  │ status: RESTORED                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State Transitions

```
UPLOADING ──────────▶ PRE_ANALYZING ──────────▶ PENDING_VERIFICATION
     │                      │                           │
     │ (error)              │ (error)                   │ (user approves)
     ▼                      ▼                           ▼
   ERROR                  ERROR                     DETECTING
                                                        │
                                                        │ (AI detection complete)
                                                        ▼
                                                    CROPPED
                                                        │
                                                        │ (user starts restoration)
                                                        ▼
                                                   RESTORING
                                                        │
                                                        │ (restoration complete)
                                                        ▼
                                                    RESTORED
```

---

## State Management

### Central State (App.tsx)

```typescript
// App.tsx - Central State Management

interface AppState {
  // Authentication
  isAuthenticated: boolean;

  // Navigation
  activeView: ViewMode;  // 'FILES' | 'CROP_MAP' | 'MAGIC_SPELL' | 'LOGS'

  // File Repository
  files: ScanFile[];

  // Selected Items
  selectedFileId: string | null;
  selectedCropId: string | null;
}
```

### Context Providers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTEXT HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  <ThemeProvider>                                                            │
│    <I18nProvider>                                                           │
│      <LogProvider>                                                          │
│        <App />                                                              │
│      </LogProvider>                                                         │
│    </I18nProvider>                                                          │
│  </ThemeProvider>                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### LogContext

```typescript
interface LogContextValue {
  logs: LogEntry[];
  log: (type: LogType, message: string, metadata?: object) => void;
  clearLogs: () => void;
  exportLogs: () => void;
}

type LogType = 'system' | 'chat' | 'debug';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: LogType;
  message: string;
  metadata?: object;
}
```

### ThemeContext

```typescript
type Theme = 'dark' | 'light' | 'cyberpunk' | 'classic' | 'high-contrast';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}
```

---

## Design System

### CSS Variables

```css
:root {
  /* Colors - Dark Theme */
  --bg-primary: #050a0a;
  --bg-secondary: #0a1a1a;
  --bg-tertiary: #0f2020;

  --accent-primary: #00ffa3;
  --accent-secondary: #00cc83;
  --accent-tertiary: #009963;

  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #606060;

  --border-color: rgba(0, 255, 163, 0.2);
  --glass-bg: rgba(0, 0, 0, 0.6);
  --glass-border: rgba(255, 255, 255, 0.1);

  /* Effects */
  --glass-blur: blur(16px);
  --glow-shadow: 0 0 20px var(--accent-primary);

  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### Glassmorphism Pattern

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}
```

### Animation Keyframes

```css
@keyframes scan-vertical {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px var(--accent-primary); }
  50% { box-shadow: 0 0 30px var(--accent-primary); }
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}
```

---

## Performance Optimization

### Strategies Implemented

| Strategy | Implementation | Location |
|----------|----------------|----------|
| **Code Splitting** | Dynamic imports for views | `App.tsx` |
| **Virtual Scrolling** | Large list optimization | `useVirtualScroll.ts` |
| **Web Workers** | Heavy computation offload | `useWebWorker.ts` |
| **Memoization** | Expensive calculations | `utils/performance/` |
| **Lazy Loading** | Components and images | Throughout |
| **Debouncing** | Input handlers | `utils/performance/` |
| **Throttling** | Scroll/resize handlers | `utils/performance/` |

### Image Optimization

```typescript
// utils/performance/optimization.ts

export async function optimizeImage(
  file: File,
  options: OptimizationOptions
): Promise<Blob> {
  // 1. Create off-screen canvas
  // 2. Draw and resize image
  // 3. Apply compression
  // 4. Return optimized blob
}
```

### Memory Management

```typescript
// Automatic ObjectURL cleanup
useEffect(() => {
  return () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
  };
}, [files]);
```

---

## Security Architecture

### Frontend Security

| Measure | Implementation |
|---------|----------------|
| **CSP Headers** | Strict Content Security Policy |
| **Input Validation** | Client-side validation before submission |
| **XSS Prevention** | HTML escaping, sanitization |
| **File Validation** | Magic bytes, size limits, type checking |

### Backend Security

| Measure | Implementation |
|---------|----------------|
| **Helmet.js** | Security headers |
| **Rate Limiting** | Request throttling per IP |
| **Input Sanitization** | Server-side validation |
| **API Key Protection** | Server-side only, never exposed |
| **CORS** | Restricted origin policy |

### File Upload Security

```typescript
// Validation chain
const validateUpload = async (file: File): Promise<ValidationResult> => {
  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: 'File too large' };

  // 2. Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: 'Invalid type' };

  // 3. Validate magic bytes
  const buffer = await file.slice(0, 4).arrayBuffer();
  if (!validateMagicBytes(buffer)) return { valid: false, error: 'Invalid file' };

  return { valid: true };
};
```

---

## Deployment Architecture

### Docker Deployment

```yaml
# docker-compose.yml
services:
  frontend:
    build: .
    ports:
      - "5174:5174"
    environment:
      - NODE_ENV=production

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./backend/logs:/app/logs
```

### CI/CD Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Push      │───▶│   Lint &     │───▶│    Build     │───▶│   Deploy     │
│  to Branch   │    │    Test      │    │   Package    │    │  to Stage    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

## Future Considerations

### Planned Improvements

1. **Zustand for State** - Replace Context API for complex state
2. **TanStack Query** - Intelligent API caching
3. **WebSocket Support** - Real-time updates
4. **Worker Threads** - Node.js multi-threading for backend
5. **Redis Caching** - Distributed caching for scale

### Scalability Path

```
Current (Single Server)
         │
         ▼
Load Balancer + Multiple Instances
         │
         ▼
Microservices Architecture
├── Frontend Service
├── Detection Service
├── Restoration Service
└── Storage Service
```

---

<div align="center">

**[Back to README](README.md)** | **[API Documentation](docs/API_DOCUMENTATION.md)** | **[Contributing](docs/CONTRIBUTING.md)**

</div>
