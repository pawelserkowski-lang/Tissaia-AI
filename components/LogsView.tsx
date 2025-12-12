import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLogger } from '../context/LogContext';
import { SystemLog } from '../types';

const LogsView: React.FC = () => {
    const { logs, clearLogs } = useLogger();
    const bottomRef = useRef<HTMLDivElement>(null);
    const [selectedLevels, setSelectedLevels] = useState<Set<SystemLog['level']>>(new Set(['ERROR', 'WARN', 'SUCCESS', 'INFO']));
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const levelMatch = selectedLevels.has(log.level);
            const searchMatch = searchQuery === '' ||
                log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.module.toLowerCase().includes(searchQuery.toLowerCase());
            return levelMatch && searchMatch;
        });
    }, [logs, selectedLevels, searchQuery]);

    const toggleLevel = (level: SystemLog['level']) => {
        setSelectedLevels(prev => {
            const next = new Set(prev);
            if (next.has(level)) {
                next.delete(level);
            } else {
                next.add(level);
            }
            return next;
        });
    };

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

                {/* Filter Controls */}
                <div className="mt-4 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                        <input
                            type="text"
                            placeholder="Szukaj w logach..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-tissaia-accent/50 focus:bg-black/60 text-xs font-mono transition-all"
                        />
                    </div>

                    {/* Level Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => toggleLevel('ERROR')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                                selectedLevels.has('ERROR')
                                    ? 'bg-tissaia-error/20 border-tissaia-error text-tissaia-error'
                                    : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}
                        >
                            <i className="fa-solid fa-circle-exclamation mr-1"></i>ERROR
                        </button>
                        <button
                            onClick={() => toggleLevel('WARN')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                                selectedLevels.has('WARN')
                                    ? 'bg-tissaia-warning/20 border-tissaia-warning text-tissaia-warning'
                                    : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}
                        >
                            <i className="fa-solid fa-triangle-exclamation mr-1"></i>WARN
                        </button>
                        <button
                            onClick={() => toggleLevel('SUCCESS')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                                selectedLevels.has('SUCCESS')
                                    ? 'bg-tissaia-success/20 border-tissaia-success text-tissaia-success'
                                    : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}
                        >
                            <i className="fa-solid fa-circle-check mr-1"></i>SUCCESS
                        </button>
                        <button
                            onClick={() => toggleLevel('INFO')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono border transition-all ${
                                selectedLevels.has('INFO')
                                    ? 'bg-tissaia-accent/20 border-tissaia-accent text-tissaia-accent'
                                    : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}
                        >
                            <i className="fa-solid fa-circle-info mr-1"></i>INFO
                        </button>
                    </div>

                    {/* Clear Button */}
                    <button
                        onClick={clearLogs}
                        className="ml-auto px-4 py-1.5 bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold font-mono transition-all"
                    >
                        <i className="fa-solid fa-trash mr-2"></i>WYCZYŚĆ
                    </button>
                </div>

                {/* Stats */}
                <div className="mt-3 flex gap-3 text-xs font-mono text-gray-400">
                    <span>Wszystkich: {logs.length}</span>
                    <span>•</span>
                    <span>Widocznych: {filteredLogs.length}</span>
                </div>
            </div>

            <div className="flex-1 rounded-xl glass-panel border border-white/10 p-4 overflow-hidden flex flex-col bg-black/40">
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1 font-mono text-xs p-2">
                    {filteredLogs.length === 0 && logs.length === 0 && (
                         <div className="text-gray-600 italic p-4 text-center">Oczekiwanie na zdarzenia systemowe...</div>
                    )}
                    {filteredLogs.length === 0 && logs.length > 0 && (
                         <div className="text-gray-600 italic p-4 text-center">
                             <i className="fa-solid fa-filter-circle-xmark text-2xl mb-2 block opacity-50"></i>
                             Brak logów pasujących do filtrów.
                         </div>
                    )}
                    {filteredLogs.map((log) => (
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