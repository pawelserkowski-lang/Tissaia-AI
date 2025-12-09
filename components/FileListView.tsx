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
  onApprove?: (id: string) => void; // Added for Approve All logic
}

const STATUS_STYLES: Record<ScanStatus, string> = {
  [ScanStatus.RESTORED]: 'text-tissaia-accent border-tissaia-accent/30 bg-tissaia-accent/10 shadow-[0_0_10px_rgba(0,255,163,0.1)]',
  [ScanStatus.CROPPED]: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  [ScanStatus.DETECTING]: 'text-purple-400 bg-purple-500/10 border-purple-500/20 animate-pulse',
  [ScanStatus.PRE_ANALYZING]: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 animate-pulse',
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

const FileListView: React.FC<FileListViewProps> = ({ files, isLoading, onUpload, onSelect, onDelete, onClear, onRetry, onVerify, onApprove }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState<ScanFile[]>(files);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Local state for inputs before verification
  const [inputCounts, setInputCounts] = useState<Record<string, number>>({});
  
  // Inspection Modal State
  const [previewFile, setPreviewFile] = useState<ScanFile | null>(null);
  const [modalCount, setModalCount] = useState<string>('');

  useEffect(() => {
    const newCounts = { ...inputCounts };
    let changed = false;
    files.forEach(f => {
        if (f.status === ScanStatus.PENDING_VERIFICATION && f.expectedCount && !newCounts[f.id]) {
            newCounts[f.id] = f.expectedCount;
            changed = true;
        }
    });
    if (changed) setInputCounts(newCounts);
  }, [files]);

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
    event.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounter.current = 0;
    if (isLoading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) onUpload(Array.from(e.dataTransfer.files));
  };

  const handleBulkDelete = () => {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
  };

  const handleBulkRetry = () => {
      onRetry(Array.from(selectedIds));
      setSelectedIds(new Set());
  };

  const handleCountChange = (id: string, val: string) => {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0) {
          setInputCounts(prev => ({ ...prev, [id]: num }));
      }
  };

  const handleVerify = (id: string) => {
      const count = inputCounts[id];
      if (count !== undefined && onVerify) {
          onVerify(id, count);
      }
  };

  // --- NEW: Approve All Logic ---
  const handleApproveAll = () => {
      if (!onApprove) return;
      // Filter files that are ready (CROPPED or PENDING_VERIFICATION)
      const eligibleFiles = filteredFiles.filter(f => 
          f.status === ScanStatus.CROPPED || f.status === ScanStatus.PENDING_VERIFICATION
      );
      
      eligibleFiles.forEach(file => {
          onApprove(file.id);
      });
  };

  // Check if we have any files ready for approval to show the button
  const hasFilesToApprove = filteredFiles.some(f => 
      f.status === ScanStatus.CROPPED || f.status === ScanStatus.PENDING_VERIFICATION
  );

  // --- Modal Logic ---
  const openPreview = (file: ScanFile) => {
      setPreviewFile(file);
      setModalCount(file.expectedCount ? file.expectedCount.toString() : '');
  };

  const closePreview = () => {
      setPreviewFile(null);
      setModalCount('');
  };

  const handleModalVerify = () => {
      if (!previewFile || !onVerify) return;
      const count = parseInt(modalCount);
      if (!isNaN(count) && count > 0) {
          onVerify(previewFile.id, count);
          closePreview();
      }
  };

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 md:p-6 rounded-xl glass-panel gap-4 shrink-0">
        <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center">
                <i className="fa-solid fa-list mr-3 text-tissaia-accent"></i>
                LISTA PLIKÓW
            </h2>
            <div className="flex items-center space-x-2 text-[10px] md:text-xs text-gray-400 mt-1 font-mono">
                <span className="bg-cyan-500/20 text-cyan-500 px-1 rounded">FAST SCAN</span>
                <span>WSTĘPNA ANALIZA HEURYSTYCZNA</span>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
             {/* Approve All Button */}
             {hasFilesToApprove && (
                <button 
                    onClick={handleApproveAll}
                    className="flex-1 lg:flex-none px-4 py-2.5 bg-tissaia-accent text-black font-bold rounded-lg hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,255,163,0.3)] text-xs whitespace-nowrap animate-fade-in"
                >
                    <i className="fa-solid fa-scissors mr-2"></i> ZATWIERDŹ WSZYSTKIE I WYTNIJ
                </button>
            )}

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
                <div className="flex space-x-2 animate-fade-in">
                    <Tooltip content="Usuń wybrane" position="top">
                        <button onClick={handleBulkDelete} className="w-9 h-9 flex items-center justify-center rounded bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors">
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </Tooltip>
                    <Tooltip content="Ponów analizę" position="top">
                        <button onClick={handleBulkRetry} className="w-9 h-9 flex items-center justify-center rounded bg-blue-500/20 text-blue-500 border border-blue-500/50 hover:bg-blue-500 hover:text-white transition-colors">
                            <i className="fa-solid fa-rotate-right"></i>
                        </button>
                    </Tooltip>
                </div>
            )}

            {/* Search Input */}
            <div className="relative group flex-1 min-w-[150px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-tissaia-accent transition-colors">
                    {isFiltering ? <i className="fa-solid fa-circle-notch fa-spin text-tissaia-accent"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
                </div>
                <input 
                    type="text" 
                    placeholder="SZUKAJ..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-gray-700 text-white pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-tissaia-accent/50 focus:bg-black/60 text-xs font-mono transition-all disabled:opacity-50"
                />
            </div>

            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,.tiff,.tif,.png,.jpg,.jpeg" onChange={handleFileChange} />
            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
            
            <Tooltip content="Wyczyść całą listę" position="top">
                <button onClick={onClear} className="px-3 md:px-4 py-2.5 bg-gray-800 border border-gray-600 text-gray-400 font-bold rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-xs whitespace-nowrap">
                    <i className="fa-solid fa-eraser md:mr-2"></i> <span className="hidden md:inline">WYCZYŚĆ</span>
                </button>
            </Tooltip>

            <Tooltip content="Zrób zdjęcie (Kamera)" position="top">
                 <button 
                    onClick={handleCameraClick}
                    disabled={isLoading}
                    className="px-3 md:px-4 py-2.5 bg-white/5 border border-white/20 text-gray-300 font-bold rounded-lg hover:bg-white/10 hover:text-tissaia-accent transition-colors text-xs whitespace-nowrap"
                >
                    <i className="fa-solid fa-camera md:mr-2"></i> <span className="hidden md:inline">ZDJĘCIE</span>
                </button>
            </Tooltip>

            <Tooltip content="Wgraj pliki lokalne" position="top">
                <button 
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className="group relative px-4 md:px-6 py-2.5 bg-tissaia-accent/10 border border-tissaia-accent/50 text-tissaia-accent font-bold rounded-lg overflow-hidden transition-all hover:bg-tissaia-accent/20 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs tracking-wider"
                >
                    <div className="absolute inset-0 w-full h-full bg-tissaia-accent/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="relative flex items-center">
                        <i className="fa-solid fa-upload md:mr-2"></i> <span className="hidden md:inline">UPLOAD</span><span className="md:hidden">WGRAJ</span>
                    </span>
                </button>
            </Tooltip>
        </div>
      </div>

      {/* List / Grid Container */}
      <div 
        className={`flex-1 rounded-xl glass-panel overflow-hidden flex flex-col relative min-h-[400px] transition-all duration-300 ${isDragging ? 'border-tissaia-accent shadow-[0_0_30px_rgba(0,255,163,0.25)] bg-tissaia-accent/5' : ''}`}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in pointer-events-none">
                <div className="relative">
                     <i className="fa-solid fa-cloud-arrow-up text-7xl text-tissaia-accent mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(0,255,163,0.5)]"></i>
                     <div className="absolute inset-0 bg-tissaia-accent/20 blur-xl rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-[0.2em] font-mono mb-2">UPUŚĆ PLIKI ŹRÓDŁOWE</h3>
                <p className="text-sm text-gray-400 font-mono tracking-widest border border-tissaia-accent/30 px-4 py-1 rounded bg-black/50">INICJOWANIE PROTOKOŁU</p>
            </div>
        )}

        <div className="overflow-x-auto h-full custom-scrollbar p-2 md:p-0">
            {/* --- DESKTOP TABLE VIEW --- */}
            <table className="w-full text-left text-sm text-gray-400 hidden md:table">
                <thead className="bg-white/5 text-gray-200 uppercase font-mono text-sm tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="px-4 py-5 border-b border-white/5 w-10">
                            <input type="checkbox" className="accent-tissaia-accent cursor-pointer" 
                                checked={selectedIds.size === filteredFiles.length && filteredFiles.length > 0} 
                                onChange={handleToggleAll} 
                            />
                        </th>
                        <th className="px-6 py-5 border-b border-white/5 w-80">Podgląd (Kliknij)</th>
                        <th className="px-6 py-5 border-b border-white/5">Nazwa Pliku</th>
                        <th className="px-6 py-5 border-b border-white/5">Status</th>
                        <th className="px-6 py-5 border-b border-white/5 text-center text-yellow-500">
                             <Tooltip content="Phase Pre-A: Ground Truth" position="top">
                                <span><i className="fa-solid fa-images mr-1"></i>OCZEKIWANA ILOŚĆ ZDJĘĆ</span>
                             </Tooltip>
                        </th>
                        <th className="px-6 py-5 border-b border-white/5 text-center">Wykryto</th>
                        <th className="px-6 py-5 border-b border-white/5 text-center">Akcje</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {isLoading && filteredFiles.length === 0 ? (
                        Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                    ) : (
                        <>
                            {filteredFiles.map((file) => (
                                <tr key={file.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(file.id) ? 'bg-white/5' : ''}`}>
                                    <td className="px-4 py-6 align-middle">
                                        <input type="checkbox" className="accent-tissaia-accent cursor-pointer scale-125" 
                                            checked={selectedIds.has(file.id)} 
                                            onChange={() => handleToggleSelect(file.id)}
                                        />
                                    </td>
                                    {/* Massive Thumbnail Area */}
                                    <td className="px-6 py-6 cursor-zoom-in" onClick={() => openPreview(file)}>
                                        <div className="w-72 h-72 bg-black/40 rounded-xl flex items-center justify-center text-gray-600 overflow-hidden border border-white/10 group-hover:border-tissaia-accent/50 transition-all shadow-lg group-hover:shadow-[0_0_15px_rgba(0,255,163,0.15)] relative">
                                            {file.thumbnailUrl ? (
                                                <img src={file.thumbnailUrl} alt={file.filename} className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <i className={`fa-regular fa-image text-3xl ${file.status === ScanStatus.UPLOADING ? 'animate-pulse text-gray-500' : 'group-hover:text-tissaia-accent'}`}></i>
                                            )}
                                            {file.status === ScanStatus.UPLOADING && (
                                                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-tissaia-accent text-2xl"></i></div>
                                            )}
                                            {file.status === ScanStatus.PRE_ANALYZING && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                                    <i className="fa-solid fa-microchip fa-spin text-cyan-400 text-3xl mb-2"></i>
                                                    <span className="text-cyan-400 font-mono text-xs tracking-widest">SZYBKI SKAN</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 bg-black/70 text-tissaia-accent text-[10px] text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                                                POWIĘKSZ
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-6 font-medium text-gray-200 cursor-pointer align-middle" onClick={() => file.status !== ScanStatus.UPLOADING && onSelect(file.id)}>
                                        <div className="text-2xl font-bold text-white tracking-wide mb-2 group-hover:text-tissaia-accent transition-colors">
                                            {file.filename}
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 font-mono">
                                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5"><i className="fa-solid fa-hard-drive mr-1"></i>{file.size}</span>
                                            <span><i className="fa-regular fa-clock mr-1"></i>{file.uploadDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 min-w-[200px] align-middle">
                                        {file.status === ScanStatus.UPLOADING ? (
                                            <div className="w-full">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[10px] font-mono text-tissaia-accent">WGRYWANIE...</span>
                                                    <span className="text-[10px] font-mono text-gray-400">{Math.round(file.uploadProgress || 0)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-tissaia-accent h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,255,163,0.5)]" style={{ width: `${file.uploadProgress || 0}%` }}></div>
                                                </div>
                                            </div>
                                        ) : file.status === ScanStatus.DETECTING ? (
                                            <div className="w-full">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs font-mono text-purple-400 font-bold tracking-wider animate-pulse">TOTAL WAR PROTOCOL</span>
                                                    <span className="text-xs font-mono text-purple-400"><i className="fa-solid fa-crosshairs fa-spin"></i></span>
                                                </div>
                                                <div className="w-full bg-purple-900/30 h-2 rounded-full overflow-hidden relative border border-purple-500/30">
                                                    <div className="absolute top-0 bottom-0 bg-purple-500 w-1/3 animate-progress shadow-[0_0_15px_#a855f7]"></div>
                                                </div>
                                            </div>
                                        ) : file.status === ScanStatus.PRE_ANALYZING ? (
                                             <div className="text-cyan-400 font-mono text-xs animate-pulse">
                                                 <i className="fa-solid fa-bolt mr-2"></i>ANALIZA WSTĘPNA
                                             </div>
                                        ) : (
                                            <span className={`px-4 py-2 rounded text-sm font-bold border font-mono tracking-wide whitespace-nowrap ${STATUS_STYLES[file.status] || 'text-gray-400'}`}>
                                                {file.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-center align-middle">
                                        {file.status === ScanStatus.PENDING_VERIFICATION || file.status === ScanStatus.CROPPED ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="20"
                                                    value={inputCounts[file.id] || ''}
                                                    onChange={(e) => handleCountChange(file.id, e.target.value)}
                                                    className="w-20 py-2 bg-black border border-yellow-500/50 text-yellow-500 text-center rounded-lg text-2xl font-mono focus:outline-none focus:border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                                                    placeholder="#"
                                                />
                                                <button 
                                                    onClick={() => handleVerify(file.id)}
                                                    disabled={!inputCounts[file.id]}
                                                    className="w-10 h-10 rounded bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Weryfikuj Manifest"
                                                >
                                                    <i className="fa-solid fa-check text-lg"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="font-mono text-3xl text-tissaia-accent font-bold">{file.expectedCount || '-'}</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-6 text-center font-mono text-white font-bold text-2xl align-middle">
                                        {file.detectedCount > 0 ? file.detectedCount : '-'}
                                        {file.expectedCount && file.detectedCount > 0 && (
                                            file.detectedCount === file.expectedCount 
                                            ? <i className="fa-solid fa-check-circle text-tissaia-accent ml-2 text-base" title="Total War Success"></i>
                                            : <i className="fa-solid fa-triangle-exclamation text-red-500 ml-2 text-base" title="Mismatch"></i>
                                        )}
                                    </td>
                                    
                                    <td className="px-6 py-6 text-center align-middle">
                                        <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Tooltip content="Usuń" position="top">
                                                <button onClick={() => onDelete([file.id])} className="text-gray-500 hover:text-red-400 p-2 transition-colors">
                                                    <i className="fa-solid fa-trash text-lg"></i>
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Ponów Total War" position="top">
                                                <button onClick={() => onRetry([file.id])} className="text-gray-500 hover:text-blue-400 p-2 transition-colors">
                                                    <i className="fa-solid fa-rotate-right text-lg"></i>
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </>
                    )}
                </tbody>
            </table>

            {/* --- MOBILE CARD VIEW --- */}
            <div className="md:hidden flex flex-col space-y-4 pb-20">
                {isLoading && filteredFiles.length === 0 && (
                     <div className="text-center text-gray-500 py-10">Wczytywanie...</div>
                )}
                {filteredFiles.map(file => (
                    <div key={file.id} className="glass-panel p-4 rounded-xl flex flex-col space-y-3 relative overflow-hidden">
                        {/* Header Row */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <input type="checkbox" className="accent-tissaia-accent scale-125"
                                    checked={selectedIds.has(file.id)}
                                    onChange={() => handleToggleSelect(file.id)}
                                />
                                <div className="truncate max-w-[180px]">
                                    <div className="font-bold text-white text-sm truncate">{file.filename}</div>
                                    <div className="text-[10px] text-gray-500">{file.size} • {file.uploadDate}</div>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => onDelete([file.id])} className="text-gray-500 hover:text-red-400 px-2"><i className="fa-solid fa-trash"></i></button>
                            </div>
                        </div>

                        {/* Image Preview */}
                        <div className="w-full h-48 bg-black/40 rounded-lg overflow-hidden relative border border-white/5" onClick={() => openPreview(file)}>
                             {file.thumbnailUrl ? (
                                <img src={file.thumbnailUrl} alt={file.filename} className="w-full h-full object-contain" />
                             ) : (
                                <div className="flex items-center justify-center h-full"><i className="fa-regular fa-image text-2xl text-gray-600"></i></div>
                             )}
                             {/* Status Badges */}
                             <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
                                 <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${STATUS_STYLES[file.status]}`}>
                                     {file.status}
                                 </span>
                             </div>
                        </div>

                        {/* Inputs Row */}
                        <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                             <div className="flex flex-col">
                                 <span className="text-[10px] text-yellow-500 font-mono">OCZEKIWANA</span>
                                 {file.status === ScanStatus.PENDING_VERIFICATION || file.status === ScanStatus.CROPPED ? (
                                     <div className="flex items-center space-x-1 mt-1">
                                         <input 
                                            type="number" 
                                            className="w-10 bg-black text-yellow-500 text-center border border-yellow-500/50 rounded font-bold text-sm"
                                            value={inputCounts[file.id] || ''}
                                            onChange={(e) => handleCountChange(file.id, e.target.value)}
                                         />
                                         <button onClick={() => handleVerify(file.id)} className="w-6 h-6 bg-yellow-500/20 text-yellow-500 rounded flex items-center justify-center">
                                             <i className="fa-solid fa-check text-xs"></i>
                                         </button>
                                     </div>
                                 ) : (
                                     <span className="text-xl font-bold text-tissaia-accent">{file.expectedCount || '-'}</span>
                                 )}
                             </div>

                             <div className="flex flex-col items-end">
                                 <span className="text-[10px] text-gray-400 font-mono">WYKRYTO</span>
                                 <span className="text-xl font-bold text-white">{file.detectedCount}</span>
                             </div>
                        </div>

                        {/* Action Buttons */}
                         <button 
                            onClick={() => file.status !== ScanStatus.UPLOADING && onSelect(file.id)}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-mono text-tissaia-accent border border-white/10 rounded-lg"
                        >
                            OTWÓRZ MAPĘ CIĘCIA
                        </button>
                    </div>
                ))}
            </div>

            {filteredFiles.length === 0 && !isFiltering && (
                <div className="px-6 py-20 text-center text-gray-500">
                    <i className="fa-solid fa-box-open text-4xl mb-4 opacity-20"></i>
                    <p className="font-mono text-sm">BRAK DANYCH</p>
                </div>
            )}
        </div>

        {/* --- INSPECTION MODAL --- */}
        {previewFile && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fade-in">
                <div className="w-full h-full max-w-7xl flex flex-col md:flex-row gap-4 md:gap-8">
                    {/* Image Container */}
                    <div className="flex-1 relative bg-gray-900 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                         <img 
                            src={previewFile.thumbnailUrl} 
                            alt="Full Preview" 
                            className="max-w-full max-h-full object-contain"
                         />
                         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-white font-mono text-sm border border-white/10">
                            {previewFile.filename}
                         </div>
                    </div>

                    {/* Controls Panel */}
                    <div className="w-full md:w-96 flex flex-col justify-center space-y-4 md:space-y-6 shrink-0 bg-black/80 md:bg-transparent p-4 md:p-0 rounded-t-2xl md:rounded-none absolute bottom-0 md:relative">
                        <div className="glass-panel p-6 rounded-2xl border border-tissaia-accent/30 shadow-[0_0_30px_rgba(0,255,163,0.1)]">
                            <h3 className="text-xl font-bold text-tissaia-accent mb-2 font-mono tracking-widest uppercase border-b border-tissaia-accent/30 pb-2">
                                <i className="fa-solid fa-magnifying-glass-chart mr-2"></i>Weryfikacja
                            </h3>
                            <p className="text-gray-400 text-xs mb-6 font-mono">
                                Manualna weryfikacja "Ground Truth". Policz widoczne obiekty na skanie.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-yellow-500 text-xs font-bold mb-2 font-mono uppercase tracking-wider">
                                        Oczekiwana Ilość Zdjęć
                                    </label>
                                    <input 
                                        type="number" 
                                        autoFocus
                                        min="1"
                                        max="50"
                                        value={modalCount}
                                        onChange={(e) => setModalCount(e.target.value)}
                                        className="w-full bg-black border-2 border-yellow-500 text-yellow-500 text-center rounded-xl py-4 text-3xl font-mono font-bold focus:outline-none focus:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all"
                                        placeholder="0"
                                    />
                                </div>

                                <button 
                                    onClick={handleModalVerify}
                                    disabled={!modalCount}
                                    className="w-full py-4 bg-tissaia-accent text-black font-bold text-lg rounded-xl hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,163,0.4)] disabled:opacity-50 disabled:scale-100 disabled:bg-gray-700 disabled:text-gray-500"
                                >
                                    ZATWIERDŹ I ZAMKNIJ
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={closePreview}
                            className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-mono text-sm rounded-xl hover:bg-white/10 hover:text-white transition-colors"
                        >
                            ANULUJ / POWRÓT
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default FileListView;