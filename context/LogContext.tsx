import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { SystemLog } from '../types';
import { UI_CONSTANTS } from '../config/constants';

interface LogContextType {
  logs: SystemLog[];
  addLog: (level: SystemLog['level'], module: string, message: string) => void;
  clearLogs: () => void;
  exportLogs: (type: 'all' | 'chat' | 'debug') => void;
  chatLog: (sender: 'USER' | 'AI', message: string, metadata?: Record<string, any>) => void;
  debugLog: (operation: string, details: any) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

// Persistent log storage key
const STORAGE_KEYS = {
  SYSTEM_LOGS: 'tissaia_system_logs',
  CHAT_LOGS: 'tissaia_chat_logs',
  DEBUG_LOGS: 'tissaia_debug_logs',
  SESSION_START: 'tissaia_session_start'
};

// Load logs from localStorage
const loadStoredLogs = (key: string): SystemLog[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to load logs from ${key}:`, error);
  }
  return [];
};

// Save logs to localStorage
const saveLogsToStorage = (key: string, logs: SystemLog[]) => {
  try {
    // Only keep last 500 logs in storage to prevent quota issues
    const logsToStore = logs.slice(-500);
    localStorage.setItem(key, JSON.stringify(logsToStore));
  } catch (error) {
    console.warn(`Failed to save logs to ${key}:`, error);
  }
};

// Export logs to downloadable file
const downloadLogs = (logs: SystemLog[], filename: string) => {
  const logText = logs.map(log =>
    `[${log.timestamp}] [${log.level}] [${log.module}] ${log.message}`
  ).join('\n');

  const blob = new Blob([logText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize session start time
  const [sessionStart] = useState(() => {
    const existing = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    const start = existing || new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.SESSION_START, start);
    return start;
  });

  // Load existing logs from storage or create initial log
  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const storedLogs = loadStoredLogs(STORAGE_KEYS.SYSTEM_LOGS);
    if (storedLogs.length > 0) {
      return [
        ...storedLogs,
        {
          id: 'session_resume',
          timestamp: new Date().toISOString(),
          level: 'INFO',
          module: 'KERNEL',
          message: `Session resumed. Started at ${sessionStart}`
        }
      ];
    }
    return [{
      id: 'init',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      module: 'KERNEL',
      message: 'System EPS Architect Engine zainicjowany.'
    }];
  });

  // Persist logs to localStorage whenever they change
  useEffect(() => {
    saveLogsToStorage(STORAGE_KEYS.SYSTEM_LOGS, logs);
  }, [logs]);

  const addLog = useCallback((level: SystemLog['level'], module: string, message: string) => {
    const newLog: SystemLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      module,
      message
    };

    // Also log to console for debugging
    const logMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
    logMethod(`[${module}] ${message}`);

    setLogs(prev => {
        const updated = [...prev, newLog];
        return updated.slice(-UI_CONSTANTS.MAX_LOG_ENTRIES); // Keep last N logs in memory
    });
  }, []);

  const chatLog = useCallback((sender: 'USER' | 'AI', message: string, metadata?: Record<string, any>) => {
    const chatEntry: SystemLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level: 'INFO',
      module: 'CHAT',
      message: `[${sender}] ${message}${metadata ? ` | ${JSON.stringify(metadata)}` : ''}`
    };

    // Save to chat logs storage
    const existingChatLogs = loadStoredLogs(STORAGE_KEYS.CHAT_LOGS);
    saveLogsToStorage(STORAGE_KEYS.CHAT_LOGS, [...existingChatLogs, chatEntry]);

    // Also add to system logs
    addLog('INFO', 'CHAT', `${sender}: ${message}`);
  }, [addLog]);

  const debugLog = useCallback((operation: string, details: any) => {
    const debugEntry: SystemLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level: 'INFO',
      module: 'DEBUG',
      message: `${operation} | ${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`
    };

    // Save to debug logs storage
    const existingDebugLogs = loadStoredLogs(STORAGE_KEYS.DEBUG_LOGS);
    saveLogsToStorage(STORAGE_KEYS.DEBUG_LOGS, [...existingDebugLogs, debugEntry]);

    // Also log to console
    console.debug(`[DEBUG] ${operation}`, details);
  }, []);

  const clearLogs = useCallback(() => {
    const clearEntry = {
      id: 'cleared',
      timestamp: new Date().toISOString(),
      level: 'INFO' as const,
      module: 'KERNEL',
      message: 'Dziennik systemowy został wyczyszczony.'
    };

    setLogs([clearEntry]);

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.SYSTEM_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CHAT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.DEBUG_LOGS);
  }, []);

  const exportLogs = useCallback((type: 'all' | 'chat' | 'debug') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (type) {
      case 'chat':
        const chatLogs = loadStoredLogs(STORAGE_KEYS.CHAT_LOGS);
        downloadLogs(chatLogs, `tissaia_chat_${timestamp}.log`);
        addLog('INFO', 'SYSTEM', `Chat logs exported (${chatLogs.length} entries)`);
        break;

      case 'debug':
        const debugLogs = loadStoredLogs(STORAGE_KEYS.DEBUG_LOGS);
        downloadLogs(debugLogs, `tissaia_debug_${timestamp}.log`);
        addLog('INFO', 'SYSTEM', `Debug logs exported (${debugLogs.length} entries)`);
        break;

      case 'all':
      default:
        const allLogs = [
          ...logs,
          ...loadStoredLogs(STORAGE_KEYS.CHAT_LOGS),
          ...loadStoredLogs(STORAGE_KEYS.DEBUG_LOGS)
        ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        downloadLogs(allLogs, `tissaia_logs_${timestamp}.log`);
        addLog('INFO', 'SYSTEM', `All logs exported (${allLogs.length} entries)`);
        break;
    }
  }, [logs, addLog]);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs, exportLogs, chatLog, debugLog }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogger = () => {
  const context = useContext(LogContext);
  if (!context) throw new Error("useLogger must be used within LogProvider");
  return context;
};