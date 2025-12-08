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
  onVerify?: (id: string, count: number) => void; // New prop for Phase Pre-A
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
    <td className="px-4 py-4"><div className="w-4 h-4 bg-white/5 rounded"></div></td>
    <td className="px-6 py-4">
      <div className="w-12 h-12 bg-white/5 rounded-lg"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
      <div className="h-2 bg-white/5 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-4"><div className="h-6 bg-white/5 rounded w-20"></div></td>
    <td className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-8 mx-auto"></div></td>
    <td className="px-6 py-4"><div className="h-3 bg-white/5 rounded w-12 ml-auto"></div></td>
    <td className="px-6 py-4"><div className="h-6 w-6 bg-white/5 rounded-full mx-auto"></div></td>
  </tr>
);

const FileListView: React.FC<FileListViewProps> = ({ files, isLoading, onUpload, onSelect, onDelete, onClear, onRetry, onVerify }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState<ScanFile[]>(files);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Local state for inputs before verification
  const [inputCounts, setInputCounts] = useState<Record<string, number>>({});

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

  // Sync selected IDs if files are deleted
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onUpload(Array.from(event.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-6 rounded-xl glass-panel gap-4 shrink-0">
        <div>
            <h2 className="text-xl font-bold text-white tracking-wide"><i className="fa-solid fa-server mr-3 text-tissaia-accent"></i>INGEST DANYCH</h2>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1 font-mono">
                <span className="bg-yellow-500/20 text-yellow-500 px-1 rounded">PHASE PRE-A</span>
                <span>OCZEKIWANIE NA GROUND TRUTH</span>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
                <div className="flex space-x-2 animate-fade-in mr-2">
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
            <div className="relative group flex-1 min-w-[200px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-tissaia-accent transition-colors">
                    {isFiltering ? <i className="fa-solid fa-circle-notch fa-spin text-tissaia-accent"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
                </div>
                <input 
                    type="text" 
                    placeholder="WYSZUKAJ..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-black/40 border border-gray-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-tissaia-accent/50 focus:bg-black/60 text-xs font-mono transition-all disabled:opacity-50"
                />
            </div>

            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,.tiff,.tif,.png,.jpg,.jpeg" onChange={handleFileChange} />
            
            <Tooltip content="Wyczyść całą listę" position="top">
                <button onClick={onClear} className="px-4 py-2.5 bg-gray-800 border border-gray-600 text-gray-400 font-bold rounded-lg hover:bg-gray-700 hover:text-white transition-colors text-xs whitespace-nowrap">
                    <i className="fa-solid fa-eraser mr-2"></i> WYCZYŚĆ
                </button>
            </Tooltip>

            <Tooltip content="Wgraj pliki lokalne" position="top">
                <button 
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className="group relative px-6 py-2.5 bg-tissaia-accent/10 border border-tissaia-accent/50 text-tissaia-accent font-bold rounded-lg overflow-hidden transition-all hover:bg-tissaia-accent/20 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs tracking-wider"
                >
                    <div className="absolute inset-0 w-full h-full bg-tissaia-accent/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="relative flex items-center">
                        <i className="fa-solid fa-upload mr-2"></i> UPLOAD
                    </span>
                </button>
            </Tooltip>
        </div>
      </div>

      {/* List */}
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

        <div className="overflow-x-auto h-full custom-scrollbar">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase font-mono text-xs tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        <th className="px-4 py-5 border-b border-white/5 w-10">
                            <input type="checkbox" className="accent-tissaia-accent cursor-pointer" 
                                checked={selectedIds.size === filteredFiles.length && filteredFiles.length > 0} 
                                onChange={handleToggleAll} 
                            />
                        </th>
                        <th className="px-6 py-5 border-b border-white/5">Podgląd</th>
                        <th className="px-6 py-5 border-b border-white/5">Nazwa Pliku</th>
                        <th className="px-6 py-5 border-b border-white/5">Status</th>
                        <th className="px-6 py-5 border-b border-white/5 text-center text-yellow-500">
                             <Tooltip content="Phase Pre-A: Ground Truth" position="top">
                                <span><i className="fa-solid fa-triangle-exclamation mr-1"></i>OCZEKIWANA</span>
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
                                    <td className="px-4 py-4">
                                        <input type="checkbox" className="accent-tissaia-accent cursor-pointer" 
                                            checked={selectedIds.has(file.id)} 
                                            onChange={() => handleToggleSelect(file.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => file.status !== ScanStatus.UPLOADING && onSelect(file.id)}>
                                        <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center text-gray-600 overflow-hidden border border-white/10 group-hover:border-tissaia-accent/50 transition-colors relative">
                                            {file.thumbnailUrl ? (
                                                <img src={file.thumbnailUrl} alt={file.filename} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <i className={`fa-regular fa-image text-xl ${file.status === ScanStatus.UPLOADING ? 'animate-pulse text-gray-500' : 'group-hover:text-tissaia-accent'}`}></i>
                                            )}
                                            {file.status === ScanStatus.UPLOADING && (
                                                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-tissaia-accent"></i></div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-200 cursor-pointer" onClick={() => file.status !== ScanStatus.UPLOADING && onSelect(file.id)}>
                                        {file.filename}
                                        <div className="text-[10px] text-gray-500 mt-1 font-mono">{file.size} • {file.uploadDate}</div>
                                    </td>
                                    <td className="px-6 py-4 min-w-[200px]">
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
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border font-mono tracking-wide whitespace-nowrap ${STATUS_STYLES[file.status] || 'text-gray-400'}`}>
                                                {file.status}
                                            </span>
                                        )}
                                    </td>
                                    {/* Phase Pre-A Input */}
                                    <td className="px-6 py-4 text-center">
                                        {file.status === ScanStatus.PENDING_VERIFICATION ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="20"
                                                    value={inputCounts[file.id] || ''}
                                                    onChange={(e) => handleCountChange(file.id, e.target.value)}
                                                    className="w-12 bg-black border border-yellow-500/50 text-yellow-500 text-center rounded text-xs font-mono focus:outline-none focus:border-yellow-400"
                                                    placeholder="#"
                                                />
                                                <button 
                                                    onClick={() => handleVerify(file.id)}
                                                    disabled={!inputCounts[file.id]}
                                                    className="w-6 h-6 rounded bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Weryfikuj Manifest"
                                                >
                                                    <i className="fa-solid fa-check text-[10px]"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="font-mono text-tissaia-accent">{file.expectedCount}</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-center font-mono text-white font-bold">
                                        {file.detectedCount > 0 ? file.detectedCount : '-'}
                                        {file.expectedCount && file.detectedCount > 0 && (
                                            file.detectedCount === file.expectedCount 
                                            ? <i className="fa-solid fa-check-circle text-tissaia-accent ml-2 text-xs" title="Total War Success"></i>
                                            : <i className="fa-solid fa-triangle-exclamation text-red-500 ml-2 text-xs" title="Mismatch"></i>
                                        )}
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Tooltip content="Usuń" position="top">
                                                <button onClick={() => onDelete([file.id])} className="text-gray-500 hover:text-red-400 p-2 transition-colors">
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Ponów Total War" position="top">
                                                <button onClick={() => onRetry([file.id])} className="text-gray-500 hover:text-blue-400 p-2 transition-colors">
                                                    <i className="fa-solid fa-rotate-right"></i>
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredFiles.length === 0 && !isFiltering && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                                        <i className="fa-solid fa-box-open text-4xl mb-4 opacity-20"></i>
                                        <p className="font-mono text-sm">BRAK DANYCH</p>
                                    </td>
                                </tr>
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default FileListView;