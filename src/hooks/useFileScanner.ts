import { useState, useCallback } from 'react';
import { ScanFile, ScanStatus, ProcessedPhoto, DetectedCrop } from '../types';
import { analyzeImage, restoreImage } from '../services/geminiService';
import { useLogger } from '../context/LogContext';

// Helper: Phase A Step 3 - Smart Crop
// "Crop 10% from all edges of extracted shard... Reason: Remove artifacts for generative fill"
const cropImage = async (sourceUrl: string, crop: DetectedCrop): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const rawW = img.width;
            const rawH = img.height;
            
            // 1. Get Initial Bounding Box (Normalized 0-1000)
            const x1 = (crop.xmin / 1000) * rawW;
            const y1 = (crop.ymin / 1000) * rawH;
            const x2 = (crop.xmax / 1000) * rawW;
            const y2 = (crop.ymax / 1000) * rawH;
            
            const initialW = x2 - x1;
            const initialH = y2 - y1;

            // 2. NECRO_OS SMART CROP Logic
            // Cut 10% from each edge to remove scanner artifacts/white borders.
            // We cut INWARDS.
            const cutX = initialW * 0.10; // 10% width cut
            const cutY = initialH * 0.10; // 10% height cut
            
            // New Coordinates (Shrunk)
            const safeX = x1 + cutX;
            const safeY = y1 + cutY;
            const safeW = Math.max(initialW - (2 * cutX), 10); // Ensure non-zero
            const safeH = Math.max(initialH - (2 * cutY), 10);
            
            // Setup canvas based on Rotation (0, 90, 180, 270)
            const rot = crop.rotation || 0;
            
            // If 90 or 270, swap dimensions for the canvas container
            if (rot === 90 || rot === 270) {
                canvas.width = safeH;
                canvas.height = safeW;
            } else {
                canvas.width = safeW;
                canvas.height = safeH;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) { 
                throw new Error('Canvas context failed initialization'); 
            }
            
            // Apply Rotation Logic
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rot * Math.PI) / 180);
            
            // Draw the image. 
            if (rot === 90 || rot === 270) {
                ctx.drawImage(img, safeX, safeY, safeW, safeH, -safeW / 2, -safeH / 2, safeW, safeH);
            } else {
                ctx.drawImage(img, safeX, safeY, safeW, safeH, -safeW / 2, -safeH / 2, safeW, safeH);
            }

            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl === 'data:,') throw new Error('Canvas returned empty data');
            resolve(dataUrl);

        } catch (err: any) {
            reject(new Error(`Crop Logic Failed: ${err.message}`));
        }
      };
      img.onerror = () => reject(new Error('Failed to load source image for cropping'));
      img.src = sourceUrl;
    });
};

// Simulation of "Watershed Level 1" (Phase PRE-A)
const simulateFastScan = (fileId: string): { count: number, crops: DetectedCrop[] } => {
    // Determine a pseudo-random logical count based on ID
    const count = (parseInt(fileId.substring(0, 1), 36) % 4) + 1; // 1 to 4 photos
    
    const crops: DetectedCrop[] = [];
    for (let i = 0; i < count; i++) {
        crops.push({
            id: `fast-${fileId}-${i}`,
            label: `PRE_A_OBJ_${i+1}`,
            confidence: 0.5 + (Math.random() * 0.3),
            xmin: 100 + (i * 200),
            ymin: 100,
            xmax: 280 + (i * 200),
            ymax: 400,
            rotation: 0
        });
    }
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
              // Reset to detecting state
              return { ...f, status: ScanStatus.DETECTING, detectedCount: 0, errorMessage: undefined, processedResults: [] };
          }
          return f;
      }));
      
      // Trigger scan for retried files
      ids.forEach(id => {
          const file = files.find(f => f.id === id);
          if (file && file.rawFile && file.expectedCount) {
             processFileAI(id, file.rawFile, file.expectedCount);
          }
      });
  };

  // Phase PRE-A: Visual Verification & Checklist (Watershed L1)
  const runFastAnalysis = (fileId: string, filename: string) => {
      addLog('INFO', 'PRE-A', `[${filename}] Running Watershed Level 1...`);
      
      setFiles(prev => prev.map(f => {
          if (f.id === fileId) return { ...f, status: ScanStatus.PRE_ANALYZING };
          return f;
      }));

      // Simulate processing time
      setTimeout(() => {
          const result = simulateFastScan(fileId);
          addLog('INFO', 'PRE-A', `[${filename}] Auto-Detect Proposal: ${result.count}. Waiting for Operator Validation.`);
          
          setFiles(prev => prev.map(f => {
              if (f.id === fileId) {
                  return { 
                      ...f, 
                      status: ScanStatus.PENDING_VERIFICATION, 
                      expectedCount: result.count, // Initial Proposal
                      detectedCount: result.count,
                      aiData: result.crops
                  };
              }
              return f;
          }));
      }, 1500);
  };

  // Phase PRE-A Step 4: Manifest Commit
  const verifyManifest = (fileId: string, count: number) => {
      addLog('SUCCESS', 'MANIFEST', `Operator committed count: ${count} for ${fileId}.`);
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

  // Phase A: Total War Extraction
  const processFileAI = async (fileId: string, rawFile: File, expectedCount: number) => {
    try {
      addLog('INFO', 'PHASE_A', `Initiating Total War Protocol: ${rawFile.name} [Target: ${expectedCount}]`);
      
      const crops = await analyzeImage(rawFile, fileId, expectedCount, (msg) => addLog('INFO', 'PHASE_A', msg));
      
      if (!crops || crops.length === 0) {
          addLog('WARN', 'PHASE_A', `Total War yielded 0 results for ${rawFile.name}. Strategy exhaustion.`);
          throw new Error("No objects detected. Strategy failed.");
      }

      addLog('SUCCESS', 'PHASE_A', `Extraction Complete: ${crops.length} shards secured.`);

      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { 
            ...f, 
            status: ScanStatus.CROPPED, 
            detectedCount: crops.length,
            aiData: crops,
            uploadProgress: undefined,
            errorMessage: undefined // Clear any previous errors
          };
        }
        return f;
      }));

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Unknown Phase A Error";
      addLog('ERROR', 'PHASE_A', `Extraction Failed for ${rawFile.name}: ${errorMessage}`);
      
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return { 
            ...f, 
            status: ScanStatus.ERROR, 
            errorMessage: errorMessage,
            uploadProgress: undefined
          };
        }
        return f;
      }));
    }
  };

  // Phase B: Alchemy (Generative Restoration)
  const approveAndRestore = async (fileId: string) => {
      const file = files.find(f => f.id === fileId);
      if (!file || !file.rawFile || !file.aiData) {
          addLog('WARN', 'KERNEL', `Cannot start restoration: Missing data for ${fileId}.`);
          return;
      }

      await processRestorationPhase(fileId, file.filename, file.aiData, file.thumbnailUrl || '');
  };

  const processRestorationPhase = async (fileId: string, filename: string, crops: DetectedCrop[], sourceUrl: string) => {
      if (!crops || crops.length === 0) {
          addLog('WARN', 'PHASE_B', `Skipping Alchemy: No shards to process for ${filename}.`);
          return;
      }

      addLog('INFO', 'PHASE_B', `Starting ALCHEMY for ${filename}. ${crops.length} shards scheduled.`);

      const results: ProcessedPhoto[] = [];
      const CONCURRENCY_LIMIT = 3; // Reduced concurrency to prevent rate limits
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
              addLog('INFO', 'PHASE_B', `Processing Shard ${i + 1}/${crops.length} [${crop.label}]...`);

              // Phase A Step 3: Smart Crop (Cut 10% edges)
              let cropBase64: string;
              try {
                  cropBase64 = await cropImage(sourceUrl, crop);
              } catch (cropErr: any) {
                  throw new Error(`Smart Crop Logic Failed: ${cropErr.message}`);
              }
              
              // Phase B: Alchemy (Outpainting + Restore)
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

              addLog('SUCCESS', 'PHASE_B', `Shard ${i + 1}/${crops.length} restored successfully.`);

          } catch (err: any) {
              failureCount++;
              const errMsg = err instanceof Error ? err.message : String(err);
              console.error(`Failed to process crop ${i}`, err);
              addLog('ERROR', 'PHASE_B', `Shard ${i + 1} FAILED: ${errMsg}`);
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

      // Phase POST: Finalization & Status Determination
      let finalStatus = ScanStatus.RESTORED;
      let finalMsg = `Restoration complete. ${successCount} processed, ${failureCount} failed.`;

      if (successCount === 0 && failureCount > 0) {
          // Total Failure
          finalStatus = ScanStatus.ERROR;
          finalMsg = "CRITICAL: All restoration shards failed.";
          addLog('ERROR', 'POST', finalMsg);
      } else if (failureCount > 0) {
          // Partial Success
          addLog('WARN', 'POST', `Partial Success: ${failureCount} shards could not be restored.`);
      } else {
          // Total Success
          addLog('SUCCESS', 'POST', `Finalization complete for: ${filename}. All shards valid.`);
      }

      setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
              return { 
                  ...f, 
                  status: finalStatus,
                  errorMessage: finalStatus === ScanStatus.ERROR ? finalMsg : undefined
              };
          }
          return f;
      }));
  };

  const handleFileUpload = (uploadedFiles: File[]) => {
    setIsProcessing(true);
    addLog('INFO', 'INGEST_RAW', `Loading ${uploadedFiles.length} raw scans...`);
    
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
          addLog('INFO', 'INGEST', `Scan ${scanFile.filename} loaded.`);
          
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