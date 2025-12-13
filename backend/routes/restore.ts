import { Router, Request, Response } from 'express';
import { restoreImage } from '../services/gemini.js';
import logger from '../services/logger.js';
import type { RestoreRequest, RestoreResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/restore
 * Restores/enhances an image using AI
 *
 * Request body (JSON):
 * {
 *   base64Data: string,   // Base64 encoded image data (with or without data URI prefix)
 *   mimeType?: string     // Optional mime type (default: image/png)
 * }
 *
 * Response:
 * - 200: { success: true, data: string } // Base64 encoded restored image with data URI prefix
 * - 400: { success: false, error: string }
 * - 500: { success: false, error: string }
 */
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { base64Data, mimeType = 'image/png' } = req.body as RestoreRequest;

    // Validate request
    if (!base64Data || typeof base64Data !== 'string') {
      logger.warn('Restore request missing or invalid base64Data');
      return res.status(400).json({
        success: false,
        error: 'base64Data is required and must be a string',
      } as RestoreResponse);
    }

    logger.info('Starting image restoration', {
      mimeType,
      dataLength: base64Data.length,
    });

    // Restore the image
    const restoredImage = await restoreImage(base64Data, mimeType);

    logger.info('Image restoration completed', {
      resultLength: restoredImage.length,
    });

    return res.status(200).json({
      success: true,
      data: restoredImage,
    } as RestoreResponse);

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Image restoration failed', { error: errMsg });

    return res.status(500).json({
      success: false,
      error: errMsg,
    } as RestoreResponse);
  }
});

export default router;
