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
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.FILES);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const { files, isLoading, handleFileUpload, cleanupFiles, deleteFiles, clearAllFiles, retryFiles, verifyManifest, approveAndRestore, reanalyzeFile } = useFileScanner(!loading);

  // Loading timer - matches Regis-AIStudio timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Performance monitoring and analytics
  usePerformanceMonitoring(true);
  useAnalytics(true);

  // Track view changes
  useEffect(() => {
    if (!loading) {
      trackPageView(activeView);
    }
  }, [activeView, loading]);

  // Track files that reach CROPPED status to auto-navigate and start processing
  const [processedCroppedIds, setProcessedCroppedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loading) return;

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
  }, [files, loading, processedCroppedIds, approveAndRestore]);

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

  const handleLogout = () => {
    setLoading(true);
    cleanupFiles();
    setActiveView(ViewMode.FILES);
    // Restart loading animation
    setTimeout(() => setLoading(false), 3500);
  };

  const handleReboot = () => {
    try {
      localStorage.removeItem('eps_bios_booted');
      console.log('[REBOOT] Boot flag cleared, reloading application');
    } catch (error) {
      console.warn('[REBOOT] Failed to clear localStorage, proceeding with reload anyway', error);
    }

    try {
      window.location.reload();
    } catch (error) {
      console.error('[REBOOT] Failed to reload page:', error);
      setLoading(true);
      setTimeout(() => setLoading(false), 3500);
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
        action: () => !loading && setActiveView(ViewMode.FILES),
      },
      {
        key: '2',
        description: 'Switch to Crop Map view',
        action: () => !loading && setActiveView(ViewMode.CROP_MAP),
      },
      {
        key: '3',
        description: 'Switch to Magic Spell view',
        action: () => !loading && setActiveView(ViewMode.MAGIC_SPELL),
      },
      {
        key: '4',
        ctrl: true,
        description: 'Toggle Logs view',
        action: () =>
          !loading &&
          setActiveView(activeView === ViewMode.LOGS ? ViewMode.FILES : ViewMode.LOGS),
      },
      {
        key: 'ArrowLeft',
        description: 'Previous scan',
        action: () => !loading && activeView === ViewMode.CROP_MAP && handleNav('prev'),
      },
      {
        key: 'ArrowRight',
        description: 'Next scan',
        action: () => !loading && activeView === ViewMode.CROP_MAP && handleNav('next'),
      },
      {
        key: 'Escape',
        description: 'Back to Files view',
        action: () => !loading && setActiveView(ViewMode.FILES),
      },
      {
        key: 'q',
        ctrl: true,
        description: 'Logout',
        action: () => !loading && handleLogout(),
      },
      {
        key: 'r',
        ctrl: true,
        shift: true,
        description: 'Reboot application',
        action: () => !loading && handleReboot(),
      },
      {
        key: 'Delete',
        description: 'Delete selected files',
        action: () => {
          if (!loading && activeView === ViewMode.FILES) {
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
          if (!loading && activeView === ViewMode.FILES) {
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
    !loading || showKeyboardHelp
  );

  const selectedFile = files.find(f => f.id === selectedScanId) || null;
  
  // Logic Fix: Only show crops AFTER Stage 2 (CROPPED status or later)
  // Stage 1 (PENDING_VERIFICATION) only determines count, no crop visualization
  const isStaticMock = selectedFile && ['1', '2', '3'].includes(selectedFile.id);
  const hasCompletedStage2 = selectedFile && (
    selectedFile.status === ScanStatus.CROPPED ||
    selectedFile.status === ScanStatus.RESTORING ||
    selectedFile.status === ScanStatus.RESTORED
  );
  const currentCrops = hasCompletedStage2
    ? (selectedFile?.aiData || (isStaticMock ? MOCK_CROPS : []))
    : [];
  
  const dynamicResults: ProcessedPhoto[] = files
    .filter(f => f.status === ScanStatus.RESTORED || (f.processedResults && f.processedResults.length > 0))
    .flatMap(f => f.processedResults || []);

  return (
    <div className="relative flex h-full w-full bg-black text-slate-100 overflow-hidden font-mono">
      <div className="absolute inset-0 z-0 bg-[url('https://pawelserkowski.pl/background.webp')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 z-0 bg-black/60" />

      <div className={`absolute inset-0 z-50 transition-opacity duration-1000 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <Launcher />
      </div>

      <div className={`relative z-10 flex h-full w-full backdrop-blur-[2px] transition-opacity duration-1000 ${!loading ? 'opacity-100' : 'opacity-0'}`}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 h-full overflow-hidden relative">
            <TopBar activeView={activeView} selectedFile={selectedFile} onLogout={handleLogout} onReboot={handleReboot} />
            <div className="flex-1 p-4 md:p-8 overflow-hidden h-full flex flex-col">
                {activeView === ViewMode.FILES && (
                    <FileListView files={files} isLoading={isLoading} onUpload={handleFileUpload} onSelect={handleSelectScan} onDelete={deleteFiles} onClear={clearAllFiles} onRetry={retryFiles} onVerify={verifyManifest} onApprove={handleApprove} />
                )}
                {activeView === ViewMode.CROP_MAP && (
                    <CropMapView scan={selectedFile} crops={currentCrops as DetectedCrop[]} onNext={() => handleNav('next')} onPrev={() => handleNav('prev')} onVerify={verifyManifest} onApprove={handleApprove} onReanalyze={reanalyzeFile} />
                )}
                {activeView === ViewMode.MAGIC_SPELL && <MagicSpellView photos={dynamicResults} />}
                {activeView === ViewMode.LOGS && <LogsView />}
            </div>
        </main>
      </div>

      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg border-t border-white/10 z-40 flex justify-around items-center px-2 transition-opacity duration-1000 ${!loading ? 'opacity-100' : 'opacity-0'}`}>
          <MobileNavItem mode={ViewMode.FILES} icon="fa-layer-group" label="PLIKI" activeView={activeView} setActiveView={setActiveView} />
          <MobileNavItem mode={ViewMode.CROP_MAP} icon="fa-crop-simple" label="WYCIĘCIA" activeView={activeView} setActiveView={setActiveView} />
          <MobileNavItem mode={ViewMode.MAGIC_SPELL} icon="fa-wand-sparkles" label="GENERUJ" activeView={activeView} setActiveView={setActiveView} />
          <MobileNavItem mode={ViewMode.LOGS} icon="fa-terminal" label="LOGI" activeView={activeView} setActiveView={setActiveView} />
      </nav>

      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
      <Analytics />
    </div>
  );
};

export default App;
