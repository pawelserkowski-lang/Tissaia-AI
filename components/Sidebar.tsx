import React, { useState } from 'react';
import { ViewMode } from '../types';
import { Tooltip } from './Tooltip';

const LOGO_URL = "https://raw.githubusercontent.com/pawelserkowski-lang/Tissaia/bff8a21525d062a8c63229ef5edf530782c8943e/lib/logo.png";

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <aside className="w-80 h-full flex flex-col z-20 border-r border-white/10 glass-panel relative transition-all duration-500 animate-fade-in-left">
      {/* Large Logo Area */}
      <div className="p-8 border-b border-white/5 flex flex-col items-center justify-center space-y-4 bg-black/20">
        <div className="w-full relative flex items-center justify-center">
          {/* Logo Image */}
          {logoError ? (
             <div className="text-2xl font-bold text-tissaia-accent tracking-widest border-2 border-tissaia-accent p-2">EPS AI</div>
          ) : (
             <img 
               src={LOGO_URL} 
               alt="EPS AI SOLUTIONS" 
               className="w-full max-w-[200px] object-contain drop-shadow-[0_0_15px_rgba(0,255,163,0.3)]"
               onError={() => setLogoError(true)}
             />
          )}
        </div>
        <div className="text-center">
          <div className="text-[10px] text-tissaia-accent font-mono tracking-[0.2em] uppercase opacity-80">System Online</div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
        <Tooltip content="Manage Source Files" position="right" className="w-full">
            <button 
            onClick={() => setActiveView(ViewMode.FILES)}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border ${activeView === ViewMode.FILES ? 'bg-tissaia-accent/10 text-tissaia-accent border-tissaia-accent/50 shadow-[0_0_20px_rgba(0,255,163,0.1)]' : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
            <i className={`fa-solid fa-layer-group w-6 text-center text-lg ${activeView === ViewMode.FILES ? 'animate-pulse' : ''}`}></i>
            <span>SOURCE FILES</span>
            </button>
        </Tooltip>
        
        <Tooltip content="Segmentation & Analysis" position="right" className="w-full">
            <button 
            onClick={() => setActiveView(ViewMode.CROP_MAP)}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border ${activeView === ViewMode.CROP_MAP ? 'bg-tissaia-accent/10 text-tissaia-accent border-tissaia-accent/50 shadow-[0_0_20px_rgba(0,255,163,0.1)]' : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
            <i className={`fa-solid fa-crop-simple w-6 text-center text-lg ${activeView === ViewMode.CROP_MAP ? 'animate-pulse' : ''}`}></i>
            <span>CROP MAP</span>
            </button>
        </Tooltip>

        <Tooltip content="AI Restoration Engine" position="right" className="w-full">
            <button 
            onClick={() => setActiveView(ViewMode.MAGIC_SPELL)}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border ${activeView === ViewMode.MAGIC_SPELL ? 'bg-gradient-to-r from-tissaia-accent/20 to-transparent text-white border-tissaia-accent/50 shadow-[0_0_20px_rgba(0,255,163,0.1)]' : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
            <i className={`fa-solid fa-wand-sparkles w-6 text-center text-lg ${activeView === ViewMode.MAGIC_SPELL ? 'text-tissaia-accent' : ''}`}></i>
            <span>MAGIC SPELL</span>
            </button>
        </Tooltip>
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-lg border border-tissaia-accent/20">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-tissaia-accent animate-ping absolute opacity-75"></div>
            <div className="w-2 h-2 rounded-full bg-tissaia-accent relative"></div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono uppercase">Engine Status</p>
            <p className="text-xs text-tissaia-accent font-bold tracking-wider">OPERATIONAL</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;