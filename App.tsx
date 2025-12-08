import React, { useState } from 'react';
import FileListView from './components/FileListView';
import CropMapView from './components/CropMapView';
import MagicSpellView from './components/MagicSpellView';
import Launcher from './components/Launcher';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { ViewMode, DetectedCrop } from './types';
import { MOCK_CROPS, MOCK_RESULTS } from './data/mockData';
import { useFileScanner } from './hooks/useFileScanner';

const BACKGROUND_URL = "https://raw.githubusercontent.com/pawelserkowski-lang/Tissaia/bff8a21525d062a8c63229ef5edf530782c8943e/lib/background.jpg";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.FILES);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  // Logic extracted to hook
  const { files, isLoading, handleFileUpload, cleanupFiles } = useFileScanner(isAuthenticated);

  const handleSelectScan = (id: string) => {
    setSelectedScanId(id);
    setActiveView(ViewMode.CROP_MAP);
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

  return (
    <div className="flex h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-tissaia-accent selection:text-black relative overflow-hidden">
      {/* Global Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: `url('${BACKGROUND_URL}')` }}
      >
         <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/90 backdrop-blur-[2px]"></div>
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
                <div className="flex-1 p-8 overflow-hidden">
                    {activeView === ViewMode.FILES && (
                        <FileListView 
                            files={files}
                            isLoading={isLoading} 
                            onUpload={handleFileUpload}
                            onSelect={handleSelectScan}
                        />
                    )}

                    {activeView === ViewMode.CROP_MAP && (
                        <CropMapView 
                            scan={selectedFile} 
                            crops={currentCrops as DetectedCrop[]} 
                        />
                    )}

                    {activeView === ViewMode.MAGIC_SPELL && (
                        <MagicSpellView 
                            photos={MOCK_RESULTS} 
                        />
                    )}
                </div>
            </main>
        </>
      )}
    </div>
  );
};

export default App;