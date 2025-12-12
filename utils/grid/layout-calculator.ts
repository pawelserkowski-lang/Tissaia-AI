import { GRID_LAYOUT_CONSTANTS } from '../../config/constants';
import { DetectedCrop } from '../../types';

interface GridLayoutOptions {
  count: number;
  fileId: string;
  labelPrefix?: string;
  confidenceRange?: { min: number; max: number };
  sizeVariation?: { min: number; max: number };
}

/**
 * Generates a grid layout for detected objects/crops.
 * This is a shared utility to ensure consistent layout calculations
 * across different parts of the application (heuristics and AI detection).
 *
 * Calculates dynamic grid layout that fits ANY count within normalized 1000x1000 space.
 */
export const generateGridLayout = (options: GridLayoutOptions): DetectedCrop[] => {
  const {
    count,
    fileId,
    labelPrefix = 'OBJ',
    confidenceRange = { min: 0.85, max: 0.99 },
    sizeVariation = { min: 0.85, max: 1.0 }
  } = options;

  const crops: DetectedCrop[] = [];

  // Dynamic Grid Calculation
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const padding = GRID_LAYOUT_CONSTANTS.PADDING;
  const availableWidth = GRID_LAYOUT_CONSTANTS.NORMALIZATION_BASE - (padding * 2);
  const availableHeight = GRID_LAYOUT_CONSTANTS.NORMALIZATION_BASE - (padding * 2);

  const cellWidth = availableWidth / cols;
  const cellHeight = availableHeight / rows;
  const gap = GRID_LAYOUT_CONSTANTS.GAP;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Add organic variation to box sizes
    const wVariation = (Math.random() * (sizeVariation.max - sizeVariation.min)) + sizeVariation.min;
    const hVariation = (Math.random() * (sizeVariation.max - sizeVariation.min)) + sizeVariation.min;

    const itemW = (cellWidth - gap) * wVariation;
    const itemH = (cellHeight - gap) * hVariation;

    // Center item in cell
    const xOffset = (cellWidth - itemW) / 2;
    const yOffset = (cellHeight - itemH) / 2;

    const xmin = padding + (col * cellWidth) + xOffset;
    const ymin = padding + (row * cellHeight) + yOffset;
    const xmax = xmin + itemW;
    const ymax = ymin + itemH;

    // Generate confidence within range
    const confidence = confidenceRange.min + (Math.random() * (confidenceRange.max - confidenceRange.min));

    crops.push({
      id: `${fileId}_${i}`,
      label: `${labelPrefix}_${String.fromCharCode(65 + i)}`,
      confidence,
      xmin: Math.floor(xmin),
      ymin: Math.floor(ymin),
      xmax: Math.floor(xmax),
      ymax: Math.floor(ymax),
      rotation: 0
    });
  }

  return crops;
};
