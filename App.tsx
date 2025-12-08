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

const BACKGROUND_URL = "https://pawelserkowski.pl/background.png";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.FILES);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  // Logic extracted to hook
  const { files, isLoading, handleFileUpload, cleanupFiles, deleteFiles, clearAllFiles, retryFiles, verifyManifest } = useFileScanner(isAuthenticated);

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

  const selectedFile = files.find(f => f.id === selectedScanId) || null;
  // Use AI data if available, otherwise mock data for initial demo files
  const currentCrops = selectedFile?.aiData || (selectedFile && MOCK_CROPS) || [];

  // Generate Magic Spell Results dynamically ONLY from currently loaded files
  const dynamicResults: ProcessedPhoto[] = files
    .filter(f => f.status === ScanStatus.RESTORED)
    .map(f => ({
        id: `res-${f.id}`,
        scanId: f.id,
        filename: f.filename,
        originalCropUrl: f.thumbnailUrl || '',
        restoredUrl: f.thumbnailUrl || '', // In a real app this would be the processed result URL
        filterUsed: 'GEMINI_V3_RESTORE',
        date: f.uploadDate
    }));
  
  // STRICT MODE: Only show dynamic results, no external mocks mixed in
  const allResults = dynamicResults;

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-tissaia-accent selection:text-black relative overflow-hidden">
      {/* Global Background Image */}
      {/* MODIFIED: Increased opacity to 0.8 and reduced gradient intensity for better visibility */}
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-500 animate-fade-in-up">
                <TopBar 
                    activeView={activeView} 
                    selectedFile={selectedFile} 
                    onLogout={handleLogout}
                    onReboot={handleReboot}
                />

                {/* Workspace */}
                <div className="flex-1 p-8 overflow-hidden h-full flex flex-col">
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
                        />
                    )}

                    {activeView === ViewMode.CROP_MAP && (
                        <CropMapView 
                            scan={selectedFile} 
                            crops={currentCrops as DetectedCrop[]} 
                            onNext={handleNextFile}
                            onPrev={handlePrevFile}
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
        </>
      )}
    </div>
  );
};

export default App;