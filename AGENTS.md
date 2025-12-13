# AI Agent Protocols

<div align="center">

![Agents](https://img.shields.io/badge/Agents-4%20Specialized-00ffa3?style=for-the-badge)
![Pipeline](https://img.shields.io/badge/Pipeline-Multi--Stage-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-red?style=for-the-badge)

**Documentation for AI agents, automation protocols, and workflow guidelines.**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Agent Architecture](#agent-architecture)
- [Pipeline Agents](#pipeline-agents)
- [Agent Communication](#agent-communication)
- [Automation Protocols](#automation-protocols)
- [Error Handling](#error-handling)
- [Logging Standards](#logging-standards)
- [Development Guidelines](#development-guidelines)

---

## Overview

Tissaia AI uses a **multi-agent architecture** where specialized AI agents work together in a coordinated pipeline to process, analyze, and restore photographs. Each agent has a specific responsibility and communicates through well-defined interfaces.

### Agent Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | Each agent handles one specific task |
| **Loose Coupling** | Agents communicate through defined interfaces |
| **High Cohesion** | Related functionality grouped within agents |
| **Stateless Operations** | Agents don't maintain state between operations |
| **Observable Actions** | All agent actions are logged and trackable |

---

## Agent Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENT ORCHESTRATION LAYER                          │
│                         (hooks/useFileScanner.ts)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AGENT COORDINATOR                             │   │
│  │  - Manages agent lifecycle                                           │   │
│  │  - Routes data between agents                                        │   │
│  │  - Handles errors and retries                                        │   │
│  │  - Reports progress to UI                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         │                          │                          │            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐            ┌─────────────┐            ┌─────────────┐     │
│  │   Agent 1   │            │   Agent 2   │            │   Agent 3   │     │
│  │  Ingestion  │───────────▶│  Detection  │───────────▶│ Smart Crop  │     │
│  └─────────────┘            └─────────────┘            └─────────────┘     │
│         │                                                      │            │
│         │                                                      ▼            │
│         │                                               ┌─────────────┐     │
│         │                                               │   Agent 4   │     │
│         │                                               │   Alchemy   │     │
│         │                                               └─────────────┘     │
│         │                                                      │            │
│         └──────────────────────────────────────────────────────┘            │
│                                    │                                        │
│                                    ▼                                        │
│                          ┌─────────────────┐                                │
│                          │  LOGGING LAYER  │                                │
│                          │ (LogContext.tsx)│                                │
│                          └─────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Interface

All agents implement a common interface for consistency:

```typescript
interface Agent<TInput, TOutput> {
  /**
   * Agent identifier
   */
  readonly name: string;

  /**
   * Agent version
   */
  readonly version: string;

  /**
   * Process input and produce output
   */
  process(input: TInput, options?: AgentOptions): Promise<TOutput>;

  /**
   * Validate input before processing
   */
  validate(input: TInput): ValidationResult;

  /**
   * Handle errors during processing
   */
  handleError(error: Error): AgentError;
}

interface AgentOptions {
  timeout?: number;
  retries?: number;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface AgentError {
  code: string;
  message: string;
  recoverable: boolean;
  retryAfter?: number;
}
```

---

## Pipeline Agents

### Agent 1: Ingestion Heuristics

**Purpose:** Initial file analysis and preprocessing

**Location:** `hooks/useFileScanner.ts:simulateFastScan()`

```typescript
interface IngestionInput {
  file: File;
  preview: string;  // ObjectURL
}

interface IngestionOutput {
  thumbnail: string;           // Base64 thumbnail
  estimatedCount: number;      // Estimated photo count
  boundingBoxProposals: Box[]; // Initial proposals
  metadata: ImageMetadata;     // EXIF data, dimensions
}
```

**Processing Steps:**

```
1. LOAD FILE
   └── Read file as ArrayBuffer
   └── Validate file type (magic bytes)
   └── Extract EXIF metadata

2. GENERATE THUMBNAIL
   └── Create off-screen canvas
   └── Resize to max 300px dimension
   └── Convert to base64

3. EDGE DETECTION
   └── Convert to grayscale
   └── Apply Sobel operator
   └── Detect edges

4. HOUGH TRANSFORM
   └── Find line segments
   └── Identify potential boundaries
   └── Group into regions

5. COUNT ESTIMATION
   └── Analyze detected regions
   └── Apply heuristics
   └── Return estimated count
```

**Configuration:**

```typescript
const INGESTION_CONFIG = {
  thumbnailMaxSize: 300,
  edgeThreshold: 50,
  minRegionArea: 0.05,  // 5% of total area
  maxRegions: 50,
};
```

---

### Agent 2: Neural Detection

**Purpose:** AI-powered photo segmentation using vision models

**Location:** `services/geminiService.ts:analyzeImage()`

```typescript
interface DetectionInput {
  imageData: string;           // Base64 image
  estimatedCount: number;      // From Agent 1
  previousAttempts?: number;   // Retry count
}

interface DetectionOutput {
  boxes: BoundingBox[];        // Detected regions
  confidence: number[];        // Confidence scores
  rotations: number[];         // Rotation angles
}

interface BoundingBox {
  x: number;      // Normalized 0-1000
  y: number;      // Normalized 0-1000
  width: number;  // Normalized 0-1000
  height: number; // Normalized 0-1000
}
```

**AI Model Configuration:**

```typescript
const DETECTION_CONFIG = {
  model: 'gemini-3-pro-preview',
  temperature: 0.1,           // Low for consistency
  maxTokens: 4096,
  systemPrompt: `You are an expert photo analyzer...`,
};
```

**Prompt Engineering:**

```typescript
const createDetectionPrompt = (estimatedCount: number): string => `
Analyze this flatbed scanner image containing multiple photographs.

Expected photo count: ${estimatedCount} (use as guidance, not constraint)

Instructions:
1. Identify each individual photograph in the scan
2. Return bounding boxes in normalized coordinates (0-1000 scale)
3. Include confidence scores (0.0-1.0) for each detection
4. Determine rotation angles (0, 90, 180, 270 degrees)

Return JSON format:
{
  "photos": [
    {
      "box": { "x": 0, "y": 0, "width": 500, "height": 400 },
      "confidence": 0.95,
      "rotation": 0
    }
  ]
}

Critical:
- Coordinates must be within 0-1000 range
- Do not overlap bounding boxes
- Include ALL visible photographs
`;
```

**Retry Strategy:**

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  adjustPromptOnRetry: true,
};

// Retry adjustments
const getRetryPrompt = (attempt: number, mismatchInfo: string): string => {
  if (attempt === 1) {
    return 'Look more carefully at the edges of the image.';
  }
  if (attempt === 2) {
    return 'Consider photos that may be partially visible or overlapping.';
  }
  return 'Provide best estimate regardless of confidence.';
};
```

---

### Agent 3: Smart Crop

**Purpose:** Intelligent cropping with hygiene margins

**Location:** `utils/image/processing.ts:cropImage()`

```typescript
interface CropInput {
  source: HTMLImageElement;
  box: BoundingBox;
  rotation: number;
}

interface CropOutput {
  croppedBlob: Blob;
  dimensions: { width: number; height: number };
  appliedMargin: number;
}
```

**Cropping Algorithm:**

```typescript
const cropImage = async (
  source: HTMLImageElement,
  box: BoundingBox,
  options: CropOptions
): Promise<Blob> => {
  // 1. Convert normalized coords to pixels
  const pixelBox = normalizeToPixels(box, source);

  // 2. Apply hygiene margin (10% inward cut)
  const marginedBox = applyMargin(pixelBox, options.marginPercent);

  // 3. Create canvas with rotation
  const canvas = createRotatedCanvas(marginedBox, options.rotation);

  // 4. Draw cropped region
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, ...getDrawParams(marginedBox));

  // 5. Export as PNG
  return canvasToBlob(canvas, 'image/png');
};
```

**Margin Calculation:**

```
┌────────────────────────────────────────┐
│                                        │
│   ┌────────────────────────────────┐   │
│   │      10% margin (removed)      │   │
│   │   ┌────────────────────────┐   │   │
│   │   │                        │   │   │
│   │   │    Actual content      │   │   │
│   │   │    (80% of original)   │   │   │
│   │   │                        │   │   │
│   │   └────────────────────────┘   │   │
│   │      10% margin (removed)      │   │
│   └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘

Final dimensions:
  width  = originalWidth × 0.8
  height = originalHeight × 0.8
```

**Configuration:**

```typescript
const CROP_CONFIG = {
  marginPercent: 0.10,        // 10% margin
  outputFormat: 'image/png',
  quality: 1.0,               // Lossless for PNG
  maxDimension: 4096,
  antiAliasing: true,
};
```

---

### Agent 4: Alchemy Restoration

**Purpose:** Generative AI restoration of photographs

**Location:** `services/geminiService.ts:restoreImage()`

```typescript
interface RestorationInput {
  croppedImage: string;       // Base64 cropped image
  options: RestorationOptions;
}

interface RestorationOutput {
  restoredImage: string;      // Base64 restored image
  appliedOperations: string[];
  metadata: RestorationMetadata;
}

interface RestorationOptions {
  outpaint: boolean;          // Regenerate borders
  denoising: boolean;         // Remove scratches/dust
  enhance: boolean;           // Sharpen details
  colorGrade: ColorProfile;   // Color grading profile
}

type ColorProfile = 'kodak-portra-400' | 'fuji-velvia' | 'natural' | 'none';
```

**Restoration Pipeline:**

```
INPUT: Cropped Image (80% of original)
         │
         ▼
┌─────────────────────────────────────┐
│  1. OUTPAINTING                     │
│  - Regenerate the 10% margins       │
│  - Extend image back to 100%        │
│  - Fill with contextual content     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  2. HYGIENE                         │
│  - Remove dust and scratches        │
│  - Fix torn edges                   │
│  - Repair water damage              │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  3. ENHANCEMENT                     │
│  - Sharpen faces and details        │
│  - Improve contrast                 │
│  - Reduce noise                     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  4. COLOR GRADING                   │
│  - Apply vintage color profile      │
│  - Adjust saturation                │
│  - Balance tones                    │
└─────────────────────────────────────┘
         │
         ▼
OUTPUT: Restored Image (100%, enhanced)
```

**Restoration Prompt:**

```typescript
const createRestorationPrompt = (options: RestorationOptions): string => `
You are a professional photo restoration expert.

Restore this vintage photograph following these instructions:

${options.outpaint ? `
OUTPAINTING:
- The image has been cropped 10% on all sides
- Regenerate the missing border content
- Extend naturally based on context
` : ''}

${options.denoising ? `
HYGIENE:
- Remove dust spots, scratches, and artifacts
- Repair any torn or damaged areas
- Clean up discoloration
` : ''}

${options.enhance ? `
ENHANCEMENT:
- Sharpen faces and important details
- Improve overall contrast and clarity
- Reduce noise while preserving detail
` : ''}

${options.colorGrade !== 'none' ? `
COLOR GRADING:
- Apply "${options.colorGrade}" film profile
- Enhance vintage aesthetic
- Balance warm and cool tones
` : ''}

Output requirements:
- Maintain original aspect ratio
- Preserve authentic vintage character
- Return high-quality PNG image
`;
```

---

## Agent Communication

### Message Protocol

Agents communicate through structured messages:

```typescript
interface AgentMessage<T> {
  id: string;                 // Unique message ID
  timestamp: Date;            // When sent
  source: string;             // Source agent name
  target: string;             // Target agent name
  type: MessageType;          // Message type
  payload: T;                 // Message data
  metadata?: MessageMetadata;
}

type MessageType =
  | 'PROCESS'                 // Process request
  | 'RESULT'                  // Processing result
  | 'ERROR'                   // Error occurred
  | 'PROGRESS'                // Progress update
  | 'CANCEL';                 // Cancel request

interface MessageMetadata {
  correlationId: string;      // Track related messages
  priority: 'high' | 'normal' | 'low';
  timeout?: number;
}
```

### Data Flow

```
┌───────────┐                  ┌───────────┐
│  Agent 1  │ ────RESULT────▶ │  Agent 2  │
└───────────┘                  └───────────┘
      │                              │
      │ PROGRESS                     │ PROGRESS
      ▼                              ▼
┌─────────────────────────────────────────────┐
│              ORCHESTRATOR                    │
│         (useFileScanner hook)               │
└─────────────────────────────────────────────┘
      │                              │
      │ UPDATE                       │ UPDATE
      ▼                              ▼
┌─────────────────────────────────────────────┐
│                  UI STATE                    │
│               (App.tsx)                      │
└─────────────────────────────────────────────┘
```

---

## Automation Protocols

### Workflow Automation

For automated systems and AI assistants (like Jules), follow these protocols:

#### 1. Mandatory Submission Protocol

```
At the conclusion of every task:
1. Stage all changed files
2. Commit with descriptive message
3. Push to remote repository
4. Create Pull Request if appropriate
```

#### 2. Code Review Protocol

```
Before submitting code:
1. Run all tests
2. Check TypeScript compilation
3. Verify no console errors
4. Ensure documentation is updated
```

#### 3. Error Handling Protocol

```
When errors occur:
1. Log error with full context
2. Attempt recovery if possible
3. Report to user if unrecoverable
4. Never silently fail
```

### Batch Processing

```typescript
interface BatchConfig {
  concurrency: number;        // Max parallel operations
  retryPolicy: RetryPolicy;
  onItemComplete: (item: BatchItem) => void;
  onBatchComplete: (results: BatchResult[]) => void;
}

const processBatch = async (
  items: BatchItem[],
  processor: Agent,
  config: BatchConfig
): Promise<BatchResult[]> => {
  const queue = new PQueue({ concurrency: config.concurrency });

  const results = await Promise.all(
    items.map(item => queue.add(() => processWithRetry(item, processor)))
  );

  config.onBatchComplete(results);
  return results;
};
```

---

## Error Handling

### Error Categories

| Category | Code | Description | Recovery |
|----------|------|-------------|----------|
| **VALIDATION** | `E1xx` | Input validation failed | Reject with message |
| **PROCESSING** | `E2xx` | Processing failed | Retry with backoff |
| **NETWORK** | `E3xx` | Network error | Retry with backoff |
| **AI_SERVICE** | `E4xx` | AI service error | Retry or fallback |
| **RESOURCE** | `E5xx` | Resource exhausted | Wait and retry |
| **INTERNAL** | `E9xx` | Internal error | Report and fail |

### Error Handling Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           ERROR HANDLING FLOW                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Error Occurs                                                           │
│        │                                                                 │
│        ▼                                                                 │
│   ┌──────────────┐    Yes    ┌──────────────┐                           │
│   │ Recoverable? │──────────▶│ Retry Logic  │                           │
│   └──────────────┘           └──────────────┘                           │
│        │ No                         │                                    │
│        │                            │ Max retries?                       │
│        ▼                            ▼                                    │
│   ┌──────────────┐           ┌──────────────┐                           │
│   │  Log Error   │           │   Fallback   │                           │
│   └──────────────┘           └──────────────┘                           │
│        │                            │                                    │
│        ▼                            │ No fallback?                       │
│   ┌──────────────┐                  ▼                                    │
│   │ Report to UI │◀─────────────────┘                                    │
│   └──────────────┘                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Retry Strategy

```typescript
const createRetryStrategy = (config: RetryConfig): RetryStrategy => ({
  shouldRetry: (error: Error, attempt: number): boolean => {
    if (attempt >= config.maxRetries) return false;
    if (!isRecoverable(error)) return false;
    return true;
  },

  getDelay: (attempt: number): number => {
    const delay = config.baseDelay * Math.pow(config.multiplier, attempt);
    const jitter = delay * 0.1 * Math.random();
    return Math.min(delay + jitter, config.maxDelay);
  },

  onRetry: (error: Error, attempt: number): void => {
    log('debug', `Retry attempt ${attempt}: ${error.message}`);
  },
});

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  multiplier: 2,
  maxDelay: 10000,
};
```

---

## Logging Standards

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| **DEBUG** | Detailed debugging info | `Agent 2 received 5 bounding boxes` |
| **INFO** | General information | `Processing file: scan_001.jpg` |
| **WARN** | Warning conditions | `Low confidence detection: 0.65` |
| **ERROR** | Error conditions | `API timeout after 30s` |

### Log Format

```typescript
interface LogEntry {
  id: string;                 // Unique ID
  timestamp: Date;            // ISO timestamp
  level: LogLevel;            // debug/info/warn/error
  agent: string;              // Agent name
  message: string;            // Human-readable message
  context?: {                 // Additional context
    fileId?: string;
    cropIndex?: number;
    duration?: number;
    [key: string]: unknown;
  };
}

// Example log entries
log('info', 'Starting detection', { agent: 'Detection', fileId: 'abc123' });
log('debug', 'Bounding boxes received', { agent: 'Detection', count: 5 });
log('error', 'API timeout', { agent: 'Detection', duration: 30000 });
```

### Structured Logging

```typescript
const createAgentLogger = (agentName: string) => ({
  debug: (msg: string, ctx?: object) =>
    log('debug', msg, { agent: agentName, ...ctx }),
  info: (msg: string, ctx?: object) =>
    log('info', msg, { agent: agentName, ...ctx }),
  warn: (msg: string, ctx?: object) =>
    log('warn', msg, { agent: agentName, ...ctx }),
  error: (msg: string, ctx?: object) =>
    log('error', msg, { agent: agentName, ...ctx }),
});

// Usage
const logger = createAgentLogger('Detection');
logger.info('Processing started', { fileId: '123' });
logger.debug('AI model response received', { boxes: 5 });
```

---

## Development Guidelines

### Adding New Agents

#### 1. Define the Interface

```typescript
// types/agents/myAgent.types.ts
export interface MyAgentInput {
  // Define input types
}

export interface MyAgentOutput {
  // Define output types
}
```

#### 2. Implement the Agent

```typescript
// agents/myAgent.ts
import { Agent, AgentOptions } from '../types/agent.types';

export const myAgent: Agent<MyAgentInput, MyAgentOutput> = {
  name: 'MyAgent',
  version: '1.0.0',

  async process(input, options) {
    // Implementation
  },

  validate(input) {
    // Validation logic
  },

  handleError(error) {
    // Error handling
  },
};
```

#### 3. Register in Pipeline

```typescript
// config/pipeline.config.ts
export const PIPELINE_STAGES = [
  // ... existing stages
  {
    name: 'MyAgent',
    agent: myAgent,
    position: 5,
    optional: false,
  },
];
```

#### 4. Update Logging

```typescript
// Add to LogContext.tsx
const AGENT_LOGS = {
  // ... existing agents
  MyAgent: [],
};
```

### Testing Agents

```typescript
// tests/agents/myAgent.test.ts
import { describe, it, expect } from 'vitest';
import { myAgent } from '../../agents/myAgent';

describe('MyAgent', () => {
  it('should process valid input', async () => {
    const input = { /* valid input */ };
    const result = await myAgent.process(input);
    expect(result).toBeDefined();
  });

  it('should validate input correctly', () => {
    const invalid = { /* invalid input */ };
    const result = myAgent.validate(invalid);
    expect(result.valid).toBe(false);
  });

  it('should handle errors gracefully', () => {
    const error = new Error('Test error');
    const result = myAgent.handleError(error);
    expect(result.recoverable).toBeDefined();
  });
});
```

### Code Style

```typescript
// Use descriptive names
const analyzeImageWithGemini = async (...) // Good
const doIt = async (...) // Bad

// Document complex logic
/**
 * Calculates optimal bounding box margins based on image dimensions
 * and detected content density.
 *
 * @param box - Original bounding box
 * @param imageDimensions - Full image dimensions
 * @returns Adjusted bounding box with margins
 */
const calculateMargins = (box: BoundingBox, imageDimensions: Dimensions) => {
  // Implementation with comments explaining complex parts
};

// Use TypeScript strictly
function process(input: MyInput): Promise<MyOutput> // Good
function process(input: any): Promise<any> // Bad
```

---

## References

- [Architecture Documentation](architecture.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)
- [Google Gemini API](https://ai.google.dev/docs)

---

<div align="center">

**[Back to README](README.md)** | **[Architecture](architecture.md)** | **[API Docs](docs/API_DOCUMENTATION.md)**

</div>
