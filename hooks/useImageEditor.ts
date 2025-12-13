import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Image editor state interface
 */
export interface EditorState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

/**
 * Image editor options
 */
export interface ImageEditorOptions {
  maxWidth?: number;
  maxHeight?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

/**
 * Custom hook for advanced image editing
 * Provides filters, transformations, and export capabilities
 */
export const useImageEditor = (
  initialImage: string | File | null,
  options: ImageEditorOptions = {}
) => {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    format = 'image/jpeg',
    quality = 0.9,
  } = options;

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    crop: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /**
   * Load image from URL or File
   */
  const loadImage = useCallback(async (source: string | File) => {
    setIsProcessing(true);

    try {
      const url = typeof source === 'string' ? source : URL.createObjectURL(source);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      setImage(img);
      setImageUrl(url);

      // Reset editor state
      const initialState: EditorState = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        rotation: 0,
        flipH: false,
        flipV: false,
        crop: null,
      };
      setEditorState(initialState);
      setHistory([initialState]);
      setHistoryIndex(0);
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Update editor state and add to history
   */
  const updateState = useCallback(
    (updates: Partial<EditorState>) => {
      setEditorState((prev) => {
        const newState = { ...prev, ...updates };

        // Add to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        return newState;
      });
    },
    [history, historyIndex]
  );

  /**
   * Apply brightness filter
   */
  const setBrightness = useCallback(
    (value: number) => updateState({ brightness: value }),
    [updateState]
  );

  /**
   * Apply contrast filter
   */
  const setContrast = useCallback(
    (value: number) => updateState({ contrast: value }),
    [updateState]
  );

  /**
   * Apply saturation filter
   */
  const setSaturation = useCallback(
    (value: number) => updateState({ saturation: value }),
    [updateState]
  );

  /**
   * Apply blur filter
   */
  const setBlur = useCallback(
    (value: number) => updateState({ blur: value }),
    [updateState]
  );

  /**
   * Rotate image
   */
  const rotate = useCallback(
    (degrees: number) => {
      updateState({ rotation: (editorState.rotation + degrees) % 360 });
    },
    [editorState.rotation, updateState]
  );

  /**
   * Flip image horizontally
   */
  const flipHorizontal = useCallback(() => {
    updateState({ flipH: !editorState.flipH });
  }, [editorState.flipH, updateState]);

  /**
   * Flip image vertically
   */
  const flipVertical = useCallback(() => {
    updateState({ flipV: !editorState.flipV });
  }, [editorState.flipV, updateState]);

  /**
   * Set crop area
   */
  const setCrop = useCallback(
    (crop: EditorState['crop']) => updateState({ crop }),
    [updateState]
  );

  /**
   * Reset all filters
   */
  const reset = useCallback(() => {
    const resetState: EditorState = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
      crop: null,
    };
    updateState(resetState);
  }, [updateState]);

  /**
   * Undo last change
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditorState(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  /**
   * Redo last undone change
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditorState(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  /**
   * Apply all filters to canvas
   */
  const applyFilters = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (!image) return;

      const { brightness, contrast, saturation, blur, rotation, flipH, flipV, crop } =
        editorState;

      // Calculate dimensions
      let width = image.width;
      let height = image.height;

      // Apply rotation to dimensions
      if (rotation === 90 || rotation === 270) {
        [width, height] = [height, width];
      }

      // Apply crop if set
      if (crop) {
        width = crop.width;
        height = crop.height;
      }

      // Resize if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Save context
      ctx.save();

      // Apply transformations
      ctx.translate(width / 2, height / 2);

      if (rotation) {
        ctx.rotate((rotation * Math.PI) / 180);
      }

      if (flipH) {
        ctx.scale(-1, 1);
      }

      if (flipV) {
        ctx.scale(1, -1);
      }

      // Apply filters
      const filters = [];
      if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
      if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
      if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
      if (blur > 0) filters.push(`blur(${blur}px)`);

      ctx.filter = filters.join(' ');

      // Draw image
      if (crop) {
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          -width / 2,
          -height / 2,
          width,
          height
        );
      } else {
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
      }

      // Restore context
      ctx.restore();
    },
    [image, editorState, maxWidth, maxHeight]
  );

  /**
   * Export edited image as Blob
   */
  const exportImage = useCallback(async (): Promise<Blob | null> => {
    if (!image) return null;

    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      applyFilters(canvas, ctx);

      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          format,
          quality
        );
      });
    } catch (error) {
      console.error('Failed to export image:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [image, applyFilters, format, quality]);

  /**
   * Export as data URL
   */
  const exportDataURL = useCallback(async (): Promise<string | null> => {
    const blob = await exportImage();
    if (!blob) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }, [exportImage]);

  /**
   * Download edited image
   */
  const download = useCallback(
    async (filename: string = 'edited-image.jpg') => {
      const blob = await exportImage();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [exportImage]
  );

  // Load initial image
  useEffect(() => {
    if (initialImage) {
      loadImage(initialImage);
    }
  }, [initialImage, loadImage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return {
    // State
    image,
    imageUrl,
    editorState,
    isProcessing,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // Actions
    loadImage,
    setBrightness,
    setContrast,
    setSaturation,
    setBlur,
    rotate,
    flipHorizontal,
    flipVertical,
    setCrop,
    reset,
    undo,
    redo,
    applyFilters,
    exportImage,
    exportDataURL,
    download,

    // Canvas ref
    canvasRef,
  };
};
