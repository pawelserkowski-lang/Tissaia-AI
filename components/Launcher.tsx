import React, { useState, useEffect, useRef } from 'react';

const LOGO_URL = "https://raw.githubusercontent.com/pawelserkowski-lang/Tissaia/bff8a21525d062a8c63229ef5edf530782c8943e/lib/logo.png";

interface LauncherProps {
  onLogin: () => void;
}

type BootStep = {
  id: string;
  label: string;
  status: 'PENDING' | 'CHECKING' | 'OK' | 'WARNING';
};

const SYSTEM_COMPONENTS: BootStep[] = [
  { id: 'sys_core', label: 'KERNEL INTEGRITY', status: 'PENDING' },
  { id: 'sys_mem', label: 'MEMORY HEAP ALLOCATION', status: 'PENDING' },
  { id: 'sys_gpu', label: 'NEURAL ENGINE (GPU0)', status: 'PENDING' },
  { id: 'sys_net', label: 'ENCRYPTED UPLINK', status: 'PENDING' },
  { id: 'sys_sec', label: 'BIOMETRIC HANDSHAKE', status: 'PENDING' },
];

const Launcher: React.FC<LauncherProps> = ({ onLogin }) => {
  const [viewState, setViewState] = useState<'BOOT' | 'LOGIN' | 'AUTHENTICATING' | 'SUCCESS'>('BOOT');
  const [bootItems, setBootItems] = useState<BootStep[]>(SYSTEM_COMPONENTS);
  const [currentBootIndex, setCurrentBootIndex] = useState(0);
  
  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingText, setLoadingText] = useState('CONNECTING TO SECURE SERVER...');
  const [logoError, setLogoError] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- CHECK PREVIOUS BOOT ---
  useEffect(() => {
    const hasBooted = localStorage.getItem('eps_bios_booted');
    if (hasBooted) {
        setViewState('LOGIN');
        // Fast-forward boot state
        setBootItems(SYSTEM_COMPONENTS.map(i => ({ ...i, status: 'OK' })));
        setCurrentBootIndex(SYSTEM_COMPONENTS.length);
    }
  }, []);

  // --- BOOT SEQUENCE LOGIC ---
  useEffect(() => {
    if (viewState !== 'BOOT') return;

    const timeout = setTimeout(() => {
      if (currentBootIndex < bootItems.length) {
        setBootItems(prev => prev.map((item, idx) => {
          if (idx === currentBootIndex) return { ...item, status: 'OK' };
          if (idx === currentBootIndex + 1) return { ...item, status: 'CHECKING' };
          return item;
        }));
        setCurrentBootIndex(prev => prev + 1);
      } else {
        // Boot complete
        localStorage.setItem('eps_bios_booted', 'true');
        setTimeout(() => setViewState('LOGIN'), 800);
      }
    }, 400 + Math.random() * 400); // Randomize timing for realism

    return () => clearTimeout(timeout);
  }, [currentBootIndex, viewState, bootItems.length]);

  // Scroll to bottom during boot
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentBootIndex]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to skip boot
      if (viewState === 'BOOT' && e.key === 'Escape') {
        localStorage.setItem('eps_bios_booted', 'true');
        setViewState('LOGIN');
      }
      // Ctrl + Enter for Quick Launch (Auto-fill & Submit)
      if (viewState === 'LOGIN' && e.ctrlKey && e.key === 'Enter') {
        performQuickLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewState]);


  // --- ACTIONS ---

  const performQuickLaunch = () => {
    setUsername('ADMIN_OVERRIDE');
    setPassword('********');
    startAuthSequence('INITIATING QUICK LAUNCH PROTOCOL...');
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    startAuthSequence('VERIFYING CREDENTIALS...');
  };

  const startAuthSequence = (initialText: string) => {
    setViewState('AUTHENTICATING');
    setLoadingText(initialText);
    
    const steps = [
        'DECRYPTING USER PROFILE...',
        'ESTABLISHING NEURAL LINK...',
        'LOADING ARCHITECT MODULES...',
        'ACCESS GRANTED'
    ];

    let step = 0;
    const interval = setInterval(() => {
        if (step < steps.length) {
            setLoadingText(steps[step]);
            step++;
        } else {
            clearInterval(interval);
            setViewState('SUCCESS');
            setTimeout(onLogin, 800);
        }
    }, 800);
  };

  // --- RENDER HELPERS ---

  const renderBootScreen = () => (
    <div className="w-full font-mono text-xs space-y-2 h-64 flex flex-col relative">
      <div className="border-b border-white/10 pb-2 mb-2 flex justify-between text-gray-500">
        <span>BIOS v4.0.21 - EPS SYSTEMS</span>
        <span className="animate-pulse text-tissaia-accent">SYSTEM CHECK IN PROGRESS</span>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col justify-end space-y-1">
        {bootItems.map((item, idx) => (
          <div key={item.id} className={`flex items-center space-x-3 ${idx > currentBootIndex ? 'opacity-30' : 'opacity-100'}`}>
             <span className="w-6 text-center font-bold">
               {item.status === 'PENDING' && <span className="text-gray-600">[..]</span>}
               {item.status === 'CHECKING' && <span className="text-tissaia-warning animate-spin inline-block">/</span>}
               {item.status === 'OK' && <span className="text-tissaia-accent">[OK]</span>}
             </span>
             <span className={item.status === 'CHECKING' ? 'text-white' : 'text-gray-400'}>
               {item.label}
             </span>
             {item.status === 'OK' && <span className="text-[9px] text-gray-600 ml-auto">{(Math.random() * 50 + 10).toFixed(0)}ms</span>}
          </div>
        ))}
        {currentBootIndex >= bootItems.length && (
           <div className="text-tissaia-accent mt-4 animate-pulse">>> ALL SYSTEMS OPERATIONAL. LAUNCHING UI...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 pt-2 border-t border-white/10 text-[9px] text-gray-600 flex justify-between">
         <span>PRESS 'ESC' TO SKIP DIAGNOSTICS</span>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center w-full h-full relative z-50 p-4">
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-tissaia-accent/30 shadow-[0_0_60px_rgba(0,255,163,0.15)] relative overflow-hidden backdrop-blur-xl min-h-[500px] flex flex-col">
        
        {/* Decorative scanning line */}
        {(viewState === 'BOOT' || viewState === 'AUTHENTICATING') && (
            <div className="absolute top-0 left-0 w-full h-1 bg-tissaia-accent shadow-[0_0_20px_#00ffa3] animate-scan-vertical"></div>
        )}

        {/* Header / Logo */}
        <div className={`flex flex-col items-center mb-8 transition-all duration-500 ${viewState === 'BOOT' ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}`}>
            <div className="w-24 h-24 mb-4 relative flex items-center justify-center group">
                 {/* Rotating Rings */}
                 <div className={`absolute inset-0 rounded-full border border-tissaia-accent/20 border-dashed ${viewState !== 'LOGIN' ? 'animate-spin-slow' : ''}`}></div>
                 
                 {logoError ? (
                     <i className="fa-solid fa-fingerprint text-4xl text-tissaia-accent relative z-10 animate-pulse"></i>
                 ) : (
                     <img 
                        src={LOGO_URL}
                        alt="Logo" 
                        className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(0,255,163,0.4)] relative z-10"
                        onError={() => setLogoError(true)} 
                     />
                 )}
                 {!logoError && <i className="fa-solid fa-fingerprint text-4xl text-tissaia-accent absolute opacity-0 transition-opacity duration-300"></i>}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-[0.2em] font-mono">EPS AI</h1>
        </div>

        {/* --- VIEW SWITCHER --- */}
        
        {viewState === 'BOOT' && renderBootScreen()}

        {viewState === 'LOGIN' && (
            <div className="flex-1 flex flex-col animate-fade-in-up">
                <form onSubmit={handleManualLogin} className="space-y-5 flex-1">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-400 font-mono tracking-wider uppercase ml-1">Identity</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 group-focus-within:text-tissaia-accent transition-colors">
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-tissaia-accent focus:bg-black/60 focus:shadow-[0_0_15px_rgba(0,255,163,0.1)] transition-all font-mono text-sm placeholder-gray-600"
                                placeholder="OPERATOR ID"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-400 font-mono tracking-wider uppercase ml-1">Passcode</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 group-focus-within:text-tissaia-accent transition-colors">
                                <i className="fa-solid fa-shield-halved"></i>
                            </div>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:border-tissaia-accent focus:bg-black/60 focus:shadow-[0_0_15px_rgba(0,255,163,0.1)] transition-all font-mono text-sm placeholder-gray-600"
                                placeholder="••••••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit"
                            className="w-full bg-tissaia-accent/10 border border-tissaia-accent/50 text-tissaia-accent font-bold py-3.5 rounded-lg hover:bg-tissaia-accent/20 hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-tissaia-accent transition-all uppercase tracking-widest text-sm relative group overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                <i className="fa-solid fa-power-off mr-3 text-xs"></i> Initialize
                            </span>
                            <div className="absolute inset-0 bg-tissaia-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>
                </form>

                {/* Quick Launch Section */}
                <div className="mt-6 border-t border-white/5 pt-4 flex flex-col items-center">
                    <p className="text-[9px] text-gray-500 mb-2 font-mono">AUTHORIZED TERMINAL DETECTED</p>
                    <button 
                        onClick={performQuickLaunch}
                        className="text-xs text-gray-400 hover:text-white flex items-center space-x-2 transition-colors group px-4 py-2 rounded hover:bg-white/5"
                        title="Shortcut: Ctrl + Enter"
                    >
                        <i className="fa-solid fa-bolt text-tissaia-warning group-hover:text-white transition-colors"></i>
                        <span className="font-mono tracking-wide">QUICK LAUNCH</span>
                        <span className="text-[9px] bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 ml-2 group-hover:border-gray-500">CTRL+↵</span>
                    </button>
                </div>
            </div>
        )}

        {(viewState === 'AUTHENTICATING' || viewState === 'SUCCESS') && (
            <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6 animate-fade-in">
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-tissaia-accent animate-progress shadow-[0_0_10px_#00ffa3]"></div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xs font-mono text-tissaia-accent animate-pulse tracking-wide">{loadingText}</p>
                    <p className="text-[10px] text-gray-500 font-mono">ENCRYPTING CONNECTION...</p>
                </div>
            </div>
        )}

        <div className="mt-auto pt-4 flex justify-between items-center text-[9px] text-gray-600 font-mono border-t border-white/5">
            <span className="flex items-center"><i className="fa-solid fa-lock mr-1"></i> SECURE GATEWAY</span>
            <span>ID: {Math.floor(Math.random() * 99999).toString().padStart(5, '0')}</span>
        </div>
      </div>
    </div>
  );
};

export default Launcher;