import { useState, useEffect, useCallback } from 'react';
import { ScanFile, ScanStatus } from '../types';
import { analyzeImage } from '../services/geminiService';
import { INITIAL_MOCK_FILES } from '../data/mockData';

export const useFileScanner = (isAuthenticated: boolean) => {
  const [files, setFiles] = useState<ScanFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load initial data only once when authenticated
  useEffect(() => {
    if (isAuthenticated && files.length === 0) {
      setFiles(INITIAL_MOCK_FILES);
    }
  }, [isAuthenticated]);

  const cleanupFiles = useCallback(() => {
    files.forEach(f => {
      if (f.thumbnailUrl && f.thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(f.thumbnailUrl);
      }
    });
    setFiles([]);
  }, [files]);

  const processFileAI = async (fileId: string, rawFile: File) => {
    try {
      const crops = await analyzeImage(rawFile, fileId);
      
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
    } catch (error: any) {
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
    
    const newFiles: ScanFile[] = uploadedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      filename: file.name,
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      status: ScanStatus.UPLOADING,
      detectedCount: 0,
      uploadProgress: 0,
      thumbnailUrl: URL.createObjectURL(file),
      rawFile: file
    }));

    setFiles(prev => [...newFiles, ...prev]);

    // Process each file with simulation
    newFiles.forEach(scanFile => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5; // Upload speed simulation
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Update status to detecting
          setFiles(prev => prev.map(f => {
            if (f.id === scanFile.id) return { ...f, status: ScanStatus.DETECTING, uploadProgress: undefined };
            return f;
          }));

          // Trigger AI
          if (scanFile.rawFile) {
            processFileAI(scanFile.id, scanFile.rawFile);
          }
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
    setFiles
  };
};