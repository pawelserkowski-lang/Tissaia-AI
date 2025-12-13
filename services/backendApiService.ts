/**
 * Backend API Service
 * Provides methods to interact with the backend API server
 */

import type { DetectedCrop } from '../types';

// Get API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Analyze image using backend API
 */
export const analyzeImageViaBackend = async (
  file: File,
  fileId: string,
  expectedCount: number | null,
  logCallback?: (msg: string) => void
): Promise<DetectedCrop[]> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileId', fileId);
    if (expectedCount !== null) {
      formData.append('expectedCount', expectedCount.toString());
    }

    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Log backend messages
    if (result.logs && logCallback) {
      result.logs.forEach((log: string) => logCallback(log));
    }

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    return result.data as DetectedCrop[];
  } catch (error) {
    if (logCallback) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logCallback(`[Backend API Error] ${errMsg}`);
    }
    throw error;
  }
};

/**
 * Restore image using backend API
 */
export const restoreImageViaBackend = async (
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/api/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Restoration failed');
    }

    return result.data as string;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Backend API] Restore error:', errMsg);
    throw error;
  }
};

/**
 * Check if backend API is available
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
};
