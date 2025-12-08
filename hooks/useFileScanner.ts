import { useState, useCallback } from 'react';
import { ScanFile, ScanStatus } from '../types';
import { analyzeImage } from '../services/geminiService';
import { useLogger } from '../context/LogContext';

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
              // Reset to Detecting
              return { ...f, status: ScanStatus.DETECTING, detectedCount: 0, errorMessage: undefined };
          }
          return f;
      }));
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
      addLog('INFO', 'AI_CORE', `Rozpoczęto analizę Total War dla: ${rawFile.name}`);
      const crops = await analyzeImage(rawFile, fileId);
      
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
      
      // Phase C Simulation
      setTimeout(() => {
        setFiles(prev => prev.map(f => {
            if (f.id === fileId && f.status === ScanStatus.CROPPED) {
                return { ...f, status: ScanStatus.RESTORED };
            }
            return f;
        }));
        addLog('SUCCESS', 'GEMINI', `Generatywna restauracja zakończona dla: ${rawFile.name}`);
      }, 4000);

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