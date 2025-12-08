import React from 'react';
import { ViewMode, ScanFile } from '../types';
import { Tooltip } from './Tooltip';

interface TopBarProps {
  activeView: ViewMode;
  selectedFile: ScanFile | null;
  onLogout: () => void;
  onReboot: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ activeView, selectedFile, onLogout, onReboot }) => {
  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-light text-white tracking-widest font-mono uppercase">
          {activeView === ViewMode.FILES && <span className="flex items-center"><i className="fa-solid fa-database text-tissaia-accent mr-3 text-sm"></i>Repository</span>}
          {activeView === ViewMode.CROP_MAP && <span className="flex items-center"><i className="fa-solid fa-crosshairs text-tissaia-accent mr-3 text-sm"></i>{selectedFile ? selectedFile.filename : 'Segmentation'}</span>}
          {activeView === ViewMode.MAGIC_SPELL && <span className="flex items-center"><i className="fa-solid fa-bolt text-tissaia-accent mr-3 text-sm"></i>Artifacts</span>}
        </h2>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex flex-col items-end mr-2">
          <span className="text-[10px] text-gray-400 font-mono">CURRENT USER</span>
          <span className="text-sm font-bold text-white">ARCHITECT</span>
        </div>
        
        <Tooltip content="System Reboot" position="bottom">
            <div 
            className="w-10 h-10 rounded-full bg-black/50 border border-gray-600 hover:border-tissaia-warning hover:text-tissaia-warning shadow-none hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] flex items-center justify-center cursor-pointer transition-all" 
            onClick={onReboot}
            >
            <i className="fa-solid fa-power-off"></i>
            </div>
        </Tooltip>

        <Tooltip content="Terminate Session" position="bottom">
            <div 
            className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-tissaia-accent/50 shadow-[0_0_10px_rgba(0,255,163,0.2)] flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors" 
            onClick={onLogout}
            >
            <i className="fa-solid fa-user-astronaut text-tissaia-accent"></i>
            </div>
        </Tooltip>
      </div>
    </header>
  );
};

export default TopBar;