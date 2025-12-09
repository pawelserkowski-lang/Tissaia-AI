
export enum ViewMode {
  FILES = 'FILES',
  CROP_MAP = 'CROP_MAP',
  MAGIC_SPELL = 'MAGIC_SPELL',
  LOGS = 'LOGS'
}

export enum ScanStatus {
  UPLOADING = 'INGEST_RAW',
  PRE_ANALYZING = 'AUTO_DETECT (PRE-A)', // Phase PRE-A: Watershed Level 1
  PENDING_VERIFICATION = 'OPERATOR_VALIDATION', // Phase PRE-A: Human Check
  DETECTING = 'TOTAL WAR (PHASE A)', // Phase A: Gemini Loop
  CROPPED = 'SMART_CROP_READY', // Phase A: Ready for Restoration
  RESTORED = 'ALCHEMY_COMPLETE', // Phase B & POST Complete
  ERROR = 'SYSTEM_FAILURE'
}

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