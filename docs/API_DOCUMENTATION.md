# Tissaia AI - API Documentation

## Table of Contents

- [Hooks](#hooks)
- [Utils](#utils)
- [Components](#components)
- [Context](#context)
- [Backend API](#backend-api)

## Hooks

### useImageEditor

Advanced image editing hook with filters, transformations, and export capabilities.

```typescript
const editor = useImageEditor(image, options);
```

**Parameters:**
- `image` (string | File | null): Initial image to edit
- `options` (ImageEditorOptions): Editor configuration
  - `maxWidth` (number): Maximum width (default: 2048)
  - `maxHeight` (number): Maximum height (default: 2048)
  - `format` (string): Export format (default: 'image/jpeg')
  - `quality` (number): Export quality 0-1 (default: 0.9)

**Returns:**
- `image` (HTMLImageElement | null): Loaded image
- `editorState` (EditorState): Current editor state
- `setBrightness(value)`: Set brightness 0-200%
- `setContrast(value)`: Set contrast 0-200%
- `setSaturation(value)`: Set saturation 0-200%
- `setBlur(value)`: Set blur 0-20px
- `rotate(degrees)`: Rotate image
- `flipHorizontal()`: Flip horizontally
- `flipVertical()`: Flip vertically
- `undo()`: Undo last change
- `redo()`: Redo last undone change
- `reset()`: Reset all filters
- `exportImage()`: Export as Blob
- `download(filename)`: Download edited image

### useOnboarding

Manage interactive onboarding tutorials.

```typescript
const onboarding = useOnboarding(steps, options);
```

**Parameters:**
- `steps` (OnboardingStep[]): Tutorial steps
- `options` (OnboardingOptions):
  - `storageKey` (string): localStorage key
  - `autoStart` (boolean): Auto-start on first visit
  - `showOnce` (boolean): Show only once

**Returns:**
- `currentStep` (OnboardingStep): Current step
- `isActive` (boolean): Tutorial active state
- `progress` (number): Progress percentage
- `start()`: Start tutorial
- `next()`: Next step
- `previous()`: Previous step
- `skip()`: Skip tutorial
- `reset()`: Reset tutorial

### useIndexedDB

Generic IndexedDB operations hook.

```typescript
const db = useIndexedDB<DataType>(storeName);
```

**Parameters:**
- `storeName` (string): Object store name

**Returns:**
- `isReady` (boolean): Database ready state
- `add(item)`: Add item to store
- `put(item)`: Update item in store
- `get(key)`: Get item by key
- `getAll(query?)`: Get all items
- `remove(key)`: Delete item
- `clear()`: Clear all items
- `count(query?)`: Count items

### useBatchProcessor

Process items in batches with queue management.

```typescript
const processor = useBatchProcessor<T>(processFunction, options);
```

**Parameters:**
- `processFunction` ((item: T) => Promise<void>): Process function
- `options`:
  - `concurrency` (number): Max concurrent items
  - `onComplete` (function): Completion callback
  - `onError` (function): Error callback

**Returns:**
- `queue` (QueueItem[]): Current queue
- `isProcessing` (boolean): Processing state
- `addToQueue(items)`: Add items to queue
- `pause()`: Pause processing
- `resume()`: Resume processing
- `cancel()`: Cancel all
- `retry(id)`: Retry failed item

### usePerformanceMonitoring

Monitor Web Vitals and performance metrics.

```typescript
const metrics = usePerformanceMonitoring(enabled);
```

**Returns:**
- `metrics` (PerformanceMetric[]): Collected metrics
- `latestMetrics` (object): Latest LCP, FID, CLS, etc.
- `clearMetrics()`: Clear all metrics

### useAnalytics

Privacy-respecting local analytics.

```typescript
const analytics = useAnalytics();
```

**Returns:**
- `trackEvent(name, properties)`: Track custom event
- `trackPageView(path)`: Track page view
- `getAnalyticsSummary()`: Get analytics summary

### useFormValidation

Form state and validation management.

```typescript
const form = useFormValidation(initialValues, validationRules);
```

**Returns:**
- `values` (object): Current form values
- `errors` (object): Validation errors
- `touched` (object): Touched fields
- `isValid` (boolean): Form validity
- `handleChange(field, value)`: Update field
- `handleBlur(field)`: Mark field as touched
- `handleSubmit(callback)`: Handle form submission
- `reset()`: Reset form

### useKeyboardShortcuts

Register keyboard shortcuts.

```typescript
useKeyboardShortcuts(shortcuts, enabled);
```

**Parameters:**
- `shortcuts` (KeyboardShortcut[]): Shortcut definitions
- `enabled` (boolean): Enable shortcuts

### useMobileDetection

Detect device type and capabilities.

```typescript
const device = useMobileDetection();
```

**Returns:**
- `isMobile` (boolean): Is mobile device
- `isTablet` (boolean): Is tablet device
- `isDesktop` (boolean): Is desktop device
- `hasTouch` (boolean): Has touch support
- `orientation` (string): Device orientation
- `platform` (string): Operating system

### useTouchGestures

Handle touch gestures.

```typescript
const elementRef = useTouchGestures(options);
```

**Parameters:**
- `options`:
  - `onSwipe` (function): Swipe handler
  - `onPinch` (function): Pinch handler
  - `onDoubleTap` (function): Double-tap handler
  - `onLongPress` (function): Long-press handler

### useVirtualScroll

Virtual scrolling for large lists.

```typescript
const scroll = useVirtualScroll(itemCount, options);
```

**Parameters:**
- `itemCount` (number): Total items
- `options`:
  - `itemHeight` (number): Item height in pixels
  - `containerHeight` (number): Container height
  - `overscan` (number): Extra items to render

**Returns:**
- `virtualItems` (array): Visible items
- `totalHeight` (number): Total scroll height
- `scrollToIndex(index)`: Scroll to item

### useWebWorker

Offload computation to Web Workers.

```typescript
const worker = useWebWorker(workerFunction, options);
```

**Parameters:**
- `workerFunction` (function): Function to run in worker
- `options`:
  - `timeout` (number): Timeout in ms

**Returns:**
- `data` (any): Worker result
- `error` (Error | null): Worker error
- `isLoading` (boolean): Processing state
- `run(data)`: Execute worker
- `terminate()`: Stop worker

## Utils

### Performance

```typescript
import {
  debounce,
  throttle,
  memoize,
  optimizeImage,
  lazyWithRetry
} from './utils/performance';
```

**debounce(func, wait, immediate)**
Delay function execution until after wait time.

**throttle(func, limit)**
Limit function execution to once per time period.

**memoize(func, resolver?)**
Cache function results.

**optimizeImage(file, options)**
Compress and resize images.

**lazyWithRetry(componentImport, retries, interval)**
Lazy load component with retry logic.

### Validation

```typescript
import { validators, fileValidation } from './utils/validation';
```

**validators.required(message)**
Require non-empty value.

**validators.email(message)**
Validate email format.

**validators.minLength(min, message)**
Minimum length validation.

**validators.maxLength(max, message)**
Maximum length validation.

**validators.pattern(regex, message)**
RegEx pattern validation.

**fileValidation.validateImageFile(file)**
Validate image file with magic bytes.

### Database

```typescript
import { IndexedDBWrapper, dbSchema } from './utils/database';
```

**IndexedDBWrapper**
Complete IndexedDB wrapper with CRUD operations.

### i18n

```typescript
import {
  formatNumber,
  formatDate,
  formatFileSize,
  formatRelativeTime
} from './utils/i18n';
```

**formatNumber(value, language, options)**
Format number according to locale.

**formatDate(date, language, options)**
Format date according to locale.

**formatFileSize(bytes, language)**
Format bytes as human-readable file size.

**formatRelativeTime(date, language)**
Format as relative time (e.g., "2 days ago").

## Components

### ImageEditor

```tsx
<ImageEditor
  image={file}
  onExport={(blob) => handleExport(blob)}
  onClose={() => setEditing(false)}
/>
```

Full-screen image editor with filters and transformations.

### OnboardingTour

```tsx
<OnboardingTour
  step={currentStep}
  isActive={isActive}
  onNext={next}
  onPrevious={previous}
  onSkip={skip}
  isFirstStep={isFirstStep}
  isLastStep={isLastStep}
  progress={progress}
  currentStepIndex={index}
  totalSteps={total}
/>
```

Interactive tutorial overlay with tooltips.

### OnboardingChecklist

```tsx
<OnboardingChecklist
  steps={steps}
  completed={completed}
  currentStepId={currentId}
  onStepClick={(id) => goToStep(id)}
/>
```

Progress checklist for tutorials.

### ErrorBoundary

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

Catch and handle React errors gracefully.

### ThemeSwitcher

```tsx
<ThemeSwitcher />
```

Dropdown theme selector component.

### LanguageSwitcher

```tsx
<LanguageSwitcher />
```

Language selection dropdown.

### LoadingSkeleton

```tsx
<FileListSkeleton />
<GallerySkeleton />
<CropMapSkeleton />
```

Loading placeholders for better UX.

## Context

### ThemeContext

```tsx
import { useTheme } from './context/ThemeContext';

const { theme, setTheme, themes } = useTheme();
```

Theme management context.

### I18nContext

```tsx
import { useI18n, useTranslation } from './context/I18nContext';

const { language, setLanguage, t } = useI18n();
const { t } = useTranslation();
```

Internationalization context.

## Backend API

### POST /api/analyze

Analyze image and detect text regions.

**Request:**
```
Content-Type: multipart/form-data
Body: { image: File }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "boxes": [[x1, y1, x2, y2], ...]
  }
}
```

### POST /api/restore

Restore image by removing text.

**Request:**
```json
{
  "image": "base64...",
  "boxes": [[x1, y1, x2, y2], ...]
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

## Examples

### Basic Image Editing

```typescript
const editor = useImageEditor(imageFile);

// Adjust brightness
editor.setBrightness(120);

// Rotate 90 degrees
editor.rotate(90);

// Export
const blob = await editor.exportImage();
```

### Batch Processing

```typescript
const processor = useBatchProcessor(async (file) => {
  // Process file
}, { concurrency: 3 });

processor.addToQueue(files);
```

### Form Validation

```typescript
const form = useFormValidation(
  { email: '', name: '' },
  {
    email: [validators.required(), validators.email()],
    name: [validators.required(), validators.minLength(2)]
  }
);

form.handleChange('email', 'user@example.com');
form.handleSubmit(async (values) => {
  // Submit form
});
```

### Virtual Scrolling

```typescript
const { virtualItems, totalHeight } = useVirtualScroll(10000, {
  itemHeight: 50,
  containerHeight: 600
});

return (
  <div style={{ height: totalHeight }}>
    {virtualItems.map(item => (
      <div key={item.index} style={{ top: item.offsetTop }}>
        Item {item.index}
      </div>
    ))}
  </div>
);
```
