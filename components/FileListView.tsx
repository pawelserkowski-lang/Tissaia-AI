import React, { useRef, useState, useEffect } from 'react';
import { ScanFile, ScanStatus } from '../types';
import { Tooltip } from './Tooltip';

interface FileListViewProps {
  files: ScanFile[];
  isLoading: boolean;
  onUpload: (files: File[]) => void;
  onSelect: (id: string) => void;
  onDelete: (ids: string[]) => void;
  onClear: () => void;
  onRetry: (ids: string[]) => void;
  onVerify?: (id: string, count: number) => void;
}

interface ExtendedFileListViewProps extends FileListViewProps {
    onBatchGenerate?: (items: {id: string, count: number}[]) => void;
}

const STATUS_STYLES: Record<ScanStatus, string> = {
  [ScanStatus.RESTORED]: 'text-tissaia-accent border-tissaia-accent/30 bg-tissaia-accent/10 shadow-[0_0_10px_rgba(0,255,163,0.1)]',
  [ScanStatus.CROPPED]: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  [ScanStatus.DETECTING]: 'text-purple-400 bg-purple-500/10 border-purple-500/20 animate-pulse',
  [ScanStatus.PENDING_VERIFICATION]: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  [ScanStatus.ERROR]: 'text-red-400 bg-red-500/10 border-red-500/20',
  [ScanStatus.UPLOADING]: 'text-gray-300 bg-gray-700/30 border-gray-600/30',
};

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-white/5">
    <td className="px-4 py-6"><div className="w-6 h-6 bg-white/5 rounded"></div></td>
    <td className="px-6 py-6">
      <div className="w-72 h-72 bg-white/5 rounded-xl"></div>
    </td>
    <td className="px-6 py-6">
      <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-white/5 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-6"><div className="h-8 bg-white/5 rounded w-24"></div></td>
    <td className="px-6 py-6"><div className="h-8 bg-white/5 rounded w-12 mx-auto"></div></td>
    <td className="px-6 py-6"><div className="h-8 bg-white/5 rounded w-12 ml-auto"></div></td>
    <td className="px-6 py-6"><div className="h-8 w-8 bg-white/5 rounded-full mx-auto"></div></td>
  </tr>
);

const FileListView: React.FC<ExtendedFileListViewProps> = ({ files, isLoading, onUpload, onSelect, onDelete, onClear, onRetry, onVerify, onBatchGenerate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // NEW: Ref for camera input
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState<ScanFile[]>(files);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Local state for inputs. Key: FileID, Value: Number
  const [inputCounts, setInputCounts] = useState<Record<string, number>>({});
  
  // Inspection Modal State
  const [previewFile, setPreviewFile] = useState<ScanFile | null>(null);
  const [modalCount, setModalCount] = useState<string>('');

  // Sync Input Counts with AI Suggestions (Pre-fill)
  // MODIFIED: Correctly uses functional state update to avoid stale closures
  useEffect(() => {
      setInputCounts(prev => {
          const next = { ...prev };
          let changed = false;
          files.forEach(f => {
              // If we have an expected count (from AI) and user hasn't typed yet (undefined), fill it
              if (f.expectedCount !== null && next[f.id] === undefined) {
                  next[f.id] = f.expectedCount;
                  changed = true;
              }
          });
          return changed ? next : prev;
      });
  }, [files]);

  // Handle filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
        setFilteredFiles(files);
        return;
    }
    setIsFiltering(true);
    const timeoutId = setTimeout(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const results = files.filter(f => 
            f.filename.toLowerCase().includes(lowerQuery) || 
            f.status.toLowerCase().includes(lowerQuery)
        );
        setFilteredFiles(results);
        setIsFiltering(false);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, files]);

  // Sync selected IDs
  useEffect(() => {
      setSelectedIds(prev => {
          const next = new Set(prev);
          for (const id of next) {
              if (!files.find(f => f.id === id)) {
                  next.delete(id);
              }
          }
          return next;
      });
  }, [files]);

  const handleToggleSelect = (id: string) => {
      setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleToggleAll = () => {
      if (selectedIds.size === filteredFiles.length && filteredFiles.length > 0) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredFiles.map(f => f.id)));
      }
  };

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleCameraClick = () => cameraInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onUpload(Array.from(event.target.files));
    }
    if (event.target === fileInputRef.current && fileInputRef.current) fileInputRef.current.value = '';
    if (event.target === cameraInputRef.current && cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Drag & Drop
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current += 1; if (e.dataTransfer.items.length > 0) setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current -= 1; if (dragCounter.current <= 0) setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounter.current = 0;
    if (isLoading) return;
    if (e.dataTransfer.files.length > 0) onUpload(Array.from(e.dataTransfer.files));
  };

  const handleBulkDelete = () => { onDelete(Array.from(selectedIds)); setSelectedIds(new Set()); };
  const handleBulkRetry = () => { onRetry(Array.from(selectedIds)); setSelectedIds(new Set()); };

  const handleCountChange = (id: string, val: string) => {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0) {
          setInputCounts(prev => ({ ...prev, [id]: num }));
          // Optional: Verify immediately if needed, but we wait for batch confirm usually
          if (onVerify) onVerify(id, num);
      }
  };

  // Batch Generation Trigger
  const handleConfirmAndGenerateAll = () => {
      if (!onBatchGenerate) return;
      
      const payload: {id: string, count: number}[] = [];
      
      files.forEach(f => {
          if (f.status === ScanStatus.PENDING_VERIFICATION || f.status === ScanStatus.CROPPED) {
              // Use user input, or AI pre-fill, or 0
              const count = inputCounts[f.id] !== undefined ? inputCounts[f.id] : (f.expectedCount || 0);
              if (count > 0) {
                  payload.push({ id: f.id, count });
              }
          }
      });

      if (payload.length > 0) {
          onBatchGenerate(payload);
      }
  };

  // Check if any files are ready for generation
  const hasPendingFiles = files.some(f => f.status === ScanStatus.PENDING_VERIFICATION || f.status === ScanStatus.CROPPED);

  // --- Modal Logic ---
  const openPreview = (file: ScanFile) => {
      setPreviewFile(file);
      setModalCount(inputCounts[file.id] !== undefined ? inputCounts[file.id].toString() : (file.expectedCount?.toString() || ''));
  };
  const closePreview = () => { setPreviewFile(null); setModalCount(''); };
  const handleModalVerify = () => {
      if (!previewFile || !onVerify) return;
      const count = parseInt(modalCount);
      if (!isNaN(count) && count > 0) {
          setInputCounts(prev => ({ ...prev, [previewFile.id]: count }));
          onVerify(previewFile.id, count);
          closePreview();
      }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-6 rounded-xl glass-panel gap-4 shrink-0">
        <div>
            <h2 className="text-xl font-bold text-white tracking-wide"><i className="fa-solid fa-server mr-3 text-tissaia-accent"></i>INGEST DANYCH</h2>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1 font-mono">
                <span className="bg-yellow-500/20 text-yellow-500 px-1 rounded">PHASE PRE-A</span>
                <span>WERYFIKACJA ILOŚCI</span>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* NEW BATCH BUTTON */}
            {hasPendingFiles && (
                <button 
                    onClick={handleConfirmAndGenerateAll}
                    disabled={isLoading}
                    className="animate-fade-in flex items-center px-5 py-2.5 bg-tissaia-accent text-black font-bold rounded-lg hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,163,0.3)] disabled:opacity-50 disabled:scale-100 disabled:bg-gray-700 whitespace-nowrap text-xs font-mono tracking-wider"
                >
                    <i className={`fa-solid ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'} mr-2`}></i>
                    POTWIERDŹ WSZYSTKIE I GENERUJ
                </button>
            )}

            {selectedIds.size > 0 && (
                <div className="flex space-x-2 animate-fade-in mr-2">
                    <Tooltip content="Usuń wybrane" position="top">
                        <button onClick={handleBulkDelete} className="w-9 h-9 flex items-center justify-center rounded bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors"><i className="fa-solid fa-trash"></i></button>
                    </Tooltip>
                    <Tooltip content="Ponów analizę" position="top">
                        <button onClick={handleBulkRetry} className="w-9 h-9 flex items-center justify-center rounded bg-blue-500/20 text-blue-500 border border-blue-500/50 hover:bg-blue-500 hover:text-white transition-colors"><i className="fa-solid fa-rotate-right"></i></button>
                    </Tooltip>
                </div>
            )}

            <div className="relative group flex-1 min-w-[200px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-tissaia-accent transition-colors">
                    {isFiltering ? <i className="fa-solid fa-circle-notch fa-spin text-tissaia-accent"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
                </div>
                <input type="text" placeholder="WYSZUKAJ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} disabled={isLoading} className="w-full bg-black/40 border border-gray-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-tissaia-accent/50 text-xs font-mono" />
            </div>

            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
            {/* NEW: Camera Input */}
            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

            <Tooltip content="Wyczyść całą listę" position="top">
                <button onClick={onClear} className="px-4 py-2.5 bg-gray-800 border border-gray-600 text-gray-400 font-bold rounded-lg hover:bg-gray-700 hover:text-white text-xs whitespace-nowrap"><i className="fa-solid fa-eraser mr-2"></i> WYCZYŚĆ</button>
            </Tooltip>
            
            <Tooltip content="Wgraj pliki lokalne" position="top">
                <button onClick={handleUploadClick} disabled={isLoading} className="group relative px-6 py-2.5 bg-tissaia-accent/10 border border-tissaia-accent/50 text-tissaia-accent font-bold rounded-lg hover:bg-tissaia-accent/20 transition-all text-xs tracking-wider whitespace-nowrap"><i className="fa-solid fa-upload mr-2"></i> UPLOAD</button>
            </Tooltip>

             {/* NEW: Camera Button */}
             <Tooltip content="Użyj Kamery" position="top">
                <button onClick={handleCameraClick} disabled={isLoading} className="group relative px-6 py-2.5 bg-tissaia-accent text-black font-bold rounded-lg hover:bg-white transition-all text-xs tracking-wider whitespace-nowrap">
                    <i className="fa-solid fa-camera mr-2"></i> ZDJĘCIE
                </button>
            </Tooltip>
        </div>
      </div>

      <div className={`flex-1 rounded-xl glass-panel overflow-hidden flex flex-col relative min-h-[400px] transition-all duration-300 ${isDragging ? 'border-tissaia-accent bg-tissaia-accent/5' : ''}`} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
        {isDragging && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in pointer-events-none">
                <i className="fa-solid fa-cloud-arrow-up text-7xl text-tissaia-accent mb-6 animate-bounce"></i>
                <h3 className="text-2xl font-bold text-white tracking-[0.2em] font-mono">UPUŚĆ PLIKI</h3>
            </div>
        )}

        <div className="overflow-x-auto h-full custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase font-mono text-sm tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="px-4 py-5 border-b border-white/5 w-10"><input type="checkbox" className="accent-tissaia-accent cursor-pointer" checked={selectedIds.size === filteredFiles.length && filteredFiles.length > 0} onChange={handleToggleAll} /></th>
                        <th className="px-6 py-5 border-b border-white/5 w-80">Podgląd</th>
                        <th className="px-6 py-5 border-b border-white/5">Nazwa Pliku</th>
                        <th className="px-6 py-5 border-b border-white/5">Status</th>
                        <th className="px-6 py-5 border-b border-white/5 text-center text-yellow-500">
                            <Tooltip content="Pre-fillowane przez AI. Potwierdź." position="top"><span><i className="fa-solid fa-robot mr-1"></i>OCZEKIWANA</span></Tooltip>
                        </th>
                        <th className="px-6 py-5 border-b border-white/5 text-center">Wykryto</th>
                        <th className="px-6 py-5 border-b border-white/5 text-center">Akcje</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {isLoading && filteredFiles.length === 0 ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />) : (
                        <>
                            {filteredFiles.map((file) => (
                                <tr key={file.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(file.id) ? 'bg-white/5' : ''}`}>
                                    <td className="px-4 py-6 align-middle"><input type="checkbox" className="accent-tissaia-accent cursor-pointer scale-125" checked={selectedIds.has(file.id)} onChange={() => handleToggleSelect(file.id)} /></td>
                                    <td className="px-6 py-6 cursor-zoom-in" onClick={() => openPreview(file)}>
                                        <div className="w-72 h-72 bg-black/40 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-tissaia-accent/50 transition-all relative">
                                            {file.thumbnailUrl ? <img src={file.thumbnailUrl} alt={file.filename} className="w-full h-full object-contain" /> : <i className="fa-regular fa-image text-3xl"></i>}
                                            {file.status === ScanStatus.UPLOADING && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-tissaia-accent text-2xl"></i></div>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-medium text-gray-200 cursor-pointer align-middle" onClick={() => file.status !== ScanStatus.UPLOADING && onSelect(file.id)}>
                                        <div className="text-2xl font-bold text-white mb-2">{file.filename}</div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 font-mono"><span>{file.size}</span><span>{file.uploadDate}</span></div>
                                    </td>
                                    <td className="px-6 py-6 min-w-[200px] align-middle">
                                        {file.status === ScanStatus.UPLOADING ? (
                                            <div className="w-full"><div className="w-full bg-gray-700 h-1.5 rounded-full"><div className="bg-tissaia-accent h-full rounded-full" style={{ width: `${file.uploadProgress || 0}%` }}></div></div></div>
                                        ) : file.status === ScanStatus.PENDING_VERIFICATION && file.uploadProgress !== undefined ? (
                                            /* MODIFIED: Initial Verification Progress Bar */
                                            <div className="w-full">
                                                <div className="flex justify-between text-[10px] text-yellow-500 font-mono mb-1">
                                                    <span className="animate-pulse">WSTĘPNA WERYFIKACJA</span>
                                                    <span>{Math.round(file.uploadProgress || 0)}%</span>
                                                </div>
                                                <div className="w-full bg-yellow-900/30 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-yellow-500 h-full rounded-full transition-all duration-300" 
                                                        style={{ width: `${file.uploadProgress || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : file.status === ScanStatus.DETECTING ? (
                                            <div className="w-full"><div className="w-full bg-purple-900/30 h-2 rounded-full overflow-hidden relative border border-purple-500/30"><div className="absolute top-0 bottom-0 bg-purple-500 w-1/3 animate-progress"></div></div></div>
                                        ) : (
                                            <span className={`px-4 py-2 rounded text-sm font-bold border font-mono whitespace-nowrap ${STATUS_STYLES[file.status]}`}>{file.status}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        {/* Input is now pre-filled with inputCounts[file.id] which defaults to file.expectedCount */}
                                        <div className="flex items-center justify-center space-x-2">
                                            <input type="number" min="1" max="20"
                                                value={inputCounts[file.id] !== undefined ? inputCounts[file.id] : ''}
                                                onChange={(e) => handleCountChange(file.id, e.target.value)}
                                                disabled={file.status !== ScanStatus.PENDING_VERIFICATION && file.status !== ScanStatus.CROPPED}
                                                className={`w-20 py-2 bg-black border text-center rounded-lg text-2xl font-mono focus:outline-none focus:border-yellow-400 ${file.status === ScanStatus.RESTORED ? 'border-gray-800 text-gray-500' : 'border-yellow-500/50 text-yellow-500'}`}
                                                placeholder={file.expectedCount ? file.expectedCount.toString() : "AI"}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center font-mono text-white font-bold text-2xl align-middle">
                                        {file.detectedCount > 0 ? file.detectedCount : '-'}
                                        {file.detectedCount > 0 && file.expectedCount !== null && (
                                            file.detectedCount === (inputCounts[file.id] || file.expectedCount) 
                                            ? <i className="fa-solid fa-check-circle text-tissaia-accent ml-2 text-base"></i> 
                                            : <i className="fa-solid fa-circle-question text-yellow-500 ml-2 text-base"></i>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onDelete([file.id])} className="text-gray-500 hover:text-red-400 p-2"><i className="fa-solid fa-trash text-lg"></i></button>
                                            <button onClick={() => onRetry([file.id])} className="text-gray-500 hover:text-blue-400 p-2"><i className="fa-solid fa-rotate-right text-lg"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </>
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Modal Logic (simplified for brevity but functional) */}
        {previewFile && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
                <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl flex flex-col items-center">
                    <img src={previewFile.thumbnailUrl} className="max-h-[60vh] object-contain mb-4" />
                    <input type="number" value={modalCount} onChange={(e) => setModalCount(e.target.value)} className="bg-black text-yellow-500 text-3xl font-mono border-yellow-500 border-2 p-2 rounded mb-4 text-center w-32" autoFocus />
                    <div className="flex space-x-4">
                        <button onClick={handleModalVerify} className="bg-tissaia-accent text-black px-6 py-2 rounded font-bold">ZATWIERDŹ</button>
                        <button onClick={closePreview} className="bg-gray-700 text-white px-6 py-2 rounded">ANULUJ</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default FileListView;