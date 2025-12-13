
import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import FileListView from './components/FileListView';
import CropMapView from './components/CropMapView';
import MagicSpellView from './components/MagicSpellView';
import LogsView from './components/LogsView';
import Launcher from './components/Launcher';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { ViewMode, DetectedCrop, ScanStatus, ProcessedPhoto } from './types';
import { MOCK_CROPS } from './data/mockData';
import { useFileScanner } from './hooks/useFileScanner';
import { UI_CONSTANTS } from './config/constants';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import { useAnalytics, trackPageView, trackEvent } from './hooks/useAnalytics';

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
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const { files, isLoading, handleFileUpload, cleanupFiles, deleteFiles, clearAllFiles, retryFiles, verifyManifest, approveAndRestore } = useFileScanner(isAuthenticated);

  // Performance monitoring and analytics
  usePerformanceMonitoring(true);
  useAnalytics(true);

  // Track view changes
  useEffect(() => {
    if (isAuthenticated) {
      trackPageView(activeView);
    }
  }, [activeView, isAuthenticated]);

  // Track files that reach CROPPED status to auto-navigate and start processing
  const [processedCroppedIds, setProcessedCroppedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;

    // Find files that just completed STAGE_2 (CROPPED status) and haven't been auto-processed yet
    const newlyCroppedFiles = files.filter(
      f => f.status === ScanStatus.CROPPED && !processedCroppedIds.has(f.id)
    );

    if (newlyCroppedFiles.length > 0) {
      const firstCropped = newlyCroppedFiles[0];

      // Mark as processed to avoid re-triggering
      setProcessedCroppedIds(prev => new Set([...prev, firstCropped.id]));

      // Auto-navigate to cutting map view
      setSelectedScanId(firstCropped.id);
      setActiveView(ViewMode.CROP_MAP);

      // Auto-start restoration process after a short delay to let the UI update
      setTimeout(() => {
        approveAndRestore(firstCropped.id);
        trackEvent('auto-process', 'cropped-to-restore', firstCropped.id);
      }, 500);
    }
  }, [files, isAuthenticated, processedCroppedIds, approveAndRestore]);

  const handleSelectScan = (id: string) => {
    setSelectedScanId(id);
    setActiveView(ViewMode.CROP_MAP);
    trackEvent('scan', 'select', id);
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
    try {
      // Attempt to clear boot flag from localStorage
      localStorage.removeItem('eps_bios_booted');
      console.log('[REBOOT] Boot flag cleared, reloading application');
    } catch (error) {
      // Handle private browsing mode or restrictive environments
      console.warn('[REBOOT] Failed to clear localStorage, proceeding with reload anyway', error);
    }

    try {
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('[REBOOT] Failed to reload page:', error);
      // Fallback: reset authentication state
      setIsAuthenticated(false);
    }
  };

  const handleApprove = (id: string) => {
      approveAndRestore(id);
      if (activeView === ViewMode.CROP_MAP) setActiveView(ViewMode.MAGIC_SPELL);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      {
        key: '1',
        description: 'Switch to Files view',
        action: () => isAuthenticated && setActiveView(ViewMode.FILES),
      },
      {
        key: '2',
        description: 'Switch to Crop Map view',
        action: () => isAuthenticated && setActiveView(ViewMode.CROP_MAP),
      },
      {
        key: '3',
        description: 'Switch to Magic Spell view',
        action: () => isAuthenticated && setActiveView(ViewMode.MAGIC_SPELL),
      },
      {
        key: '4',
        ctrl: true,
        description: 'Toggle Logs view',
        action: () =>
          isAuthenticated &&
          setActiveView(activeView === ViewMode.LOGS ? ViewMode.FILES : ViewMode.LOGS),
      },
      {
        key: 'ArrowLeft',
        description: 'Previous scan',
        action: () => isAuthenticated && activeView === ViewMode.CROP_MAP && handleNav('prev'),
      },
      {
        key: 'ArrowRight',
        description: 'Next scan',
        action: () => isAuthenticated && activeView === ViewMode.CROP_MAP && handleNav('next'),
      },
      {
        key: 'Escape',
        description: 'Back to Files view',
        action: () => isAuthenticated && setActiveView(ViewMode.FILES),
      },
      {
        key: 'q',
        ctrl: true,
        description: 'Logout',
        action: () => isAuthenticated && handleLogout(),
      },
      {
        key: 'r',
        ctrl: true,
        shift: true,
        description: 'Reboot application',
        action: () => isAuthenticated && handleReboot(),
      },
      {
        key: 'Delete',
        description: 'Delete selected files',
        action: () => {
          if (isAuthenticated && activeView === ViewMode.FILES) {
            const selectedFiles = files.filter((f) => f.selected);
            if (selectedFiles.length > 0) {
              deleteFiles(selectedFiles.map((f) => f.id));
            }
          }
        },
      },
      {
        key: 'a',
        ctrl: true,
        description: 'Select all files',
        action: () => {
          if (isAuthenticated && activeView === ViewMode.FILES) {
            // This would need to be implemented in FileListView
            console.log('Select all shortcut triggered');
          }
        },
      },
      {
        key: '?',
        shift: true,
        description: 'Show keyboard shortcuts help',
        action: () => setShowKeyboardHelp(true),
      },
    ],
    isAuthenticated || showKeyboardHelp
  );

  const selectedFile = files.find(f => f.id === selectedScanId) || null;
  
  // Logic Fix: Only use MOCK_CROPS for specific static mock IDs (1, 2, 3), otherwise default to empty or file.aiData
  const isStaticMock = selectedFile && ['1', '2', '3'].includes(selectedFile.id);
  const currentCrops = selectedFile?.aiData || (isStaticMock ? MOCK_CROPS : []);
  
  const dynamicResults: ProcessedPhoto[] = files
    .filter(f => f.status === ScanStatus.RESTORED || (f.processedResults && f.processedResults.length > 0))
    .flatMap(f => f.processedResults || []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-tissaia-accent selection:text-black relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 pointer-events-none"
        style={{ backgroundImage: `url('${UI_CONSTANTS.BACKGROUND_URL}')` }}
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
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
      <Analytics />
    </div>
  );
};

export default App;
