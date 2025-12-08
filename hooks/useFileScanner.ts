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
      // Trigger scan again if needed
      ids.forEach(id => {
          const file = files.find(f => f.id === id);
          if (file && file.rawFile) {
              // Reset to estimate phase logic or force new scan
              performInitialScan(id, file.rawFile);
          }
      });
  };

  // --- NEW LOGIC: Initial Blind Scan (Pre-fill) ---
  const performInitialScan = async (fileId: string, rawFile: File) => {
      // Start AI Analysis Progress Simulation
      // OPTIMIZED: Faster update interval (50ms) to feel more responsive
      let scanProgress = 0;
      const progressInterval = setInterval(() => {
          scanProgress += (scanProgress < 80 ? 10 : 2); // Accelerated progress
          if (scanProgress > 95) scanProgress = 95;
          
          setFiles(prev => prev.map(f => {
              if (f.id === fileId) return { ...f, uploadProgress: scanProgress };
              return f;
          }));
      }, 50);

      try {
          addLog('INFO', 'AI_SCAN', `Wstępna analiza struktury: ${rawFile.name}...`);
          
          // Run analysis without a target count (null) to get AI's best guess
          const crops = await analyzeImage(rawFile, fileId, null, (msg) => {}); // Silent log for initial scan to avoid spam
          
          clearInterval(progressInterval);

          setFiles(prev => prev.map(f => {
              if (f.id === fileId) {
                  return {
                      ...f,
                      status: ScanStatus.PENDING_VERIFICATION, // Stay in pending for user confirmation
                      detectedCount: crops.length,
                      expectedCount: crops.length, // PRE-FILL expected count with detected count
                      aiData: crops, // POPULATE MAP immediately
                      uploadProgress: undefined // Clear progress to show badge/actions
                  };
              }
              return f;
          }));

          addLog('SUCCESS', 'AI_SCAN', `Wstępny skan ${rawFile.name}: Sugerowana liczba obiektów: ${crops.length}.`);

      } catch (error: any) {
          clearInterval(progressInterval);
          console.error("Initial scan failed", error);
          addLog('WARN', 'AI_SCAN', `Nie udało się wykonać wstępnego skanu dla ${rawFile.name}. Wymagana ręczna weryfikacja.`);
          setFiles(prev => prev.map(f => {
              if (f.id === fileId) {
                  // Clear progress on error too
                  return { ...f, status: ScanStatus.PENDING_VERIFICATION, uploadProgress: undefined, detectedCount: 0, expectedCount: null };
              }
              return f;
          }));
      }
  };

  // --- Modified Verification Logic ---
  // Just updates the state, does NOT auto-trigger restoration
  const verifyManifest = (fileId: string, count: number) => {
      addLog('INFO', 'AUTH', `Zaktualizowano Ground Truth dla ${fileId}: ${count}.`);
      setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
              return { ...f, expectedCount: count };
          }
          return f;
      }));
  };

  // --- NEW LOGIC: Batch Generation ---
  const triggerBatchGeneration = async (filesToProcess: {id: string, count: number}[]) => {
      setIsProcessing(true);
      addLog('INFO', 'KERNEL', `Rozpoczynanie sekwencji generowania dla ${filesToProcess.length} plików.`);

      for (const item of filesToProcess) {
          const file = files.find(f => f.id === item.id);
          if (!file || !file.rawFile) continue;

          // 1. Check if we need to Re-Scan (if current detection differs from confirmed count)
          // OR if we don't have detection data yet
          const needsRescan = !file.aiData || file.detectedCount !== item.count;

          if (needsRescan) {
              addLog('WARN', 'AI_CORE', `Rozbieżność dla ${file.filename} (Wykryto: ${file.detectedCount}, Potwierdzono: ${item.count}). Uruchamianie Total War...`);
              
              setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: ScanStatus.DETECTING } : f));
              
              try {
                  const crops = await analyzeImage(file.rawFile, item.id, item.count, (msg) => addLog('INFO', 'AI_STRATEGY', msg));
                  
                  setFiles(prev => prev.map(f => {
                      if (f.id === item.id) {
                          return { ...f, status: ScanStatus.CROPPED, detectedCount: crops.length, aiData: crops };
                      }
                      return f;
                  }));
                  
                  // Proceed to Restore
                  await processRestorationPhase(item.id, file.filename, crops, file.thumbnailUrl || '');

              } catch (e: any) {
                  addLog('ERROR', 'AI_CORE', `Błąd Total War dla ${file.filename}: ${e.message}`);
                  setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: ScanStatus.ERROR, errorMessage: e.message } : f));
              }

          } else {
              // Data is good, proceed directly to restoration
              addLog('INFO', 'KERNEL', `Dane segmentacji dla ${file.filename} są zgodne. Przechodzenie do restauracji.`);
              
              setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: ScanStatus.CROPPED } : f));
              
              if (file.aiData) {
                  await processRestorationPhase(item.id, file.filename, file.aiData, file.thumbnailUrl || '');
              }
          }
      }
      setIsProcessing(false);
  };

  const processRestorationPhase = async (fileId: string, filename: string, crops: DetectedCrop[], sourceUrl: string) => {
      if (!crops || crops.length === 0) {
          addLog('WARN', 'KERNEL', `Brak obiektów do restauracji dla ${filename}.`);
          return;
      }

      addLog('INFO', 'KERNEL', `Inicjowanie Generatywnej Restauracji dla ${crops.length} artefaktów z ${filename}...`);
      
      const results: ProcessedPhoto[] = [];
      const CONCURRENCY_LIMIT = 3; // Reduced slightly for stability
      let activePromises = 0;
      let currentIndex = 0;

      const processNext = async (): Promise<void> => {
          if (currentIndex >= crops.length) return;

          const i = currentIndex++;
          const crop = crops[i];
          activePromises++;

          try {
              // 1. Surgical Extraction
              const cropBase64 = await cropImage(sourceUrl, crop);
              
              // 2. Generative Restoration
              const restoredBase64 = await restoreImage(cropBase64, 'image/png');

              const result: ProcessedPhoto = {
                  id: `res-${fileId}-${i}-${Date.now()}`,
                  scanId: fileId,
                  filename: `${filename.split('.')[0]}_crop_${i + 1}.png`,
                  originalCropUrl: cropBase64,
                  restoredUrl: restoredBase64,
                  filterUsed: 'GEMINI_V3_RESTORE',
                  date: new Date().toLocaleTimeString()
              };

              results.push(result);
              
              setFiles(prev => prev.map(f => {
                if (f.id === fileId) {
                    const currentResults = f.processedResults || [];
                    if(currentResults.find(r => r.id === result.id)) return f;
                    return { ...f, processedResults: [...currentResults, result] };
                }
                return f;
              }));

              addLog('SUCCESS', 'GEMINI', `Odtworzono obiekt ${i + 1}/${crops.length} (${crop.label})`);

          } catch (err: any) {
              console.error(`Failed to process crop ${i}`, err);
              addLog('ERROR', 'KERNEL', `Błąd restauracji artefaktu ${i + 1}: ${err.message}`);
          } finally {
              activePromises--;
              if (currentIndex < crops.length) {
                  await processNext();
              }
          }
      };

      const initialBatch = [];
      for (let k = 0; k < Math.min(CONCURRENCY_LIMIT, crops.length); k++) {
          initialBatch.push(processNext());
      }

      await Promise.all(initialBatch);

      setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
              return { ...f, status: ScanStatus.RESTORED };
          }
          return f;
      }));

      addLog('SUCCESS', 'KERNEL', `Cykl zakończony dla: ${filename}.`);
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    // Note: We don't block UI with isProcessing here, we handle files individually
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
      // OPTIMIZED: Much faster upload simulation (20% per 50ms) -> ~250ms total friction
      const interval = setInterval(() => {
        progress += 20; 
        
        if (progress >= 100) {
          clearInterval(interval);
          
          setFiles(prev => prev.map(f => {
            if (f.id === scanFile.id) return { ...f, status: ScanStatus.PENDING_VERIFICATION, uploadProgress: undefined };
            return f;
          }));

          // TRIGGER AUTOMATIC INITIAL SCAN
          if (scanFile.rawFile) {
              // We reset progress logic inside performInitialScan, but calling it here is correct
              performInitialScan(scanFile.id, scanFile.rawFile);
          }

        } else {
          setFiles(prev => prev.map(f => {
            if (f.id === scanFile.id) return { ...f, uploadProgress: progress };
            return f;
          }));
        }
      }, 50);
    });
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
    triggerBatchGeneration,
    setFiles
  };
};