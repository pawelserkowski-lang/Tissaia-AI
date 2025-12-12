import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SystemLog } from '../types';
import { UI_CONSTANTS } from '../config/constants';

interface LogContextType {
  logs: SystemLog[];
  addLog: (level: SystemLog['level'], module: string, message: string) => void;
  clearLogs: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<SystemLog[]>([
    { id: 'init', timestamp: new Date().toISOString(), level: 'INFO', module: 'KERNEL', message: 'System EPS Architect Engine zainicjowany.' }
  ]);

  const addLog = useCallback((level: SystemLog['level'], module: string, message: string) => {
    const newLog: SystemLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      module,
      message
    };
    setLogs(prev => {
        const updated = [...prev, newLog];
        return updated.slice(-UI_CONSTANTS.MAX_LOG_ENTRIES); // Keep last N logs to prevent memory overflow
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([{
      id: 'cleared',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      module: 'KERNEL',
      message: 'Dziennik systemowy został wyczyszczony.'
    }]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogger = () => {
  const context = useContext(LogContext);
  if (!context) throw new Error("useLogger must be used within LogProvider");
  return context;
};