import React, { useEffect, useRef } from 'react';
import { useImageEditor } from '../../hooks/useImageEditor';

interface ImageEditorProps {
  image: string | File;
  onExport?: (blob: Blob) => void;
  onClose?: () => void;
}

/**
 * Advanced Image Editor Component
 * Provides filters, transformations, and export capabilities
 */
export const ImageEditor: React.FC<ImageEditorProps> = ({
  image,
  onExport,
  onClose,
}) => {
  const {
    editorState,
    isProcessing,
    canUndo,
    canRedo,
    setBrightness,
    setContrast,
    setSaturation,
    setBlur,
    rotate,
    flipHorizontal,
    flipVertical,
    reset,
    undo,
    redo,
    applyFilters,
    exportImage,
    download,
  } = useImageEditor(image);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Update canvas when editor state changes
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    applyFilters(canvas, ctx);
  }, [editorState, applyFilters]);

  /**
   * Handle export
   */
  const handleExport = async () => {
    const blob = await exportImage();
    if (blob && onExport) {
      onExport(blob);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Image Editor</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </button>
            <button
              onClick={() => download()}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Controls */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto">
          {/* History Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">History</h3>
            <div className="flex gap-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ↷ Redo
              </button>
              <button
                onClick={reset}
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Brightness */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Brightness: {editorState.brightness}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={editorState.brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Contrast */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Contrast: {editorState.contrast}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={editorState.contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Saturation */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Saturation: {editorState.saturation}%
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={editorState.saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Blur */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Blur: {editorState.blur}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={editorState.blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Transform */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Transform</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => rotate(-90)}
                className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
              >
                ↶ 90°
              </button>
              <button
                onClick={() => rotate(90)}
                className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
              >
                ↷ 90°
              </button>
              <button
                onClick={flipHorizontal}
                className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
              >
                Flip ↔
              </button>
              <button
                onClick={flipVertical}
                className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
              >
                Flip ↕
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 mt-8">
            <p>Rotation: {editorState.rotation}°</p>
            <p>Flip H: {editorState.flipH ? 'Yes' : 'No'}</p>
            <p>Flip V: {editorState.flipV ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-950">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full shadow-2xl"
          />
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-lg p-6 text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p>Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};
