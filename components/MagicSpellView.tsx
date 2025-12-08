import React from 'react';
import { ProcessedPhoto } from '../types';

interface MagicSpellViewProps {
  photos: ProcessedPhoto[];
}

const MagicSpellView: React.FC<MagicSpellViewProps> = ({ photos }) => {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="p-8 rounded-xl glass-panel relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
            <i className="fa-solid fa-wand-magic-sparkles text-9xl text-tissaia-accent transform rotate-12"></i>
        </div>
        <h2 className="text-3xl font-bold text-white relative z-10 font-serif tracking-wider">
            <span className="text-tissaia-accent drop-shadow-[0_0_10px_rgba(0,255,163,0.4)]">Magic</span> Spell
        </h2>
        <p className="text-gray-400 text-sm relative z-10 max-w-xl mt-2 font-mono">
            Generative restoration sequence complete. Artifacts enhanced.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 pb-4">
        {photos.map((photo) => (
            <div key={photo.id} className="group glass-panel rounded-xl overflow-hidden hover:border-tissaia-accent/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,163,0.15)] flex flex-col">
                <div className="relative aspect-[4/5] bg-black/50 overflow-hidden">
                    {/* Before/After Split Placeholder */}
                    <div className="absolute inset-0 flex">
                        <div className="w-1/2 bg-gray-900/50 border-r border-white/10 flex items-center justify-center relative">
                            <span className="text-[10px] text-gray-500 font-mono absolute bottom-2 left-2">RAW</span>
                        </div>
                        <div className="w-1/2 bg-gray-800/50 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-tissaia-accent/5"></div>
                            <span className="text-[10px] text-tissaia-accent font-bold font-mono absolute bottom-2 right-2">PROCESSED</span>
                        </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3 backdrop-blur-sm">
                        <button 
                          className="bg-tissaia-accent text-black px-6 py-2 rounded text-xs font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,255,163,0.5)]"
                          title="Export Image"
                        >
                            <i className="fa-solid fa-download mr-2"></i> EXPORT
                        </button>
                        <button 
                          className="text-white hover:text-tissaia-accent text-xs font-bold font-mono border border-white/20 hover:border-tissaia-accent px-4 py-2 rounded transition-colors"
                          title="Refine Settings"
                        >
                            <i className="fa-solid fa-sliders mr-2"></i> REFINE
                        </button>
                    </div>

                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-[9px] text-tissaia-accent font-mono border border-tissaia-accent/20">
                        {photo.filterUsed}
                    </div>
                </div>
                <div className="p-4 bg-white/5 border-t border-white/5 flex-1">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="text-sm font-bold text-gray-200">IMG_{photo.id.split('-')[1]}</h4>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{photo.date}</p>
                        </div>
                        <i className="fa-solid fa-circle-check text-tissaia-accent text-lg drop-shadow-[0_0_8px_rgba(0,255,163,0.4)]" title="Restoration Complete"></i>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default MagicSpellView;