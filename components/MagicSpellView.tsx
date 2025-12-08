import React, { useState } from 'react';
import JSZip from 'jszip';
import { ProcessedPhoto } from '../types';

interface MagicSpellViewProps {
  photos: ProcessedPhoto[];
}

const MagicSpellView: React.FC<MagicSpellViewProps> = ({ photos }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadZip = async () => {
    if (photos.length === 0) return;
    setIsZipping(true);

    try {
        const zip = new JSZip();
        const folderName = `EPS_Artifacts_${new Date().toISOString().slice(0,10)}`;
        const folder = zip.folder(folderName);

        // Process files concurrently
        await Promise.all(photos.map(async (photo) => {
            // Check if URL is valid
            if (!photo.restoredUrl) return;

            try {
                // Fetch the blob data from the internal blob: URL
                const response = await fetch(photo.restoredUrl);
                const blob = await response.blob();
                
                // Use original filename or fallback, ensure unique names if needed
                const filename = photo.filename || `${photo.id}.png`;
                folder?.file(filename, blob);
            } catch (err) {
                console.error(`Failed to pack file ${photo.id}`, err);
            }
        }));

        // Generate ZIP
        const content = await zip.generateAsync({ type: "blob" });
        
        // Trigger Download
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${folderName}.zip`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
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

        {/* Decorative BG Icon */}
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
                    <div className="relative aspect-[4/5] bg-black/50 overflow-hidden">
                        {/* Before/After Split Placeholder */}
                        {photo.restoredUrl ? (
                             <img src={photo.restoredUrl} alt="Restored" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex">
                                <div className="w-1/2 bg-gray-900/50 border-r border-white/10 flex items-center justify-center relative">
                                    <span className="text-[10px] text-gray-500 font-mono absolute bottom-2 left-2">SUROWY</span>
                                </div>
                                <div className="w-1/2 bg-gray-800/50 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-tissaia-accent/5"></div>
                                    <span className="text-[10px] text-tissaia-accent font-bold font-mono absolute bottom-2 right-2">PROCES</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3 backdrop-blur-sm">
                            <button 
                            className="bg-tissaia-accent text-black px-6 py-2 rounded text-xs font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,255,163,0.5)]"
                            title="Eksportuj obraz"
                            >
                                <i className="fa-solid fa-download mr-2"></i> EKSPORT
                            </button>
                            <button 
                            className="text-white hover:text-tissaia-accent text-xs font-bold font-mono border border-white/20 hover:border-tissaia-accent px-4 py-2 rounded transition-colors"
                            title="Dostosuj ustawienia"
                            >
                                <i className="fa-solid fa-sliders mr-2"></i> KOREKTA
                            </button>
                        </div>

                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-[9px] text-tissaia-accent font-mono border border-tissaia-accent/20 shadow-lg">
                            {photo.filterUsed}
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 border-t border-white/5 flex-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-gray-200">{photo.scanId ? `SCAN_${photo.scanId}` : photo.id}</h4>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{photo.date}</p>
                            </div>
                            <i className="fa-solid fa-circle-check text-tissaia-accent text-lg drop-shadow-[0_0_8px_rgba(0,255,163,0.4)]" title="Restauracja zakończona"></i>
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