
export enum ViewMode {
  FILES = 'FILES',
  CROP_MAP = 'CROP_MAP',
  MAGIC_SPELL = 'MAGIC_SPELL',
  LOGS = 'LOGS'
}

export enum ScanStatus {
  UPLOADING = 'INGEST_RAW',
  PRE_ANALYZING = 'EDGE_HOUGH (PRE-A)', // Phase PRE-A: Edge Detection & Hough
  PENDING_VERIFICATION = 'OPERATOR_VALIDATION', // Phase PRE-A: Human Check
  DETECTING = 'YOLO_INFERENCE (PHASE A)', // Phase A: YOLO / EfficientDet Loop
  CROPPED = 'SMART_CROP_READY', // Phase A: Ready for Restoration
  RESTORING = 'ALCHEMY_IN_PROGRESS', // Phase B: In Progress
  RESTORED = 'ALCHEMY_COMPLETE', // Phase B & POST Complete
  ERROR = 'SYSTEM_FAILURE'
}

// --- EXISTING UI INTERFACES ---

export interface DetectedCrop {
  id: string;
  label: string;
  ymin: number; // Normalized 0-1000
  xmin: number; // Normalized 0-1000
  ymax: number; // Normalized 0-1000
  xmax: number; // Normalized 0-1000
  rotation: number; // 0, 90, 180, 270
  confidence: number;
}

export interface AIResponseItem {
  label: string;
  confidence: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  rotation: number;
}

export interface ProcessedPhoto {
  id: string;
  scanId: string;
  filename: string; 
  originalCropUrl: string;
  restoredUrl: string;
  filterUsed: string;
  date: string;
}

export interface ScanFile {
  id: string;
  filename: string;
  uploadDate: string;
  size: string;
  status: ScanStatus;
  expectedCount: number | null; // Manifest Count
  detectedCount: number;
  thumbnailUrl?: string;
  uploadProgress?: number;
  rawFile?: File; // Store raw file for AI processing
  aiData?: DetectedCrop[]; // Store AI results
  processedResults?: ProcessedPhoto[]; // Store the generated/restored artifacts (1 to N)
  errorMessage?: string;
  selected?: boolean; // UI state for selection
}

export interface SystemLog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    message: string;
    module: string;
}

// ==========================================
// Tissaia - Forensic Restoration Engine
// Type Definitions v2.0
// ==========================================

export type MimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';
export type ModelName = 'gemini-3-pro-preview' | 'gemini-3-pro-image-preview';
export type ScanLifecycleState = 'UPLOADING' | 'SCANNED' | 'CROPPING' | 'RESTORING' | 'DONE';

// --- Shared Configurations ---

export interface ModelConfig {
  model_name: ModelName;
  temperature: number;
  top_k?: number;
  max_output_tokens?: number;
  safety_settings?: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE';
}

export interface UiFeedback {
  loading_message?: string;
  success_message?: string;
  loading_states?: string[];
}

// --- Stage 1: Ingestion (Local Heuristics) ---

export interface HeuristicsEngine {
  method: 'Analiza Krawędzi i Transformata Hougha';
  library: 'OpenCV.js (WASM)';
  parameters: {
    gaussian_blur_kernel: number;
    canny_threshold_1: number;
    canny_threshold_2: number;
    hough_min_line_length: number;
    hough_max_line_gap: number;
  };
}

export interface StageIngestionConfig {
  name: string;
  description: string;
  timeout_ms: number;
  config: {
    heuristics_engine: HeuristicsEngine;
    thumbnail_generation: {
      max_width: number;
      quality: number;
      format: MimeType;
    };
  };
  ui_feedback: UiFeedback;
}

// --- Stage 2: Detection (Vision AI) ---

export interface DetectionPromptEngineering {
  system_role: string;
  task_directive: string;
  output_format_enforcement: string;
  strategy_fallback: string;
}

export interface StageDetectionConfig {
  name: string;
  description: string;
  service_endpoint: string; // e.g. "geminiService.analyzeImage"
  model_config: ModelConfig;
  prompt_engineering: DetectionPromptEngineering;
  error_handling: {
    retry_count: number;
    fallback_action: 'SWITCH_TO_MANUAL_CROP_UI' | 'ABORT';
  };
}

// --- Stage 3: Smart Crop (Client-Side) ---

export interface HygieneCutRule {
  enabled: boolean;
  margin_percentage: number; // 0.10 for 10%
  reason: string;
}

export interface StageSmartCropConfig {
  name: string;
  description: string;
  execution_context: 'Browser Main Thread' | 'WebWorker';
  logic_rules: {
    coordinate_mapping: string;
    hygiene_cut: HygieneCutRule;
    rotation_handling: {
      auto_rotate: boolean;
      background_fill: string;
    };
    output_format: {
      mime: MimeType;
      quality: number; // 0.0 - 1.0
      encoding: 'base64';
    };
  };
}

// --- Stage 4: Alchemy (Restoration AI) ---

export interface PromptStep {
  id: 'OUTPAINTING' | 'HYGIENE' | 'DETAIL' | 'COLOR_GRADING';
  instruction: string;
  weight?: string; // "High", "Medium", etc.
  negative_prompt?: string;
  constraint?: string;
  reference?: string;
}

export interface StageAlchemyConfig {
  name: string;
  description: string;
  service_endpoint: string;
  cost_estimation: string;
  model_config: ModelConfig;
  prompt_directives: {
    structure: {
      role: string;
      input_context: string;
      steps: PromptStep[];
    };
  };
  ui_feedback: UiFeedback;
}

// --- ROOT PIPELINE CONFIGURATION ---

export interface PipelineStages {
  STAGE_1_INGESTION: StageIngestionConfig;
  STAGE_2_DETECTION: StageDetectionConfig;
  STAGE_3_SMART_CROP: StageSmartCropConfig;
  STAGE_4_ALCHEMY: StageAlchemyConfig;
}

export interface GlobalConstraints {
  max_concurrent_restorations: number;
  max_input_file_size_mb: number;
  supported_mime_types: MimeType[];
  security_sanitization: boolean;
}

export interface DataContractScanFile {
  id: string; // UUID
  lifecycle_state: ScanLifecycleState;
  metrics: {
    original_resolution: string; // "WxH"
    processing_time_ms: number;
  };
}

/**
 * Główny interfejs konfiguracyjny systemu Tissaia.
 * Importuj ten typ w plikach konfiguracyjnych.
 */
export interface PipelineConfiguration {
  pipeline_configuration: {
    meta: {
      id: string;
      revision: string;
      last_updated: string;
      environment: 'production' | 'development' | 'staging';
    };
    global_constraints: GlobalConstraints;
    stages: PipelineStages;
    data_contracts: {
      ScanFile: DataContractScanFile;
    };
  };
}
