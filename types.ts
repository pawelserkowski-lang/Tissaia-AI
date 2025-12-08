export enum ViewMode {
  FILES = 'FILES',
  CROP_MAP = 'CROP_MAP',
  MAGIC_SPELL = 'MAGIC_SPELL',
  LOGS = 'LOGS'
}

export enum ScanStatus {
  UPLOADING = 'WGRYWANIE',
  PENDING_VERIFICATION = 'WERYFIKACJA', // Phase Pre-A
  DETECTING = 'TOTAL WAR (L1-L4)', // Phase B
  CROPPED = 'WYCIĘTE', // Phase C
  RESTORED = 'GOTOWE',
  ERROR = 'BŁĄD'
}

export interface DetectedCrop {
  id: string;
  label: string;
  ymin: number; // Normalized 0-1000
  xmin: number; // Normalized 0-1000
  ymax: number; // Normalized 0-1000
  xmax: number; // Normalized 0-1000
  confidence: number;
}

export interface AIResponseItem {
  label: string;
  confidence: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface ScanFile {
  id: string;
  filename: string;
  uploadDate: string;
  size: string;
  status: ScanStatus;
  expectedCount: number | null; // Ground Truth from Phase Pre-A
  detectedCount: number;
  thumbnailUrl?: string;
  uploadProgress?: number;
  rawFile?: File; // Store raw file for AI processing
  aiData?: DetectedCrop[]; // Store AI results
  errorMessage?: string;
  selected?: boolean; // UI state for selection
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

export interface SystemLog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    message: string;
    module: string;
}