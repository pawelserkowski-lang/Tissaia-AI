import React, { useState, useEffect, useRef } from 'react';

const LOGO_URL = "https://pawelserkowski.pl/logo.png";

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
  { id: 'sys_env', label: 'ENVIRONMENT CONFIG (.ENV)', status: 'PENDING' },
  { id: 'sys_pkg', label: 'DEPENDENCY MANIFEST (NPM)', status: 'PENDING' },
  { id: 'sys_mem', label: 'MEMORY HEAP ALLOCATION', status: 'PENDING' },
  { id: 'sys_gpu', label: 'NEURAL ENGINE (GPU0)', status: 'PENDING' },
  { id: 'sys_net', label: 'ENCRYPTED UPLINK', status: 'PENDING' },
  { id: 'sys_sec', label: 'BIOMETRIC HANDSHAKE', status: 'PENDING' },
];

const Launcher: React.FC<LauncherProps> = ({ onLogin }) => {
  // Changed default flow: BOOT -> AUTHENTICATING -> SUCCESS (Skip LOGIN)
  const [viewState, setViewState] = useState<'BOOT' | 'LOGIN' | 'AUTHENTICATING' | 'SUCCESS'>('BOOT');
  const [bootItems, setBootItems] = useState<BootStep[]>(SYSTEM_COMPONENTS);
  const [currentBootIndex, setCurrentBootIndex] = useState(0);
  
  // Login Form State (Kept for fallback/structure, though bypassed)
  const [username, setUsername] = useState('AUTO_ADMIN');
  const [password, setPassword] = useState('********');
  const [loadingText, setLoadingText] = useState('INITIATING AUTO-LOGIN...');
  const [logoError, setLogoError] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- CHECK PREVIOUS BOOT ---
  useEffect(() => {
    const hasBooted = localStorage.getItem('eps_bios_booted');
    if (hasBooted) {
        // FAST PATH: Skip BOOT and LOGIN, go straight to AUTH
        setBootItems(SYSTEM_COMPONENTS.map(i => ({ ...i, status: 'OK' })));
        setCurrentBootIndex(SYSTEM_COMPONENTS.length);
        setViewState('AUTHENTICATING'); 
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
        // AUTOMATIC TRANSITION: Go directly to AUTHENTICATING
        setTimeout(() => setViewState('AUTHENTICATING'), 500);
      }
    }, 200 + Math.random() * 300); // Speed up boot slightly

    return () => clearTimeout(timeout);
  }, [currentBootIndex, viewState, bootItems.length]);

  // --- AUTO-LOGIN SEQUENCE ---
  useEffect(() => {
    if (viewState === 'AUTHENTICATING') {
        const steps = [
            'AUTO-NEGOTIATING CREDENTIALS...',
            'DECRYPTING USER PROFILE...',
            'ESTABLISHING NEURAL LINK...',
            'LOADING ARCHITECT MODULES...',
            'ACCESS GRANTED'
        ];
    
        let step = 0;
        setLoadingText(steps[0]);

        const interval = setInterval(() => {
            step++;
            if (step < steps.length) {
                setLoadingText(steps[step]);
            } else {
                clearInterval(interval);
                setViewState('SUCCESS');
                setTimeout(onLogin, 800);
            }
        }, 600); // 600ms per step

        return () => clearInterval(interval);
    }
  }, [viewState, onLogin]);

  // Scroll to bottom during boot
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentBootIndex]);


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
           <div className="text-tissaia-accent mt-4 animate-pulse">&gt;&gt; ALL SYSTEMS OPERATIONAL. EXECUTING AUTO-LOGIN...</div>
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
            <div className="w-40 h-40 mb-4 relative flex items-center justify-center group">
                 {/* Rotating Rings */}
                 <div className={`absolute inset-0 rounded-full border border-tissaia-accent/20 border-dashed ${viewState !== 'LOGIN' ? 'animate-spin-slow' : ''}`}></div>
                 
                 {logoError ? (
                     <i className="fa-solid fa-fingerprint text-4xl text-tissaia-accent relative z-10 animate-pulse"></i>
                 ) : (
                     <img 
                        src={LOGO_URL}
                        alt="Logo" 
                        // MODIFIED: Increased size from w-16 h-16 to w-32 h-32
                        className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(0,255,163,0.4)] relative z-10"
                        onError={() => setLogoError(true)} 
                     />
                 )}
                 {!logoError && <i className="fa-solid fa-fingerprint text-4xl text-tissaia-accent absolute opacity-0 transition-opacity duration-300"></i>}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-[0.2em] font-mono">EPS AI</h1>
        </div>

        {/* --- VIEW SWITCHER --- */}
        
        {viewState === 'BOOT' && renderBootScreen()}

        {/* Login State is effectively skipped, but kept in code structure just in case viewState is manually forced */}
        {viewState === 'LOGIN' && (
             <div className="flex-1 flex flex-col items-center justify-center">
                 <p className="text-tissaia-accent font-mono animate-pulse">REDIRECTING TO SECURE AUTH...</p>
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