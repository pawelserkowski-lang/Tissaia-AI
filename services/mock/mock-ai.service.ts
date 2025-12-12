import { DetectedCrop } from '../../types';
import { generateGridLayout } from '../../utils/grid/layout-calculator';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock AI detection service for simulation mode.
 * Used when API key is not available.
 */
export const mockAnalyzeImage = async (fileId: string, expectedCount: number | null): Promise<DetectedCrop[]> => {
    await wait(2000); // Simulate network latency
    const count = (expectedCount !== null) ? expectedCount : Math.floor(Math.random() * 4) + 1;

    return generateGridLayout({
        count,
        fileId: `${fileId}_sim`,
        labelPrefix: 'SIM_OBJ',
        confidenceRange: { min: 0.85, max: 0.99 },
        sizeVariation: { min: 0.85, max: 1.0 }
    });
};

/**
 * Mock image restoration service for simulation mode.
 * Used when API key is not available.
 */
export const mockRestoreImage = async (base64Data: string, mimeType: string): Promise<string> => {
    await wait(3000); // Simulate heavy GPU processing
    return `data:${mimeType};base64,${base64Data}`;
};
