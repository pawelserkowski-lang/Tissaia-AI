import React, { useState } from 'react';
import { ScanFile, DetectedCrop } from '../types';

interface CropMapViewProps {
  scan: ScanFile | null;
  crops: DetectedCrop[];
}

const CropMapView: React.FC<CropMapViewProps> = ({ scan, crops }) => {
  const [showData, setShowData] = useState(false);

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 glass-panel rounded-xl">
        <i className="fa-solid fa-satellite-dish text-6xl mb-6 opacity-20 animate-pulse-slow"></i>
        <p className="font-mono tracking-widest text-sm">AWAITING TARGET SELECTION</p>
      </div>
    );
  }

  // Convert Gemini 1000-scale to percentage strings
  const getStyle = (crop: DetectedCrop) => {
    return {
        top: `${(crop.ymin / 1000) * 100}%`,
        left: `${(crop.xmin / 1000) * 100}%`,
        width: `${((crop.xmax - crop.xmin) / 1000) * 100}%`,
        height: `${((crop.ymax - crop.ymin) / 1000) * 100}%`,
        transform: 'none'
    };
  };

  return (
    <div className="flex flex-col h-full space-y-6">
       <div className="flex justify-between items-center p-6 rounded-xl glass-panel">
        <div>
            <h2 className="text-xl font-bold text-white tracking-wide"><i className="fa-solid fa-expand mr-3 text-tissaia-accent"></i>SEGMENTATION MAP</h2>
            <p className="text-xs text-gray-400 mt-1 font-mono">ID: {scan.id} // Detected Entities: {crops.length}</p>
        </div>
        <div className="flex space-x-3">
             <button 
              onClick={() => setShowData(!showData)}
              className={`px-4 py-2 rounded border text-xs font-mono transition-colors ${showData ? 'bg-tissaia-accent text-black border-tissaia-accent' : 'bg-black/40 text-gray-300 border-white/10'}`}
              title="Toggle Raw Data"
            >
                <i className="fa-solid fa-code mr-2"></i>DATA STREAM
            </button>
            <button 
              className="bg-black/40 hover:bg-black/60 text-gray-300 px-4 py-2 rounded border border-white/10 text-xs font-mono transition-colors"
              title="Rescan Image"
            >
                <i className="fa-solid fa-rotate-left mr-2"></i>RESCAN
            </button>
            <button 
              className="bg-tissaia-accent/20 hover:bg-tissaia-accent/30 text-tissaia-accent px-4 py-2 rounded border border-tissaia-accent/50 text-xs font-bold font-mono tracking-wide shadow-[0_0_15px_rgba(0,255,163,0.1)]"
              title="Confirm Selection"
            >
                <i className="fa-solid fa-check mr-2"></i>CONFIRM
            </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl relative overflow-hidden flex items-center justify-center p-8 border border-white/10">
        
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

        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 163, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 163, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Scan Area Container */}
        {/* We use fit-content on wrapper to ensure overlays match image size exactly */}
        <div className="relative max-h-full max-w-full overflow-auto custom-scrollbar flex justify-center">
            <div className="relative inline-block bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5">
                
                {/* The Image */}
                {scan.thumbnailUrl ? (
                    <img 
                        src={scan.thumbnailUrl} 
                        alt="Analysis Target" 
                        className="max-h-[70vh] w-auto object-contain block opacity-90"
                    />
                ) : (
                    <div className="w-[600px] h-[400px] flex flex-col items-center justify-center bg-gray-900 border border-dashed border-gray-700">
                        <i className="fa-regular fa-image text-4xl mb-2 text-gray-700"></i>
                        <span className="text-gray-500 font-mono">PREVIEW UNAVAILABLE</span>
                    </div>
                )}
                
                {/* Detected Crops Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    {crops.map((crop) => (
                        <div 
                            key={crop.id}
                            className="absolute border border-tissaia-accent/80 bg-tissaia-accent/10 hover:bg-tissaia-accent/20 pointer-events-auto cursor-crosshair transition-all group backdrop-blur-[1px] shadow-[0_0_10px_rgba(0,255,163,0.2)]"
                            style={getStyle(crop)}
                        >
                            {/* Label Tag */}
                            <div className="absolute -top-6 left-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
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