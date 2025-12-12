
import { useState, useCallback } from 'react';
import { ScanFile, ScanStatus, ProcessedPhoto, DetectedCrop } from '../types';
import { analyzeImage, restoreImage } from '../services/geminiService';
import { useLogger } from '../context/LogContext';
import { cropImage } from '../utils/image/processing';
import { generateGridLayout } from '../utils/grid/layout-calculator';
import { CONCURRENCY_LIMITS } from '../config/constants';

// Simulation of "Edge Detection & Hough Transform" (Phase PRE-A)
const simulateFastScan = (fileId: string): { count: number, crops: DetectedCrop[] } => {
    // Generate a pseudo-random count between 1 and 8 to accommodate larger scans
    const seed = parseInt(fileId.substring(0, 1), 36);
    const count = (seed % 8) + 1;

    const crops = generateGridLayout({
        count,
        fileId: `fast-${fileId}`,
        labelPrefix: 'PRE_A_OBJ',
        confidenceRange: { min: 0.4, max: 0.7 },
        sizeVariation: { min: 0.7, max: 0.9 }
    });

    return { count, crops };
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
    addLog('INFO', 'MEMORY', 'Cleared session buffer.');
  }, [files, addLog]);

  const deleteFiles = (ids: string[]) => {
    setFiles(prev => {
        const toDelete = prev.filter(f => ids.includes(f.id));
        toDelete.forEach(f => {
            if (f.thumbnailUrl && f.thumbnailUrl.startsWith('blob:')) {
                URL.revokeObjectURL(f.thumbnailUrl);
            }
        });
        const remaining = prev.filter(f => !ids.includes(f.id));
        addLog('INFO', 'STORAGE', `Removed ${toDelete.length} items.`);
        return remaining;
    });
  };

  const clearAllFiles = () => {
      cleanupFiles();
  };

  const retryFiles = (ids: string[]) => {
      addLog('WARN', 'NECRO_OS', `Forced Phase A Retry for ${ids.length} items.`);
      setFiles(prev => prev.map(f => {
          if (ids.includes(f.id)) {
              return { ...f, status: ScanStatus.DETECTING, detectedCount: 0, errorMessage: undefined, processedResults: [], aiData: [] };
          }
          return f;
      }));
      
      ids.forEach(id => {
          const file = files.find(f => f.id === id);
          if (file && file.rawFile && file.expectedCount) {
             processFileAI(id, file.rawFile, file.expectedCount, file.thumbnailUrl, false);
          }
      });
  };

  const runFastAnalysis = (fileId: string, filename: string) => {
      addLog('INFO', 'STAGE_1', `[${filename}] Running Ingestion & Heuristics (Edge/Hough)...`);
      setFiles(prev => prev.map(f => {
          if (f.id === fileId) return { ...f, status: ScanStatus.PRE_ANALYZING };
          return f;
      }));

      setTimeout(() => {
          const result = simulateFastScan(fileId);
          addLog('INFO', 'STAGE_1', `[${filename}] Auto-Detect Proposal: ${result.count}. Waiting for Operator Validation.`);
          
          setFiles(prev => prev.map(f => {
              if (f.id === fileId) {
                  return { 
                      ...f, 
                      status: ScanStatus.PENDING_VERIFICATION, 
                      expectedCount: result.count,
                      detectedCount: result.count,
                      aiData: result.crops
                  };
              }
              return f;
          }));
      }, 1500);
  };

  const processRestorationPhase = async (fileId: string, filename: string, crops: DetectedCrop[], sourceUrl: string) => {
      if (!crops || crops.length === 0) return;

      addLog('INFO', 'STAGE_4', `Starting ALCHEMY for ${filename}. ${crops.length} shards scheduled.`);
      const results: ProcessedPhoto[] = []; 
      let activePromises = 0;
      let currentIndex = 0;
      let successCount = 0;
      let failureCount = 0;

      const processNext = async (): Promise<void> => {
          if (currentIndex >= crops.length) return;
          const i = currentIndex++;
          const crop = crops[i];
          activePromises++;

          try {
              addLog('INFO', 'STAGE_3', `Processing Shard ${i + 1}/${crops.length} [Smart Crop]...`);
              
              // Smart Crop using Utility (Stage 3)
              let cropBase64: string;
              try {
                  cropBase64 = await cropImage(sourceUrl, crop);
              } catch (cropErr: any) {
                  throw new Error(`Smart Crop Logic Failed: ${cropErr.message}`);
              }
              
              addLog('INFO', 'STAGE_4', `Processing Shard ${i + 1}/${crops.length} [Alchemy]...`);
              // Alchemy (Stage 4)
              let restoredBase64: string;
              try {
                  restoredBase64 = await restoreImage(cropBase64, 'image/png');
              } catch (restoreErr: any) {
                  throw new Error(`Generative Restore Failed: ${restoreErr.message}`);
              }

              const result: ProcessedPhoto = {
                  id: `res-${fileId}-${i}-${Date.now()}`,
                  scanId: fileId,
                  filename: `${filename.split('.')[0]}_restored_${i + 1}.png`,
                  originalCropUrl: cropBase64,
                  restoredUrl: restoredBase64,
                  filterUsed: 'NECRO_OS_ALCHEMY',
                  date: new Date().toLocaleTimeString()
              };

              results.push(result);
              successCount++;
              
              setFiles(prev => prev.map(f => {
                if (f.id === fileId) {
                    const currentResults = f.processedResults || [];
                    if(currentResults.find(r => r.id === result.id)) return f;
                    return { ...f, processedResults: [...currentResults, result] };
                }
                return f;
              }));
              addLog('SUCCESS', 'STAGE_4', `Shard ${i + 1}/${crops.length} restored successfully.`);

          } catch (err: any) {
              failureCount++;
              const errMsg = err instanceof Error ? err.message : String(err);
              console.error(`Failed to process crop ${i}`, err);
              addLog('ERROR', 'STAGE_4', `Shard ${i + 1} FAILED: ${errMsg}`);
          } finally {
              activePromises--;
              if (currentIndex < crops.length) {
                  await processNext();
              }
          }
      };

      const initialBatch = [];
      for (let k = 0; k < Math.min(CONCURRENCY_LIMITS.MAX_RESTORATIONS, crops.length); k++) {
          initialBatch.push(processNext());
      }
      await Promise.all(initialBatch);

      let finalStatus = ScanStatus.RESTORED;
      let finalMsg = `Restoration complete. ${successCount} processed, ${failureCount} failed.`;

      if (successCount === 0 && failureCount > 0) {
          finalStatus = ScanStatus.ERROR;
          finalMsg = "CRITICAL: All restoration shards failed.";
          addLog('ERROR', 'POST', finalMsg);
      } else if (failureCount > 0) {
          addLog('WARN', 'POST', `Partial Success: ${failureCount} shards could not be restored.`);
      } else {
          addLog('SUCCESS', 'POST', `Finalization complete for: ${filename}. All shards valid.`);
      }

      setFiles(prev => prev.map(f => {
          if (f.id === fileId) return { ...f, status: finalStatus, errorMessage: finalStatus === ScanStatus.ERROR ? finalMsg : undefined };
          return f;
      }));
  };

  const processFileAI = async (fileId: string, rawFile: File, expectedCount: number, thumbnailUrl: string | undefined, autoRestore: boolean) => {
    try {
      addLog('INFO', 'STAGE_2', `Initiating YOLO Inference Protocol: ${rawFile.name} [Target: ${expectedCount}]`);
      const crops = await analyzeImage(rawFile, fileId, expectedCount, (msg) => addLog('INFO', 'STAGE_2', msg));
      
      if (!crops || crops.length === 0) {
          addLog('WARN', 'STAGE_2', `YOLO Inference yielded 0 results for ${rawFile.name}. Strategy exhaustion.`);
          throw new Error("No objects detected. Strategy failed.");
      }

      addLog('SUCCESS', 'STAGE_2', `Extraction Complete: ${crops.length} shards secured.`);
      
      // If autoRestore is enabled, jump directly to RESTORING status to prevent UI flicker
      const nextStatus = autoRestore ? ScanStatus.RESTORING : ScanStatus.CROPPED;
      
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { 
            ...f, status: nextStatus, detectedCount: crops.length, aiData: crops, uploadProgress: undefined, errorMessage: undefined 
          };
        }
        return f;
      }));

      // If Auto-Restore is requested (e.g. from "Approve All"), immediately chain Stage 4
      if (autoRestore) {
          addLog('INFO', 'STAGE_2', `Auto-Restore trigger engaged for ${rawFile.name}. Proceeding to Stage 3/4.`);
          // Use provided thumbnail or create a fallback URL
          const validThumb = thumbnailUrl || URL.createObjectURL(rawFile);
          processRestorationPhase(fileId, rawFile.name, crops, validThumb);
      }

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Unknown Phase A Error";
      addLog('ERROR', 'STAGE_2', `Extraction Failed for ${rawFile.name}: ${errorMessage}`);
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) return { ...f, status: ScanStatus.ERROR, errorMessage: errorMessage, uploadProgress: undefined };
        return f;
      }));
    }
  };

  const verifyManifest = (fileId: string, count: number, autoRestore: boolean = false) => {
      addLog('SUCCESS', 'MANIFEST', `Operator committed count: ${count} for ${fileId} [AutoRestore: ${autoRestore ? 'ENABLED' : 'DISABLED'}].`);
      setFiles(prev => prev.map(f => {
          // Reset detectedCount/aiData to prepare for Stage 2 (Total War) results
          // We clear aiData here so the UI knows we are re-detecting
          if (f.id === fileId) return { ...f, expectedCount: count, status: ScanStatus.DETECTING, detectedCount: 0, aiData: [] };
          return f;
      }));
      
      const fileToProcess = files.find(f => f.id === fileId);
      if (fileToProcess && fileToProcess.rawFile) {
          // Pass thumbnailURL to avoid stale closure issues in async process
          processFileAI(fileId, fileToProcess.rawFile, count, fileToProcess.thumbnailUrl, autoRestore);
      }
  };

  const approveAndRestore = async (fileId: string) => {
      const file = files.find(f => f.id === fileId);
      if (!file || !file.rawFile || !file.aiData) {
          addLog('WARN', 'KERNEL', `Cannot start restoration: Missing data for ${fileId}.`);
          return;
      }
      // Immediate UI update to show processing has started
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: ScanStatus.RESTORING } : f));
      
      await processRestorationPhase(fileId, file.filename, file.aiData, file.thumbnailUrl || '');
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    setIsProcessing(true);
    addLog('INFO', 'STAGE_1', `Loading ${uploadedFiles.length} raw scans...`);
    
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
        progress += 10; 
        if (progress >= 100) {
          clearInterval(interval);
          addLog('INFO', 'STAGE_1', `Scan ${scanFile.filename} buffered.`);
          setFiles(prev => prev.map(f => {
            if (f.id === scanFile.id) return { ...f, uploadProgress: undefined };
            return f;
          }));
          runFastAnalysis(scanFile.id, scanFile.filename);
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
    approveAndRestore,
    setFiles
  };
};
