import React, { useState } from 'react';
import JSZip from 'jszip';
import { ProcessedPhoto } from '../types';
import { rotateImage } from '../utils/image/processing';

interface MagicSpellViewProps {
  photos: ProcessedPhoto[];
}

const CompareImage = ({ before, after, filename, rotation }: { before: string, after: string, filename: string, rotation: number }) => {
    const [slider, setSlider] = useState(50);
    return (
      <div className="relative aspect-[4/5] group select-none bg-black/50 overflow-hidden cursor-ew-resize flex items-center justify-center">
         <img 
            src={after} 
            alt="Restored" 
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-300" 
            style={{ transform: `rotate(${rotation}deg)` }}
            draggable={false} 
         />
         <div className="absolute inset-0 w-full h-full" style={{ clipPath: `inset(0 ${100-slider}% 0 0)` }}>
            <img 
                src={before} 
                alt="Original" 
                className="absolute inset-0 w-full h-full object-contain transition-transform duration-300" 
                style={{ transform: `rotate(${rotation}deg)` }}
                draggable={false} 
            />
            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-mono border border-white/20 z-10">ORIGINAL</span>
         </div>
         <span className="absolute bottom-2 right-2 bg-tissaia-accent/90 text-black text-[10px] font-bold px-2 py-1 rounded font-mono shadow-lg z-10">RESTORED</span>
         <div className="absolute inset-y-0 w-0.5 bg-tissaia-accent shadow-[0_0_15px_#00ffa3] z-10 pointer-events-none" style={{ left: `${slider}%` }}>
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-tissaia-accent/20 backdrop-blur border border-tissaia-accent rounded-full flex items-center justify-center shadow-lg">
               <i className="fa-solid fa-arrows-left-right text-tissaia-accent text-xs"></i>
            </div>
         </div>
         <input type="range" min="0" max="100" value={slider} onChange={(e)=>setSlider(Number(e.target.value))} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
      </div>
    )
}

const MagicSpellView: React.FC<MagicSpellViewProps> = ({ photos }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [rotations, setRotations] = useState<Record<string, number>>({});

  const handleRotate = (id: string) => {
      setRotations(prev => ({ ...prev, [id]: (prev[id] || 0) + 90 }));
  };

  const handleDownloadZip = async () => {
    if (photos.length === 0) return;
    setIsZipping(true);

    try {
        const zip = new JSZip();
        const folderName = `EPS_Artifacts_${new Date().toISOString().slice(0,10)}`;
        const folder = zip.folder(folderName);

        await Promise.all(photos.map(async (photo) => {
            if (!photo.restoredUrl) return;
            try {
                const rotation = rotations[photo.id] || 0;
                let blob: Blob;
                const normalizedRotation = rotation % 360;

                if (normalizedRotation !== 0) {
                    blob = await rotateImage(photo.restoredUrl, normalizedRotation);
                } else {
                    const response = await fetch(photo.restoredUrl);
                    blob = await response.blob();
                }
                const filename = photo.filename || `${photo.id}.png`;
                folder?.file(filename, blob);
            } catch (err) {
                console.error(`Failed to pack file ${photo.id}`, err);
            }
        }));

        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error("ZIP Generation Failed:", error);
        alert("Błąd podczas generowania archiwum ZIP.");
    } finally {
        setIsZipping(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-end p-8 rounded-xl glass-panel relative overflow-hidden group shrink-0">
        <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white font-serif tracking-wider flex items-center">
                <span className="text-tissaia-accent drop-shadow-[0_0_10px_rgba(0,255,163,0.4)] mr-3">Magiczne</span> Zaklęcie
            </h2>
            <p className="text-gray-400 text-sm mt-2 font-mono">
                Sekwencja generatywnej restauracji zakończona. Artefakty usunięte.
            </p>
            <div className="mt-4 flex items-center space-x-2 text-[10px] text-gray-500 font-mono border border-white/10 rounded px-2 py-1 bg-black/40 w-fit">
                <i className="fa-solid fa-hard-drive text-gray-400"></i>
                <span>LOCAL_BUFFER: {photos.length} FILE(S) READY</span>
            </div>
        </div>
        
        <div className="relative z-10 flex flex-col items-end space-y-2">
             <button 
                onClick={handleDownloadZip}
                disabled={isZipping || photos.length === 0}
                className="group flex items-center space-x-2 px-5 py-3 bg-tissaia-accent/10 hover:bg-tissaia-accent/20 border border-tissaia-accent/50 text-tissaia-accent rounded-lg transition-all shadow-lg hover:shadow-[0_0_20px_rgba(0,255,163,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
             >
                <i className={`fa-solid ${isZipping ? 'fa-circle-notch fa-spin' : 'fa-file-zipper'} text-xl`}></i>
                <span className="text-xs font-bold font-mono tracking-wide">
                    {isZipping ? 'PAKOWANIE...' : 'ZAPISZ PLIKI (.ZIP)'}
                </span>
             </button>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
            <i className="fa-solid fa-wand-magic-sparkles text-9xl text-tissaia-accent transform rotate-12"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 pb-4 custom-scrollbar flex-1">
        {photos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-white/10 rounded-xl bg-black/20">
                <i className="fa-solid fa-flask text-4xl mb-4 opacity-30"></i>
                <p className="font-mono text-sm uppercase tracking-widest">Brak przetworzonych artefaktów</p>
                <p className="text-xs mt-2">Prześlij pliki do Repozytorium, aby rozpocząć proces.</p>
            </div>
        ) : (
            photos.map((photo) => (
                <div key={photo.id} className="group glass-panel rounded-xl overflow-hidden hover:border-tissaia-accent/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,163,0.15)] flex flex-col shrink-0 animate-fade-in-up">
                    {photo.restoredUrl && photo.originalCropUrl ? (
                         <CompareImage 
                            before={photo.originalCropUrl} 
                            after={photo.restoredUrl} 
                            filename={photo.filename} 
                            rotation={rotations[photo.id] || 0}
                        />
                    ) : (
                        <div className="relative aspect-[4/5] bg-black/50 overflow-hidden flex items-center justify-center">
                             <i className="fa-solid fa-circle-notch fa-spin text-tissaia-accent text-3xl"></i>
                        </div>
                    )}
                    <div className="p-4 bg-white/5 border-t border-white/5 flex-1 relative">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-gray-200">{photo.scanId ? `SCAN_${photo.scanId}` : photo.id}</h4>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{photo.date}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => handleRotate(photo.id)}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/10"
                                    title="Obróć o 90°"
                                >
                                    <i className="fa-solid fa-rotate-right text-xs"></i>
                                </button>
                                <i className="fa-solid fa-circle-check text-tissaia-accent text-lg drop-shadow-[0_0_8px_rgba(0,255,163,0.4)]" title="Restauracja zakończona"></i>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default MagicSpellView;
