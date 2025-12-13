import React from 'react';
import { ViewMode } from '../types';

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: ViewMode.FILES, icon: 'fa-layer-group', label: 'Pliki' },
    { id: ViewMode.CROP_MAP, icon: 'fa-crop-simple', label: 'Mapa wycięć' },
    { id: ViewMode.MAGIC_SPELL, icon: 'fa-wand-sparkles', label: 'Generuj' },
    { id: ViewMode.LOGS, icon: 'fa-terminal', label: 'Logi' },
  ];

  return (
    <div className="w-20 md:w-80 bg-black backdrop-blur-xl flex flex-col h-full border-r border-white/5 z-20 shadow-2xl transition-all duration-300">
      <div className="p-6 flex justify-center md:justify-start items-center">
            <div className="hidden md:flex items-center justify-center w-full mt-4">
                <img src="https://pawelserkowski.pl/logo.webp" alt="EPS AI" className="w-auto h-32 object-contain" style={{ mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
            </div>
            <div className="md:hidden w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center border border-emerald-500/30"><i className="fa-solid fa-terminal text-2xl text-emerald-400"></i></div>
      </div>

      <nav className="px-4 space-y-2 flex-shrink-0">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id)} className={`relative w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-200 group border ${activeView === item.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <i className={`fa-solid ${item.icon} text-2xl ${activeView === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'} transition-colors`}></i>
              <span className="hidden md:block font-medium text-base tracking-wide">{item.label}</span>
            </button>
          ))}
      </nav>

      <div className="flex-1"></div>

      <div className="p-6 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs font-mono text-emerald-600">
            <i className="fa-solid fa-circle-check"></i><span className="hidden md:inline">STATUS: <span className="font-bold text-emerald-400">ONLINE</span></span>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
