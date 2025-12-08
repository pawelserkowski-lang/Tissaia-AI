export enum ViewMode {
  FILES = 'FILES',
  CROP_MAP = 'CROP_MAP',
  MAGIC_SPELL = 'MAGIC_SPELL'
}

export enum ScanStatus {
  UPLOADING = 'UPLOADING',
  DETECTING = 'DETECTING',
  CROPPED = 'CROPPED',
  RESTORED = 'RESTORED',
  ERROR = 'ERROR'
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
  detectedCount: number;
  thumbnailUrl?: string;
  uploadProgress?: number;
  rawFile?: File; // Store raw file for AI processing
  aiData?: DetectedCrop[]; // Store AI results
  errorMessage?: string;
}

export interface ProcessedPhoto {
  id: string;
  scanId: string;
  originalCropUrl: string;
  restoredUrl: string;
  filterUsed: string;
  date: string;
}