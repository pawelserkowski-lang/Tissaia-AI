import React, { useState } from 'react';
import { ViewMode } from '../types';
import { Tooltip } from './Tooltip';

const LOGO_URL = "https://pawelserkowski.pl/logo.png";

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const [logoError, setLogoError] = useState(false);

  // Added whitespace-nowrap and overflow handling to prevent layout shifts
  const navItemClass = (mode: ViewMode) => `
    w-full flex items-center space-x-4 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border whitespace-nowrap overflow-hidden
    ${activeView === mode 
        ? 'bg-tissaia-accent/10 text-tissaia-accent border-tissaia-accent/50 shadow-[0_0_20px_rgba(0,255,163,0.1)]' 
        : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}
  `;

  return (
    // Added overflow-x-hidden to prevent horizontal scroll
    <aside className="w-80 h-full flex flex-col z-20 border-r border-white/10 glass-panel relative transition-all duration-500 animate-fade-in-left shrink-0 overflow-x-hidden">
      {/* Large Logo Area */}
      <div className="p-8 border-b border-white/5 flex flex-col items-center justify-center space-y-4 bg-black/20 shrink-0">
        <div className="w-full relative flex items-center justify-center">
          {/* Logo Image - MODIFIED: Increased max-w to 240px */}
          {logoError ? (
             <div className="flex flex-col items-center">
                 <i className="fa-solid fa-fingerprint text-5xl text-tissaia-accent mb-2"></i>
                 <div className="text-xl font-bold text-tissaia-accent tracking-widest">EPS AI</div>
             </div>
          ) : (
             <img 
               src={LOGO_URL} 
               alt="EPS AI SOLUTIONS" 
               className="w-full max-w-[240px] object-contain drop-shadow-[0_0_15px_rgba(0,255,163,0.3)]"
               onError={() => setLogoError(true)}
             />
          )}
        </div>
        <div className="text-center">
          <div className="text-[10px] text-tissaia-accent font-mono tracking-[0.2em] uppercase opacity-80">System Online</div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        <Tooltip content="Pliki źródłowe" position="right" className="w-full">
            <button onClick={() => setActiveView(ViewMode.FILES)} className={navItemClass(ViewMode.FILES)}>
                <i className={`fa-solid fa-layer-group w-6 text-center text-lg ${activeView === ViewMode.FILES ? 'animate-pulse' : ''}`}></i>
                <span>PLIKI ŹRÓDŁOWE</span>
            </button>
        </Tooltip>
        
        <Tooltip content="Analiza i Segmentacja" position="right" className="w-full">
            <button onClick={() => setActiveView(ViewMode.CROP_MAP)} className={navItemClass(ViewMode.CROP_MAP)}>
                <i className={`fa-solid fa-crop-simple w-6 text-center text-lg ${activeView === ViewMode.CROP_MAP ? 'animate-pulse' : ''}`}></i>
                <span>MAPA CIĘCIA</span>
            </button>
        </Tooltip>

        <Tooltip content="Silnik Restauracji AI" position="right" className="w-full">
            <button onClick={() => setActiveView(ViewMode.MAGIC_SPELL)} className={navItemClass(ViewMode.MAGIC_SPELL)}>
                <i className={`fa-solid fa-wand-sparkles w-6 text-center text-lg ${activeView === ViewMode.MAGIC_SPELL ? 'text-tissaia-accent' : ''}`}></i>
                <span>MAGICZNE ZAKLĘCIE</span>
            </button>
        </Tooltip>

        <div className="h-px bg-white/10 my-2"></div>

        <Tooltip content="Dziennik Zdarzeń" position="right" className="w-full">
            <button onClick={() => setActiveView(ViewMode.LOGS)} className={navItemClass(ViewMode.LOGS)}>
                <i className={`fa-solid fa-terminal w-6 text-center text-lg ${activeView === ViewMode.LOGS ? 'text-tissaia-warning' : ''}`}></i>
                <span>LOGI SYSTEMOWE</span>
            </button>
        </Tooltip>
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/20 shrink-0">
        <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-lg border border-tissaia-accent/20">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-tissaia-accent animate-ping absolute opacity-75"></div>
            <div className="w-2 h-2 rounded-full bg-tissaia-accent relative"></div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-mono uppercase">Status Silnika</p>
            <p className="text-xs text-tissaia-accent font-bold tracking-wider">OPERACYJNY</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;