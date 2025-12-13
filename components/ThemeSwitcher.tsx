import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme, themes, ThemeName } from '../context/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { themeName, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tissaia-dark/50 hover:bg-tissaia-dark/70 border border-tissaia-border hover:border-tissaia-accent/40 transition-all"
        aria-label="Theme Switcher"
        title="Change Theme"
      >
        <i className={`fa-solid ${themeIcons[themeName]} text-tissaia-accent`}></i>
        <span className="hidden sm:inline text-sm text-tissaia-fg">
          {themes[themeName].displayName}
        </span>
        <i className={`fa-solid fa-chevron-down text-xs text-tissaia-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[10000]"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown */}
          <div
            className="fixed w-56 bg-tissaia-dark border border-tissaia-border rounded-lg shadow-xl z-[10001] overflow-hidden transition-colors duration-300"
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right,
            }}
          >
            <div className="p-2">
              <div className="text-xs text-tissaia-muted uppercase tracking-wider px-3 py-2 font-bold">
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
                        : 'text-tissaia-fg hover:bg-tissaia-accent/10'
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

            <div className="border-t border-tissaia-border p-2">
              <div className="text-xs text-tissaia-muted px-3 py-1">
                Theme is saved automatically
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default ThemeSwitcher;
