import React, { useState, useEffect } from 'react';
import { ScanFile, DetectedCrop, ScanStatus } from '../types';

interface CropMapViewProps {
  scan: ScanFile | null;
  crops: DetectedCrop[];
  onNext?: () => void;
  onPrev?: () => void;
  onVerify?: (id: string, count: number) => void;
  onApprove?: (id: string) => void; // New prop to trigger restoration
}

const CropMapView: React.FC<CropMapViewProps> = ({ scan, crops, onNext, onPrev, onVerify, onApprove }) => {
  const [showData, setShowData] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [manualCount, setManualCount] = useState<string>('');

  useEffect(() => {
      if (scan) {
          setManualCount(scan.expectedCount ? scan.expectedCount.toString() : '');
      }
  }, [scan]);

  const handleRescan = () => {
      // Logic handled by verify (re-triggering total war with current expected count)
      if (scan && onVerify && manualCount) {
          const count = parseInt(manualCount);
          if (!isNaN(count) && count > 0) {
              setIsRescanning(true);
              onVerify(scan.id, count);
              setTimeout(() => setIsRescanning(false), 2000); // Visual feedback
          }
      }
  };

  const handleConfirmCount = () => {
      if (scan && onVerify && manualCount) {
          const count = parseInt(manualCount);
          if (!isNaN(count) && count > 0) {
              onVerify(scan.id, count);
          }
      }
  };

  const handleApproveAndGenerate = () => {
      if (scan && onApprove) {
          onApprove(scan.id);
      }
  };

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 glass-panel rounded-xl">
        <i className="fa-solid fa-satellite-dish text-6xl mb-6 opacity-20 animate-pulse-slow"></i>
        <p className="font-mono tracking-widest text-sm">OCZEKIWANIE NA WYBÓR CELU</p>
      </div>
    );
  }

  const getStyle = (crop: DetectedCrop) => {
    return {
        top: `${(crop.ymin / 1000) * 100}%`,
        left: `${(crop.xmin / 1000) * 100}%`,
        width: `${((crop.xmax - crop.xmin) / 1000) * 100}%`,
        height: `${((crop.ymax - crop.ymin) / 1000) * 100}%`,
        transform: 'none'
    };
  };

  // Allow approval if status is CROPPED (Total War done) or PENDING_VERIFICATION (Pre-scan done)
  // Assuming user is happy with what they see
  const canApprove = (scan.status === ScanStatus.CROPPED || scan.status === ScanStatus.PENDING_VERIFICATION) && crops.length > 0;

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6">
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-4 md:p-6 rounded-xl glass-panel shrink-0 gap-4">
        <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center">
                <i className="fa-solid fa-expand mr-3 text-tissaia-accent"></i>
                MAPA SEGMENTACJI
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs text-gray-400 mt-1 font-mono">
                <span>ID: {scan.id}</span>
                <span className="text-gray-600">|</span>
                <span>Wykryto: <span className="text-tissaia-accent font-bold">{crops.length}</span></span>
                {scan.expectedCount && (
                    <>
                        <span className="text-gray-600">|</span>
                        <span className="text-yellow-500">Oczekiwana: {scan.expectedCount}</span>
                    </>
                )}
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
             {/* MANUAL VERIFICATION INPUT */}
             <div className="flex items-center bg-black/40 border border-yellow-500/30 rounded px-3 py-1 group focus-within:border-yellow-500 transition-colors flex-1 xl:flex-none">
                 <span className="text-[10px] font-mono text-yellow-500 mr-2 uppercase tracking-wide whitespace-nowrap">
                    <i className="fa-solid fa-pen-to-square mr-1"></i>Ilość Zdjęć
                 </span>
                 <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={manualCount}
                    onChange={(e) => setManualCount(e.target.value)}
                    className="w-10 md:w-12 bg-transparent text-yellow-500 font-bold font-mono text-center focus:outline-none"
                    placeholder="#"
                 />
                 <button 
                    onClick={handleConfirmCount}
                    disabled={!manualCount}
                    className="ml-2 w-6 h-6 rounded flex items-center justify-center bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-30"
                    title="Przeładuj analizę AI (Total War)"
                 >
                    <i className="fa-solid fa-rotate-right text-xs"></i>
                 </button>
             </div>

            <button 
              onClick={handleApproveAndGenerate}
              disabled={!canApprove}
              className="flex-1 xl:flex-none px-4 md:px-6 py-2 rounded bg-tissaia-accent text-black font-bold font-mono text-xs hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,255,163,0.3)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center justify-center whitespace-nowrap"
            >
                <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                ZATWIERDŹ WSZYSTKIE I GENERUJ
            </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl relative overflow-hidden flex items-center justify-center p-4 md:p-8 border border-white/10 group">
        
        {/* Navigation Arrows */}
        {onPrev && (
            <button onClick={onPrev} className="absolute left-2 md:left-4 z-50 p-3 md:p-4 rounded-full bg-black/50 hover:bg-tissaia-accent text-white hover:text-black transition-all md:opacity-0 group-hover:opacity-100 md:-translate-x-10 group-hover:translate-x-0">
                <i className="fa-solid fa-chevron-left text-lg md:text-xl"></i>
            </button>
        )}
        {onNext && (
            <button onClick={onNext} className="absolute right-2 md:right-4 z-50 p-3 md:p-4 rounded-full bg-black/50 hover:bg-tissaia-accent text-white hover:text-black transition-all md:opacity-0 group-hover:opacity-100 md:translate-x-10 group-hover:translate-x-0">
                <i className="fa-solid fa-chevron-right text-lg md:text-xl"></i>
            </button>
        )}

        {/* Raw Data Overlay */}
        {showData && (
             <div className="absolute top-4 right-4 bottom-4 w-64 bg-black/90 backdrop-blur-md border border-white/10 z-50 rounded-lg p-4 overflow-y-auto font-mono text-[10px] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                 <h3 className="text-tissaia-accent font-bold mb-2 border-b border-white/10 pb-1">RAW VECTOR DATA</h3>
                 {crops.map((crop, i) => (
                     <div key={i} className="mb-2 pb-2 border-b border-white/5 text-gray-400">
                         <div className="text-white font-bold">{crop.label}</div>
                         <div>CONF: {(crop.confidence * 100).toFixed(1)}%</div>
                         <div>BOX: [{crop.xmin}, {crop.ymin}, {crop.xmax}, {crop.ymax}]</div>
                     </div>
                 ))}
             </div>
        )}

         {/* Toggle Data Button Overlay (Moved to avoid header clutter) */}
        <button 
             onClick={() => setShowData(!showData)}
             className="absolute bottom-4 right-4 z-40 bg-black/50 hover:bg-black/70 text-gray-400 px-3 py-1 rounded text-[10px] font-mono border border-white/10"
        >
             {showData ? 'HIDE DATA' : 'SHOW DATA'}
        </button>

        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 163, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 163, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Scan Area Container */}
        <div className="relative max-h-full max-w-full overflow-auto custom-scrollbar flex justify-center z-10">
            <div className="relative inline-block bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5">
                
                {/* The Image */}
                {scan.thumbnailUrl ? (
                    <img 
                        src={scan.thumbnailUrl} 
                        alt="Analysis Target" 
                        className="max-h-[60vh] md:max-h-[70vh] w-auto object-contain block opacity-90"
                    />
                ) : (
                    <div className="w-[300px] md:w-[600px] h-[300px] md:h-[400px] flex flex-col items-center justify-center bg-gray-900 border border-dashed border-gray-700">
                        <i className="fa-regular fa-image text-4xl mb-2 text-gray-700"></i>
                        <span className="text-gray-500 font-mono">BRAK PODGLĄDU</span>
                    </div>
                )}
                
                {/* Detected Crops Overlay */}
                <div className="absolute inset-0">
                    {crops.map((crop) => (
                        <div 
                            key={crop.id}
                            className="absolute border border-tissaia-accent/80 bg-tissaia-accent/10 hover:bg-tissaia-accent/20 cursor-crosshair transition-all group/crop backdrop-blur-[1px] shadow-[0_0_10px_rgba(0,255,163,0.2)]"
                            style={getStyle(crop)}
                        >
                            {/* Label Tag - Uses high Z-index to float above everything */}
                            <div className="absolute -top-6 left-0 flex items-center space-x-1 opacity-0 group-hover/crop:opacity-100 transition-opacity z-[60] whitespace-nowrap">
                                <span className="bg-tissaia-accent text-black text-[9px] font-bold px-1.5 py-0.5 font-mono shadow-[0_0_10px_rgba(0,255,163,0.5)]">
                                    {crop.label ? crop.label.toUpperCase() : 'UNK'}
                                </span>
                                <span className="bg-black/90 text-tissaia-accent border border-tissaia-accent/30 text-[9px] px-1.5 py-0.5 font-mono">
                                    {Math.round(crop.confidence * 100)}%
                                </span>
                            </div>
                            
                            {/* Corner Reticles */}
                            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-tissaia-accent"></div>
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-tissaia-accent"></div>
                            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-tissaia-accent"></div>
                            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-tissaia-accent"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CropMapView;