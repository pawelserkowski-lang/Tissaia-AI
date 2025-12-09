import React, { useEffect, useRef } from 'react';
import { useLogger } from '../context/LogContext';

const LogsView: React.FC = () => {
    const { logs } = useLogger();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const getLevelColor = (level: string) => {
        switch(level) {
            case 'ERROR': return 'text-tissaia-error';
            case 'WARN': return 'text-tissaia-warning';
            case 'SUCCESS': return 'text-tissaia-success';
            default: return 'text-tissaia-accent';
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="p-4 md:p-6 rounded-xl glass-panel">
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center">
                    <i className="fa-solid fa-terminal mr-3 text-tissaia-accent"></i>
                    DZIENNIK SYSTEMOWY
                </h2>
                <p className="text-xs text-gray-400 mt-1 font-mono">Monitorowanie procesów jądra Tissaia Engine w czasie rzeczywistym.</p>
            </div>

            <div className="flex-1 rounded-xl glass-panel border border-white/10 p-4 overflow-hidden flex flex-col bg-black/40">
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1 font-mono text-xs p-2">
                    {logs.length === 0 && (
                         <div className="text-gray-600 italic p-4 text-center">Oczekiwanie na zdarzenia systemowe...</div>
                    )}
                    {logs.map((log) => (
                        <div key={log.id} className="flex space-x-2 md:space-x-3 hover:bg-white/5 p-1 rounded transition-colors border-l-2 border-transparent hover:border-tissaia-accent/50 animate-fade-in items-start md:items-center">
                            {/* Timestamp - Hidden on mobile */}
                            <span className="hidden md:block text-gray-500 w-36 shrink-0">[{log.timestamp.split('T')[1].slice(0,8)}]</span>
                            
                            {/* Level - Always visible */}
                            <span className={`w-16 md:w-20 font-bold shrink-0 ${getLevelColor(log.level)}`}>{log.level}</span>
                            
                            {/* Module - Hidden on mobile */}
                            <span className="hidden md:block text-gray-400 w-24 shrink-0 font-bold">[{log.module}]</span>
                            
                            {/* Message - Takes remaining space */}
                            <span className="text-gray-300 break-words flex-1 min-w-0">{log.message}</span>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
};

export default LogsView;