import React, { useState } from 'react';
import { useTheme, themes, ThemeName } from '../context/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { themeName, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const themeIcons: Record<ThemeName, string> = {
    dark: 'fa-moon',
    light: 'fa-sun',
    cyberpunk: 'fa-bolt',
    classic: 'fa-desktop',
    'high-contrast': 'fa-circle-half-stroke',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 hover:bg-gray-900/70 border border-tissaia-accent/20 hover:border-tissaia-accent/40 transition-all"
        aria-label="Theme Switcher"
        title="Change Theme"
      >
        <i className={`fa-solid ${themeIcons[themeName]} text-tissaia-accent`}></i>
        <span className="hidden sm:inline text-sm text-gray-300">
          {themes[themeName].displayName}
        </span>
        <i className={`fa-solid fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[10000]"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-tissaia-accent/30 rounded-lg shadow-xl z-[10001] overflow-hidden">
            <div className="p-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider px-3 py-2 font-bold">
                Choose Theme
              </div>
              {Object.entries(themes).map(([key, theme]) => {
                const isActive = themeName === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key as ThemeName)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                      isActive
                        ? 'bg-tissaia-accent/20 text-tissaia-accent'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <i className={`fa-solid ${themeIcons[key as ThemeName]} w-5`}></i>
                    <span className="flex-1 text-left text-sm">{theme.displayName}</span>
                    {isActive && (
                      <i className="fa-solid fa-check text-xs"></i>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-800 p-2">
              <div className="text-xs text-gray-500 px-3 py-1">
                Theme is saved automatically
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
