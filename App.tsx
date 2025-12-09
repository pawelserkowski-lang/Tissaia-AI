import React, { useState } from 'react';
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

// MODIFIED: Added timestamp for cache busting
const BACKGROUND_URL = `https://pawelserkowski.pl/background.png?v=${Date.now()}`;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.FILES);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  // Logic extracted to hook
  const { files, isLoading, handleFileUpload, cleanupFiles, deleteFiles, clearAllFiles, retryFiles, verifyManifest, approveAndRestore } = useFileScanner(isAuthenticated);

  const handleSelectScan = (id: string) => {
    setSelectedScanId(id);
    setActiveView(ViewMode.CROP_MAP);
  };

  // Nav Handlers
  const handleNextFile = () => {
      if (!selectedScanId) return;
      const idx = files.findIndex(f => f.id === selectedScanId);
      if (idx !== -1 && idx < files.length - 1) {
          setSelectedScanId(files[idx + 1].id);
      }
  };

  const handlePrevFile = () => {
      if (!selectedScanId) return;
      const idx = files.findIndex(f => f.id === selectedScanId);
      if (idx > 0) {
          setSelectedScanId(files[idx - 1].id);
      }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    cleanupFiles();
    setActiveView(ViewMode.FILES);
  };

  const handleReboot = () => {
    localStorage.removeItem('eps_bios_booted');
    window.location.reload();
  };

  // Handle Approve button click in CropMapView & FileListView
  const handleApprove = (id: string) => {
      approveAndRestore(id);
      // Only switch view if we are on CropMap, otherwise (FileList) just start processing
      if (activeView === ViewMode.CROP_MAP) {
         setActiveView(ViewMode.MAGIC_SPELL); 
      }
  };

  const selectedFile = files.find(f => f.id === selectedScanId) || null;
  // Use AI data if available, otherwise mock data for initial demo files
  const currentCrops = selectedFile?.aiData || (selectedFile && MOCK_CROPS) || [];

  // Generate Magic Spell Results dynamically ONLY from currently loaded files
  const dynamicResults: ProcessedPhoto[] = files
    .filter(f => f.status === ScanStatus.RESTORED || (f.processedResults && f.processedResults.length > 0))
    .flatMap(f => f.processedResults || []);
  
  const allResults = dynamicResults;

  // Mobile Bottom Nav Item Helper
  const MobileNavItem = ({ mode, icon, label }: { mode: ViewMode, icon: string, label: string }) => (
    <button 
      onClick={() => setActiveView(mode)}
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeView === mode ? 'text-tissaia-accent' : 'text-gray-500 hover:text-gray-300'}`}
    >
      <i className={`fa-solid ${icon} text-xl mb-1 ${activeView === mode ? 'animate-pulse' : ''}`}></i>
      <span className="text-[9px] font-mono tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-tissaia-accent selection:text-black relative overflow-hidden">
      {/* Global Background Image */}
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
            {/* Desktop Sidebar */}
            <Sidebar activeView={activeView} setActiveView={setActiveView} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-500 animate-fade-in-up mb-16 md:mb-0">
                <TopBar 
                    activeView={activeView} 
                    selectedFile={selectedFile} 
                    onLogout={handleLogout}
                    onReboot={handleReboot}
                />

                {/* Workspace */}
                <div className="flex-1 p-4 md:p-8 overflow-hidden h-full flex flex-col">
                    {activeView === ViewMode.FILES && (
                        <FileListView 
                            files={files}
                            isLoading={isLoading} 
                            onUpload={handleFileUpload}
                            onSelect={handleSelectScan}
                            onDelete={deleteFiles}
                            onClear={clearAllFiles}
                            onRetry={retryFiles}
                            onVerify={verifyManifest}
                            onApprove={handleApprove}
                        />
                    )}

                    {activeView === ViewMode.CROP_MAP && (
                        <CropMapView 
                            scan={selectedFile} 
                            crops={currentCrops as DetectedCrop[]} 
                            onNext={handleNextFile}
                            onPrev={handlePrevFile}
                            onVerify={verifyManifest}
                            onApprove={handleApprove}
                        />
                    )}

                    {activeView === ViewMode.MAGIC_SPELL && (
                        <MagicSpellView 
                            photos={allResults} 
                        />
                    )}

                    {activeView === ViewMode.LOGS && (
                        <LogsView />
                    )}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg border-t border-white/10 z-50 flex justify-around items-center px-2">
                <MobileNavItem mode={ViewMode.FILES} icon="fa-layer-group" label="PLIKI" />
                <MobileNavItem mode={ViewMode.CROP_MAP} icon="fa-crop-simple" label="MAPA" />
                <MobileNavItem mode={ViewMode.MAGIC_SPELL} icon="fa-wand-sparkles" label="GENERUJ" />
                <MobileNavItem mode={ViewMode.LOGS} icon="fa-terminal" label="LOGI" />
            </nav>
        </>
      )}
    </div>
  );
};

export default App;