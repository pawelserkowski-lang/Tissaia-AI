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

export interface AnalyzeRequest {
  fileId: string;
  expectedCount: number | null;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: DetectedCrop[];
  error?: string;
  logs?: string[];
}

export interface RestoreRequest {
  base64Data: string;
  mimeType?: string;
}

export interface RestoreResponse {
  success: boolean;
  data?: string; // Base64 encoded restored image
  error?: string;
}
