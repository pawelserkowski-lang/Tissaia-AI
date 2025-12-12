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

export interface SystemLog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
    message: string;
    module: string;
}
