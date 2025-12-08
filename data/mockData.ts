import { ScanFile, ScanStatus, DetectedCrop, ProcessedPhoto } from '../types';

export const INITIAL_MOCK_FILES: ScanFile[] = [
  { id: '1', filename: 'Family_Album_001.jpg', uploadDate: '2023-10-27', size: '24.5 MB', status: ScanStatus.RESTORED, detectedCount: 4, expectedCount: 4 },
  { id: '2', filename: 'Vacation_1998_Scan.png', uploadDate: '2023-10-28', size: '18.2 MB', status: ScanStatus.CROPPED, detectedCount: 2, expectedCount: 2 },
  { id: '3', filename: 'Unknown_Box_04.tiff', uploadDate: '2023-10-29', size: '42.1 MB', status: ScanStatus.DETECTING, detectedCount: 0, expectedCount: 5 },
];

export const MOCK_CROPS: DetectedCrop[] = [
    { id: 'c1', label: 'Subject A', ymin: 50, xmin: 50, ymax: 350, xmax: 250, confidence: 0.98 },
    { id: 'c2', label: 'Artifact', ymin: 80, xmin: 300, ymax: 260, xmax: 520, confidence: 0.92 },
    { id: 'c3', label: 'Background Text', ymin: 400, xmin: 100, ymax: 650, xmax: 350, confidence: 0.89 },
];

export const MOCK_RESULTS: ProcessedPhoto[] = [
    { id: 'res-101', scanId: '1', filename: 'Mock_01.jpg', originalCropUrl: '', restoredUrl: '', filterUsed: 'BW_RESTORE', date: 'Oct 27, 10:42 AM' },
    { id: 'res-102', scanId: '1', filename: 'Mock_02.jpg', originalCropUrl: '', restoredUrl: '', filterUsed: 'COLORIZE_V3', date: 'Oct 27, 10:43 AM' },
    { id: 'res-103', scanId: '1', filename: 'Mock_03.jpg', originalCropUrl: '', restoredUrl: '', filterUsed: 'DENOISE_PRO', date: 'Oct 27, 10:45 AM' },
    { id: 'res-104', scanId: '1', filename: 'Mock_04.jpg', originalCropUrl: '', restoredUrl: '', filterUsed: 'FACE_ENHANCE', date: 'Oct 27, 10:45 AM' },
];