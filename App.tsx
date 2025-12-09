import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import FileListView from './components/FileListView';
import CropMapView from './components/CropMapView';
import MagicSpellView from './components/MagicSpellView';
import LogsView from './components/LogsView';
import Launcher from './components/Launcher';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { ViewMode, DetectedCrop, ScanStatus, ProcessedPhoto } from './types';
import { MOCK_CROPS } from './data/mockData';
import { useFileScanner } from './hooks/useFileScanner';

// MODIFIED: Updated background URL
const BACKGROUND_URL = "https://pawelserkowski.pl/background.webp";

// Extracted to avoid re-creation on render
const MobileNavItem = ({ mode, icon, label, activeView, setActiveView }: { mode: ViewMode, icon: string, label: string, activeView: ViewMode, setActiveView: (v: ViewMode)=>void }) => (
  <button 
    onClick={() => setActiveView(mode)}
    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeView === mode ? 'text-tissaia-accent' : 'text-gray-500 hover:text-gray-300'}`}
  >
    <i className={`fa-solid ${icon} text-xl mb-1 ${activeView === mode ? 'animate-pulse' : ''}`}></i>
    <span className="text-[9px] font-mono tracking-wider">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.FILES);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  const { files, isLoading, handleFileUpload, cleanupFiles, deleteFiles, clearAllFiles, retryFiles, verifyManifest, approveAndRestore } = useFileScanner(isAuthenticated);

  const handleSelectScan = (id: string) => {
    setSelectedScanId(id);
    setActiveView(ViewMode.CROP_MAP);
  };

  const handleNav = (dir: 'next' | 'prev') => {
      if (!selectedScanId) return;
      const idx = files.findIndex(f => f.id === selectedScanId);
      if (idx === -1) return;
      
      const newIdx = dir === 'next' ? idx + 1 : idx - 1;
      if (newIdx >= 0 && newIdx < files.length) {
          setSelectedScanId(files[newIdx].id);
      }
  };

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    setIsAuthenticated(false);
    cleanupFiles();
    setActiveView(ViewMode.FILES);
  };

  const handleReboot = () => {
    localStorage.removeItem('eps_bios_booted');
    window.location.reload();
  };

  const handleApprove = (id: string) => {
      approveAndRestore(id);
      if (activeView === ViewMode.CROP_MAP) setActiveView(ViewMode.MAGIC_SPELL); 
  };

  const selectedFile = files.find(f => f.id === selectedScanId) || null;
  const currentCrops = selectedFile?.aiData || (selectedFile && MOCK_CROPS) || [];
  const dynamicResults: ProcessedPhoto[] = files
    .filter(f => f.status === ScanStatus.RESTORED || (f.processedResults && f.processedResults.length > 0))
    .flatMap(f => f.processedResults || []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-tissaia-accent selection:text-black relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 pointer-events-none"
        style={{ backgroundImage: `url('${BACKGROUND_URL}')` }}
      >
         <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80 backdrop-blur-[1px]"></div>
      </div>

      {!isAuthenticated ? (
        <Launcher onLogin={handleLogin} />
      ) : (
        <>
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-500 animate-fade-in-up mb-16 md:mb-0">
                <TopBar activeView={activeView} selectedFile={selectedFile} onLogout={handleLogout} onReboot={handleReboot} />
                <div className="flex-1 p-4 md:p-8 overflow-hidden h-full flex flex-col">
                    {activeView === ViewMode.FILES && (
                        <FileListView files={files} isLoading={isLoading} onUpload={handleFileUpload} onSelect={handleSelectScan} onDelete={deleteFiles} onClear={clearAllFiles} onRetry={retryFiles} onVerify={verifyManifest} onApprove={handleApprove} />
                    )}
                    {activeView === ViewMode.CROP_MAP && (
                        <CropMapView scan={selectedFile} crops={currentCrops as DetectedCrop[]} onNext={() => handleNav('next')} onPrev={() => handleNav('prev')} onVerify={verifyManifest} onApprove={handleApprove} />
                    )}
                    {activeView === ViewMode.MAGIC_SPELL && <MagicSpellView photos={dynamicResults} />}
                    {activeView === ViewMode.LOGS && <LogsView />}
                </div>
            </main>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg border-t border-white/10 z-50 flex justify-around items-center px-2">
                <MobileNavItem mode={ViewMode.FILES} icon="fa-layer-group" label="PLIKI" activeView={activeView} setActiveView={setActiveView} />
                <MobileNavItem mode={ViewMode.CROP_MAP} icon="fa-crop-simple" label="MAPA" activeView={activeView} setActiveView={setActiveView} />
                <MobileNavItem mode={ViewMode.MAGIC_SPELL} icon="fa-wand-sparkles" label="GENERUJ" activeView={activeView} setActiveView={setActiveView} />
                <MobileNavItem mode={ViewMode.LOGS} icon="fa-terminal" label="LOGI" activeView={activeView} setActiveView={setActiveView} />
            </nav>
        </>
      )}
      <Analytics />
    </div>
  );
};

export default App;