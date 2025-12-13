# Tissaia AI - API Documentation

<div align="center">

![API](https://img.shields.io/badge/API-REST-00ffa3?style=for-the-badge)
![Hooks](https://img.shields.io/badge/Hooks-14+-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge)

**Complete API reference for Tissaia AI hooks, utilities, components, and backend endpoints.**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Custom Hooks](#custom-hooks)
- [Utility Functions](#utility-functions)
- [React Components](#react-components)
- [Context Providers](#context-providers)
- [Backend API](#backend-api)
- [Type Definitions](#type-definitions)
- [Examples](#examples)

---

## Overview

This document provides comprehensive API documentation for all public interfaces in Tissaia AI. The codebase is written in TypeScript with strict typing enabled.

### Conventions

- All async functions return `Promise<T>`
- Error handling follows the `Result<T, E>` pattern where applicable
- Hooks follow React naming conventions (`use` prefix)
- Optional parameters are marked with `?`

---

## Custom Hooks

### useImageEditor

Advanced image editing hook with filters, transformations, and export capabilities.

```typescript
import { useImageEditor } from './hooks/useImageEditor';

const editor = useImageEditor(image, options);
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image` | `string \| File \| null` | - | Initial image to edit |
| `options` | `ImageEditorOptions` | `{}` | Editor configuration |

**Options:**

```typescript
interface ImageEditorOptions {
  maxWidth?: number;      // Max width in pixels (default: 2048)
  maxHeight?: number;     // Max height in pixels (default: 2048)
  format?: string;        // Export format (default: 'image/jpeg')
  quality?: number;       // Export quality 0-1 (default: 0.9)
}
```

**Returns:**

```typescript
interface ImageEditorResult {
  // State
  image: HTMLImageElement | null;
  editorState: EditorState;
  isLoading: boolean;
  error: Error | null;

  // Filter controls
  setBrightness: (value: number) => void;   // 0-200%
  setContrast: (value: number) => void;     // 0-200%
  setSaturation: (value: number) => void;   // 0-200%
  setBlur: (value: number) => void;         // 0-20px

  // Transform controls
  rotate: (degrees: number) => void;
  flipHorizontal: () => void;
  flipVertical: () => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => void;

  // Export
  exportImage: () => Promise<Blob>;
  download: (filename: string) => Promise<void>;
}
```

---

### useOnboarding

Manage interactive onboarding tutorials with progress tracking.

```typescript
import { useOnboarding } from './hooks/useOnboarding';

const onboarding = useOnboarding(steps, options);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `steps` | `OnboardingStep[]` | Tutorial steps |
| `options` | `OnboardingOptions` | Configuration |

**Step Definition:**

```typescript
interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target?: string;        // CSS selector for target element
  placement?: Placement;  // Tooltip placement
  action?: () => void;    // Action when step is shown
}

type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';
```

**Options:**

```typescript
interface OnboardingOptions {
  storageKey?: string;    // localStorage key (default: 'onboarding')
  autoStart?: boolean;    // Auto-start on first visit (default: true)
  showOnce?: boolean;     // Show only once (default: true)
}
```

**Returns:**

```typescript
interface OnboardingResult {
  // State
  currentStep: OnboardingStep | null;
  currentStepIndex: number;
  isActive: boolean;
  progress: number;       // 0-100

  // Navigation
  start: () => void;
  next: () => void;
  previous: () => void;
  goToStep: (id: string) => void;
  skip: () => void;
  complete: () => void;
  reset: () => void;

  // Helpers
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
}
```

---

### useIndexedDB

Generic IndexedDB operations hook for local data persistence.

```typescript
import { useIndexedDB } from './hooks/useIndexedDB';

const db = useIndexedDB<DataType>(storeName);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `storeName` | `string` | Object store name |

**Returns:**

```typescript
interface IndexedDBResult<T> {
  // State
  isReady: boolean;
  error: Error | null;

  // CRUD Operations
  add: (item: T) => Promise<IDBValidKey>;
  put: (item: T) => Promise<IDBValidKey>;
  get: (key: IDBValidKey) => Promise<T | undefined>;
  getAll: (query?: IDBKeyRange) => Promise<T[]>;
  remove: (key: IDBValidKey) => Promise<void>;
  clear: () => Promise<void>;
  count: (query?: IDBKeyRange) => Promise<number>;
}
```

---

### useBatchProcessor

Process items in batches with queue management and concurrency control.

```typescript
import { useBatchProcessor } from './hooks/useBatchProcessor';

const processor = useBatchProcessor<T>(processFunction, options);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `processFunction` | `(item: T) => Promise<void>` | Function to process each item |
| `options` | `BatchOptions` | Configuration |

**Options:**

```typescript
interface BatchOptions {
  concurrency?: number;           // Max concurrent items (default: 3)
  onItemComplete?: (item: QueueItem) => void;
  onItemError?: (item: QueueItem, error: Error) => void;
  onBatchComplete?: () => void;
}
```

**Returns:**

```typescript
interface BatchProcessorResult<T> {
  // State
  queue: QueueItem<T>[];
  isProcessing: boolean;
  progress: number;
  completedCount: number;
  errorCount: number;

  // Controls
  addToQueue: (items: T[]) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  retry: (id: string) => void;
  retryAll: () => void;
  clear: () => void;
}

interface QueueItem<T> {
  id: string;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: Error;
  progress?: number;
}
```

---

### usePerformanceMonitoring

Monitor Web Vitals and performance metrics.

```typescript
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';

const metrics = usePerformanceMonitoring(enabled);
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable monitoring |

**Returns:**

```typescript
interface PerformanceMonitoringResult {
  metrics: PerformanceMetric[];
  latestMetrics: {
    LCP?: number;    // Largest Contentful Paint
    FID?: number;    // First Input Delay
    CLS?: number;    // Cumulative Layout Shift
    FCP?: number;    // First Contentful Paint
    TTFB?: number;   // Time to First Byte
  };
  clearMetrics: () => void;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
}
```

---

### useAnalytics

Privacy-respecting local analytics tracking.

```typescript
import { useAnalytics } from './hooks/useAnalytics';

const analytics = useAnalytics();
```

**Returns:**

```typescript
interface AnalyticsResult {
  // Tracking
  trackEvent: (name: string, properties?: Record<string, unknown>) => void;
  trackPageView: (path: string) => void;
  trackTiming: (name: string, duration: number) => void;

  // Data
  getAnalyticsSummary: () => AnalyticsSummary;
  getEvents: (filter?: EventFilter) => AnalyticsEvent[];
  clearAnalytics: () => void;

  // Settings
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

interface AnalyticsSummary {
  totalEvents: number;
  totalPageViews: number;
  sessionCount: number;
  averageSessionDuration: number;
  topEvents: { name: string; count: number }[];
}
```

---

### useFormValidation

Form state and validation management.

```typescript
import { useFormValidation } from './hooks/useFormValidation';

const form = useFormValidation(initialValues, validationRules);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialValues` | `Record<string, any>` | Initial form values |
| `validationRules` | `ValidationRules` | Validation rules per field |

**Validation Rules:**

```typescript
type ValidationRules = Record<string, ValidationRule[]>;

type ValidationRule = (value: any, allValues: any) => string | null;
```

**Returns:**

```typescript
interface FormValidationResult<T> {
  // State
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  // Handlers
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (callback: (values: T) => Promise<void>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;

  // Actions
  reset: () => void;
  resetField: (field: keyof T) => void;
  validate: () => boolean;
  validateField: (field: keyof T) => boolean;
}
```

---

### useKeyboardShortcuts

Register and manage keyboard shortcuts.

```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

useKeyboardShortcuts(shortcuts, enabled);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `shortcuts` | `KeyboardShortcut[]` | Shortcut definitions |
| `enabled` | `boolean` | Enable shortcuts (default: true) |

**Shortcut Definition:**

```typescript
interface KeyboardShortcut {
  key: string;              // Key code (e.g., 'KeyU', 'Space')
  modifiers?: Modifier[];   // ['ctrl'], ['cmd'], ['alt'], ['shift']
  action: () => void;       // Handler function
  description?: string;     // For help display
  preventDefault?: boolean; // Prevent default (default: true)
}

type Modifier = 'ctrl' | 'cmd' | 'alt' | 'shift' | 'meta';
```

---

### useMobileDetection

Detect device type and capabilities.

```typescript
import { useMobileDetection } from './hooks/useMobileDetection';

const device = useMobileDetection();
```

**Returns:**

```typescript
interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  orientation: 'portrait' | 'landscape';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  screenSize: { width: number; height: number };
}
```

---

### useTouchGestures

Handle touch gestures for mobile interactions.

```typescript
import { useTouchGestures } from './hooks/useTouchGestures';

const elementRef = useTouchGestures(options);
```

**Options:**

```typescript
interface TouchGestureOptions {
  onSwipe?: (direction: SwipeDirection, velocity: number) => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;    // Min swipe distance (default: 50)
  longPressDelay?: number;    // Long press delay ms (default: 500)
}

type SwipeDirection = 'up' | 'down' | 'left' | 'right';
```

**Returns:**

```typescript
RefObject<HTMLElement>  // Attach to target element
```

---

### useVirtualScroll

Virtual scrolling for large lists.

```typescript
import { useVirtualScroll } from './hooks/useVirtualScroll';

const scroll = useVirtualScroll(itemCount, options);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `itemCount` | `number` | Total number of items |
| `options` | `VirtualScrollOptions` | Configuration |

**Options:**

```typescript
interface VirtualScrollOptions {
  itemHeight: number;       // Item height in pixels
  containerHeight: number;  // Container height in pixels
  overscan?: number;        // Extra items to render (default: 3)
}
```

**Returns:**

```typescript
interface VirtualScrollResult {
  virtualItems: VirtualItem[];
  totalHeight: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  containerRef: RefObject<HTMLElement>;
}

interface VirtualItem {
  index: number;
  offsetTop: number;
  height: number;
}
```

---

### useWebWorker

Offload heavy computation to Web Workers.

```typescript
import { useWebWorker } from './hooks/useWebWorker';

const worker = useWebWorker(workerFunction, options);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `workerFunction` | `(data: TInput) => TOutput` | Function to run in worker |
| `options` | `WebWorkerOptions` | Configuration |

**Options:**

```typescript
interface WebWorkerOptions {
  timeout?: number;           // Timeout in ms (default: 30000)
  transferable?: boolean;     // Use transferable objects (default: false)
}
```

**Returns:**

```typescript
interface WebWorkerResult<TInput, TOutput> {
  data: TOutput | null;
  error: Error | null;
  isLoading: boolean;
  run: (input: TInput) => Promise<TOutput>;
  terminate: () => void;
}
```

---

## Utility Functions

### Performance Utilities

```typescript
import {
  debounce,
  throttle,
  memoize,
  optimizeImage,
  lazyWithRetry
} from './utils/performance';
```

#### debounce

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): DebouncedFunction<T>
```

#### throttle

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ThrottledFunction<T>
```

#### memoize

```typescript
function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T
```

#### optimizeImage

```typescript
async function optimizeImage(
  file: File,
  options?: ImageOptimizationOptions
): Promise<Blob>

interface ImageOptimizationOptions {
  maxWidth?: number;      // Default: 1920
  maxHeight?: number;     // Default: 1080
  quality?: number;       // Default: 0.8
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}
```

---

### Validation Utilities

```typescript
import { validators, fileValidation } from './utils/validation';
```

#### Built-in Validators

```typescript
const validators = {
  required: (message?: string) => ValidationRule;
  email: (message?: string) => ValidationRule;
  minLength: (min: number, message?: string) => ValidationRule;
  maxLength: (max: number, message?: string) => ValidationRule;
  pattern: (regex: RegExp, message?: string) => ValidationRule;
  numeric: (message?: string) => ValidationRule;
  url: (message?: string) => ValidationRule;
  custom: (validator: (value: any) => boolean, message: string) => ValidationRule;
};
```

#### File Validation

```typescript
interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const fileValidation = {
  validateImageFile: (file: File) => Promise<FileValidationResult>;
  validateFileSize: (file: File, maxSize: number) => FileValidationResult;
  validateFileType: (file: File, allowedTypes: string[]) => FileValidationResult;
  validateMagicBytes: (file: File) => Promise<FileValidationResult>;
};
```

---

### Internationalization Utilities

```typescript
import {
  formatNumber,
  formatDate,
  formatFileSize,
  formatRelativeTime
} from './utils/i18n';
```

#### formatNumber

```typescript
function formatNumber(
  value: number,
  language?: string,
  options?: Intl.NumberFormatOptions
): string
```

#### formatDate

```typescript
function formatDate(
  date: Date | string | number,
  language?: string,
  options?: Intl.DateTimeFormatOptions
): string
```

#### formatFileSize

```typescript
function formatFileSize(bytes: number, language?: string): string
// Example: formatFileSize(1536000) => "1.5 MB"
```

#### formatRelativeTime

```typescript
function formatRelativeTime(date: Date, language?: string): string
// Example: formatRelativeTime(twoDaysAgo) => "2 days ago"
```

---

## React Components

### ImageEditor

Full-screen image editor with filters and transformations.

```tsx
import { ImageEditor } from './components/ImageEditor';

<ImageEditor
  image={file}
  onExport={(blob) => handleExport(blob)}
  onClose={() => setEditing(false)}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `image` | `File \| string` | Yes | Image to edit |
| `onExport` | `(blob: Blob) => void` | Yes | Export callback |
| `onClose` | `() => void` | Yes | Close callback |
| `initialFilters` | `FilterState` | No | Initial filter values |

---

### ErrorBoundary

Catch and handle React errors gracefully.

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Components to wrap |
| `fallback` | `ReactNode \| ((error: Error) => ReactNode)` | No | Fallback UI |
| `onError` | `(error: Error, info: ErrorInfo) => void` | No | Error callback |

---

### ThemeSwitcher

Dropdown theme selector component.

```tsx
import { ThemeSwitcher } from './components/ThemeSwitcher';

<ThemeSwitcher />
```

Uses ThemeContext internally. No props required.

---

### LoadingSkeleton

Loading placeholder components.

```tsx
import {
  FileListSkeleton,
  GallerySkeleton,
  CropMapSkeleton
} from './components/LoadingSkeleton';

<FileListSkeleton count={3} />
<GallerySkeleton columns={4} />
<CropMapSkeleton />
```

---

## Context Providers

### ThemeContext

```tsx
import { useTheme, ThemeProvider } from './context/ThemeContext';

// Wrap app
<ThemeProvider>
  <App />
</ThemeProvider>

// Use in component
const { theme, setTheme, themes } = useTheme();
```

**Context Value:**

```typescript
interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

type Theme = 'dark' | 'light' | 'cyberpunk' | 'classic' | 'high-contrast';
```

---

### I18nContext

```tsx
import { useI18n, useTranslation, I18nProvider } from './context/I18nContext';

// Wrap app
<I18nProvider defaultLanguage="en">
  <App />
</I18nProvider>

// Use in component
const { language, setLanguage, t } = useI18n();
const { t } = useTranslation();
```

**Context Value:**

```typescript
interface I18nContextValue {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  languages: string[];
}
```

---

### LogContext

```tsx
import { useLogger, LogProvider } from './context/LogContext';

// Wrap app
<LogProvider>
  <App />
</LogProvider>

// Use in component
const { log, logs, clearLogs, exportLogs } = useLogger();
```

**Context Value:**

```typescript
interface LogContextValue {
  logs: LogEntry[];
  log: (type: LogType, message: string, metadata?: object) => void;
  clearLogs: () => void;
  exportLogs: () => void;
  getLogsByType: (type: LogType) => LogEntry[];
}

type LogType = 'system' | 'chat' | 'debug';
```

---

## Backend API

### Base URL

```
Development: http://localhost:3001
Production: https://api.tissaia.ai (or your deployment URL)
```

### Authentication

Currently, API endpoints use API key authentication via environment variables.

---

### Endpoints

#### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.1.0"
}
```

---

#### POST /api/analyze

Analyze image and detect photo regions.

**Request:**

```http
POST /api/analyze
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | `File` | Yes | Image file to analyze |
| `estimatedCount` | `number` | No | Expected photo count |

**Response:**

```json
{
  "success": true,
  "data": {
    "boxes": [
      {
        "x": 50,
        "y": 100,
        "width": 400,
        "height": 300
      }
    ],
    "confidence": [0.95],
    "rotations": [0]
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "Failed to analyze image"
  }
}
```

---

#### POST /api/restore

Restore image using AI.

**Request:**

```http
POST /api/restore
Content-Type: application/json
```

```json
{
  "image": "base64_encoded_image_data",
  "options": {
    "outpaint": true,
    "denoising": true,
    "enhance": true,
    "colorGrade": "kodak-portra-400"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "restoredImage": "base64_encoded_restored_image"
  }
}
```

---

## Type Definitions

### Domain Types

```typescript
// types/domain.types.ts

interface ScanFile {
  id: string;
  file: File;
  preview: string;           // ObjectURL
  status: ScanStatus;
  estimatedCount?: number;
  detectedCrops?: DetectedCrop[];
  croppedImages?: CroppedImage[];
  restoredImages?: RestoredImage[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

type ScanStatus =
  | 'UPLOADING'
  | 'PRE_ANALYZING'
  | 'PENDING_VERIFICATION'
  | 'DETECTING'
  | 'CROPPED'
  | 'RESTORING'
  | 'RESTORED'
  | 'ERROR';

interface DetectedCrop {
  id: string;
  box: BoundingBox;
  confidence: number;
  rotation: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedImage {
  id: string;
  cropId: string;
  blob: Blob;
  preview: string;
  dimensions: { width: number; height: number };
}

interface RestoredImage {
  id: string;
  cropId: string;
  blob: Blob;
  preview: string;
  appliedOperations: string[];
}
```

### UI Types

```typescript
// types/ui.types.ts

type ViewMode = 'FILES' | 'CROP_MAP' | 'MAGIC_SPELL' | 'LOGS';

interface UIState {
  activeView: ViewMode;
  selectedFileId: string | null;
  selectedCropId: string | null;
  isLoading: boolean;
  error: string | null;
}
```

---

## Examples

### Basic Image Editing

```typescript
import { useImageEditor } from './hooks/useImageEditor';

function ImageEditorExample() {
  const editor = useImageEditor(imageFile, {
    maxWidth: 2048,
    format: 'image/jpeg',
    quality: 0.9
  });

  // Adjust filters
  editor.setBrightness(120);
  editor.setContrast(110);

  // Transform
  editor.rotate(90);
  editor.flipHorizontal();

  // Undo/Redo
  if (editor.canUndo) editor.undo();

  // Export
  const handleExport = async () => {
    const blob = await editor.exportImage();
    await editor.download('edited-image.jpg');
  };

  return (
    <button onClick={handleExport}>
      Export Image
    </button>
  );
}
```

### Batch Processing

```typescript
import { useBatchProcessor } from './hooks/useBatchProcessor';

function BatchExample() {
  const processor = useBatchProcessor(
    async (file) => {
      // Process each file
      await processImage(file);
    },
    {
      concurrency: 3,
      onItemComplete: (item) => {
        console.log(`Completed: ${item.id}`);
      }
    }
  );

  return (
    <div>
      <button onClick={() => processor.addToQueue(files)}>
        Add Files
      </button>
      <button onClick={processor.pause}>Pause</button>
      <button onClick={processor.resume}>Resume</button>
      <progress value={processor.progress} max={100} />
    </div>
  );
}
```

### Form Validation

```typescript
import { useFormValidation } from './hooks/useFormValidation';
import { validators } from './utils/validation';

function FormExample() {
  const form = useFormValidation(
    { email: '', name: '', message: '' },
    {
      email: [validators.required(), validators.email()],
      name: [validators.required(), validators.minLength(2)],
      message: [validators.required(), validators.maxLength(500)]
    }
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      form.handleSubmit(async (values) => {
        await submitForm(values);
      });
    }}>
      <input
        value={form.values.email}
        onChange={(e) => form.handleChange('email', e.target.value)}
        onBlur={() => form.handleBlur('email')}
      />
      {form.errors.email && <span>{form.errors.email}</span>}

      <button type="submit" disabled={!form.isValid}>
        Submit
      </button>
    </form>
  );
}
```

### Virtual Scrolling

```typescript
import { useVirtualScroll } from './hooks/useVirtualScroll';

function VirtualListExample({ items }) {
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll(
    items.length,
    {
      itemHeight: 50,
      containerHeight: 600,
      overscan: 5
    }
  );

  return (
    <div ref={containerRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetTop,
              height: 50
            }}
          >
            {items[index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

<div align="center">

**[Back to README](../README.md)** | **[Architecture](../architecture.md)** | **[Contributing](CONTRIBUTING.md)**

</div>
