import { useState, useCallback } from 'react';
import { ScanFile, ScanStatus, ProcessedPhoto, DetectedCrop } from '../types';
import { analyzeImage, restoreImage } from '../services/geminiService';
import { useLogger } from '../context/LogContext';

// Helper: Phase C - Surgical Extraction (Client-side Cropping with Rotation)
const cropImage = async (sourceUrl: string, crop: DetectedCrop): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const rawW = img.width;
        const rawH = img.height;
        
        // Normalize coordinates (0-1000)
        const x1 = (crop.xmin / 1000) * rawW;
        const y1 = (crop.ymin / 1000) * rawH;
        const x2 = (crop.xmax / 1000) * rawW;
        const y2 = (crop.ymax / 1000) * rawH;
        
        const cropW = x2 - x1;
        const cropH = y2 - y1;

        // Phase C: 10% safety margin
        const marginX = cropW * 0.05;
        const marginY = cropH * 0.05;
        const safeW = Math.max(cropW - (2 * marginX), 10);
        const safeH = Math.max(cropH - (2 * marginY), 10);
        
        // Calculate crop source coordinates
        const srcX = x1 + marginX;
        const srcY = y1 + marginY;

        // Setup canvas based on Rotation (0, 90, 180, 270)
        const rot = crop.rotation || 0;
        
        // If 90 or 270, swap dimensions
        if (rot === 90 || rot === 270) {
            canvas.width = safeH;
            canvas.height = safeW;
        } else {
            canvas.width = safeW;
            canvas.height = safeH;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        
        // Apply Rotation Logic
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        
        // Determine draw offset after rotation
        // When drawing at 0, 0 is center. We need to offset by -srcW/2, -srcH/2 relative to the unrotated dimensions
        if (rot === 90 || rot === 270) {
             ctx.drawImage(img, srcX, srcY, safeW, safeH, -safeW / 2, -safeH / 2, safeW, safeH);
        } else {
             ctx.drawImage(img, srcX, srcY, safeW, safeH, -safeW / 2, -safeH / 2, safeW, safeH);
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => reject(e);
      img.src = sourceUrl;
    });
};

export const useFileScanner = (isAuthenticated: boolean) => {
  const [files, setFiles] = useState<ScanFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addLog } = useLogger();

  const cleanupFiles = useCallback(() => {
    files.forEach(f => {
      if (f.thumbnailUrl && f.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(f.thumbnailUrl);
      }
    });
    setFiles([]);
    addLog('INFO', 'MEMORY', 'Wyczyszczono bufor plików sesji.');
  }, [files, addLog]);

  // Actions
  const deleteFiles = (ids: string[]) => {
    setFiles(prev => {
        const toDelete = prev.filter(f => ids.includes(f.id));
        toDelete.forEach(f => {
            if (f.thumbnailUrl && f.thumbnailUrl.startsWith('blob:')) {
                URL.revokeObjectURL(f.thumbnailUrl);
            }
        });
        const remaining = prev.filter(f => !ids.includes(f.id));
        addLog('INFO', 'STORAGE', `Usunięto ${toDelete.length} plików z bufora.`);
        return remaining;
    });
  };

  const clearAllFiles = () => {
      cleanupFiles();
  };

  const retryFiles = (ids: string[]) => {
      addLog('WARN', 'KERNEL', `Wymuszono ponowną analizę dla ${ids.length} obiektów.`);
      setFiles(prev => prev.map(f => {
          if (ids.includes(f.id)) {
              return { ...f, status: ScanStatus.DETECTING, detectedCount: 0, errorMessage: undefined, processedResults: [] };
          }
          return f;
      }));
      // In a real scenario, we would trigger processFileAI here again, but for now state reset allows UI to retry
  };

  const verifyManifest = (fileId: string, count: number) => {
      addLog('SUCCESS', 'AUTH', `Ground Truth zweryfikowany dla pliku ${fileId}. Oczekiwana liczba: ${count}.`);
      setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
              return { ...f, expectedCount: count, status: ScanStatus.DETECTING };
          }
          return f;
      }));
      
      const fileToProcess = files.find(f => f.id === fileId);
      if (fileToProcess && fileToProcess.rawFile) {
          processFileAI(fileId, fileToProcess.rawFile, count);
      }
  };

  const processFileAI = async (fileId: string, rawFile: File, expectedCount: number) => {
    try {
      addLog('INFO', 'AI_CORE', `Rozpoczęto analizę Total War dla: ${rawFile.name} [Target: ${expectedCount}]`);
      
      // Phase B: Adaptive Segmentation (The Loop)
      // We pass a log callback to bridge the service logs to our UI logger
      const crops = await analyzeImage(rawFile, fileId, expectedCount, (msg) => addLog('INFO', 'AI_STRATEGY', msg));
      
      addLog('SUCCESS', 'AI_CORE', `Zakończono analizę ${rawFile.name}. Wykryto: ${crops.length} obiektów.`);

      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { 
            ...f, 
            status: ScanStatus.CROPPED, 
            detectedCount: crops.length,
            aiData: crops,
            uploadProgress: undefined
          };
        }
        return f;
      }));
      
      // Trigger Restoration Phase
      await processRestorationPhase(fileId, rawFile.name, crops, files.find(f=>f.id===fileId)?.thumbnailUrl || URL.createObjectURL(rawFile));

    } catch (error: any) {
      addLog('ERROR', 'AI_CORE', `Błąd krytyczny analizy ${rawFile.name}: ${error.message}`);
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { 
            ...f, 
            status: ScanStatus.ERROR, 
            errorMessage: error.message || "Detection Failed"
          };
        }
        return f;
      }));
    }
  };

  const processRestorationPhase = async (fileId: string, filename: string, crops: DetectedCrop[], sourceUrl: string) => {
      if (!crops || crops.length === 0) {
          addLog('WARN', 'KERNEL', `Brak obiektów do restauracji dla ${filename}.`);
          return;
      }

      addLog('INFO', 'KERNEL', `Inicjowanie Generatywnej Restauracji dla ${crops.length} artefaktów z ${filename}...`);
      addLog('INFO', 'KERNEL', `Alokacja wątków: 10 (Parallel Execution).`);

      const results: ProcessedPhoto[] = [];
      const CONCURRENCY_LIMIT = 10;
      let activePromises = 0;
      let currentIndex = 0;

      // Promise wrapper to handle the concurrency
      const processNext = async (): Promise<void> => {
          if (currentIndex >= crops.length) return;

          const i = currentIndex++;
          const crop = crops[i];
          activePromises++;

          try {
              // 1. Surgical Extraction (Crop & Rotate)
              const cropBase64 = await cropImage(sourceUrl, crop);
              
              // 2. Generative Restoration (Kernel)
              const restoredBase64 = await restoreImage(cropBase64, 'image/png');

              const result: ProcessedPhoto = {
                  id: `res-${fileId}-${i}`,
                  scanId: fileId,
                  filename: `${filename.split('.')[0]}_crop_${i + 1}.png`,
                  originalCropUrl: cropBase64,
                  restoredUrl: restoredBase64,
                  filterUsed: 'GEMINI_V3_RESTORE',
                  date: new Date().toLocaleTimeString()
              };

              results.push(result);
              
              // Real-time update to UI (so user sees photos popping in)
              setFiles(prev => prev.map(f => {
                if (f.id === fileId) {
                    const currentResults = f.processedResults || [];
                    // Avoid duplicates if React strict mode double-invokes
                    if(currentResults.find(r => r.id === result.id)) return f;
                    return { ...f, processedResults: [...currentResults, result] };
                }
                return f;
              }));

              addLog('SUCCESS', 'GEMINI', `[Wątek ${activePromises}] Przetworzono artefakt ${i + 1}/${crops.length} (${crop.label})`);

          } catch (err: any) {
              console.error(`Failed to process crop ${i}`, err);
              addLog('ERROR', 'KERNEL', `Błąd restauracji artefaktu ${i + 1}: ${err.message}`);
          } finally {
              activePromises--;
              // Recursively call next
              if (currentIndex < crops.length) {
                  await processNext();
              }
          }
      };

      // Start initial batch
      const initialBatch = [];
      for (let k = 0; k < Math.min(CONCURRENCY_LIMIT, crops.length); k++) {
          initialBatch.push(processNext());
      }

      await Promise.all(initialBatch);

      // Final Status Update
      setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
              return { ...f, status: ScanStatus.RESTORED };
          }
          return f;
      }));

      addLog('SUCCESS', 'KERNEL', `Cykl zakończony dla: ${filename}.`);
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    setIsProcessing(true);
    addLog('INFO', 'NETWORK', `Inicjowanie strumienia dla ${uploadedFiles.length} plików...`);
    
    const newFiles: ScanFile[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      uploadDate: new Date().toLocaleDateString('pl-PL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: ScanStatus.UPLOADING,
      expectedCount: null,
      detectedCount: 0,
      uploadProgress: 0,
      thumbnailUrl: URL.createObjectURL(file),
      rawFile: file,
      selected: false
    }));

    setFiles(prev => [...newFiles, ...prev]);

    newFiles.forEach(scanFile => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5; 
        
        if (progress >= 100) {
          clearInterval(interval);
          addLog('INFO', 'STORAGE', `Plik ${scanFile.filename} zbuforowany. Oczekiwanie na weryfikację.`);
          
          setFiles(prev => prev.map(f => {
            if (f.id === scanFile.id) return { ...f, status: ScanStatus.PENDING_VERIFICATION, uploadProgress: undefined };
            return f;
          }));

        } else {
          setFiles(prev => prev.map(f => {
            if (f.id === scanFile.id) return { ...f, uploadProgress: progress };
            return f;
          }));
        }
      }, 50);
    });
    
    setIsProcessing(false);
  };

  return {
    files,
    isLoading: isProcessing,
    handleFileUpload,
    cleanupFiles,
    deleteFiles,
    clearAllFiles,
    retryFiles,
    verifyManifest,
    setFiles
  };
};