import { Router, Request, Response } from 'express';
import { upload } from '../services/storage.js';
import { analyzeImage } from '../services/gemini.js';
import logger from '../services/logger.js';
import type { AnalyzeResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/analyze
 * Analyzes an uploaded image and detects photos within it
 *
 * Request:
 * - multipart/form-data with:
 *   - file: The image file to analyze
 *   - fileId: Unique identifier for the file
 *   - expectedCount: (optional) Expected number of photos in the image
 *
 * Response:
 * - 200: { success: true, data: DetectedCrop[], logs: string[] }
 * - 400: { success: false, error: string }
 * - 500: { success: false, error: string }
 */
router.post('/analyze', upload.single('file'), async (req: Request, res: Response) => {
  const logs: string[] = [];

  try {
    // Validate request
    if (!req.file) {
      logger.warn('Analyze request missing file');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      } as AnalyzeResponse);
    }

    const { fileId, expectedCount } = req.body;

    if (!fileId) {
      logger.warn('Analyze request missing fileId');
      return res.status(400).json({
        success: false,
        error: 'fileId is required',
      } as AnalyzeResponse);
    }

    const expectedCountNum = expectedCount ? parseInt(expectedCount, 10) : null;

    logger.info('Starting image analysis', {
      fileId,
      filename: req.file.originalname,
      expectedCount: expectedCountNum,
    });

    logs.push(`[Backend] Starting analysis for file: ${req.file.originalname}`);
    logs.push(`[Backend] Expected count: ${expectedCountNum ?? 'auto-detect'}`);

    // Analyze the image
    const detectedCrops = await analyzeImage(
      req.file.path,
      fileId,
      expectedCountNum,
      logs
    );

    logger.info('Image analysis completed', {
      fileId,
      detectedCount: detectedCrops.length,
    });

    logs.push(`[Backend] Analysis complete. Detected ${detectedCrops.length} objects.`);

    return res.status(200).json({
      success: true,
      data: detectedCrops,
      logs,
    } as AnalyzeResponse);

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Image analysis failed', { error: errMsg });
    logs.push(`[Backend ERROR] ${errMsg}`);

    return res.status(500).json({
      success: false,
      error: errMsg,
      logs,
    } as AnalyzeResponse);
  }
});

export default router;
