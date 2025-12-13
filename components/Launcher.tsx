
import React, { useEffect, useState } from 'react';

const LOGO_URL = "https://pawelserkowski.pl/logo.webp";

interface LauncherProps {
  onLogin: () => void;
}

const Launcher: React.FC<LauncherProps> = ({ onLogin }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 70);

    // Trigger login after animation completes
    const timeout = setTimeout(() => {
      onLogin();
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onLogin]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-black">
      <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <img
          src={LOGO_URL}
          alt="Logo"
          className="w-96 h-auto object-contain animate-pulse"
          style={{ mixBlendMode: 'screen', filter: 'brightness(1.2) contrast(1.1)' }}
        />

        <div className="mt-8 w-80 h-1 bg-tissaia-accent/30 rounded overflow-hidden">
          <div
            className="h-full bg-tissaia-accent transition-all duration-100 ease-out shadow-[0_0_10px_#00ffa3]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-6 text-tissaia-accent/50 text-xs tracking-[0.5em] font-mono">INITIALIZING...</p>
      </div>
    </div>
  );
};

export default Launcher;
