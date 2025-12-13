/**
 * Model Initialization Hook
 *
 * Automatically fetches and selects the best AI models on app startup.
 * Provides state management for model discovery process.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  selectBestModels,
  refreshModelCache,
  getCurrentModelSelection,
  getCachedModels,
  isModelCacheInitialized,
  ModelSelection,
  DiscoveredModel
} from '../services/modelDiscoveryService';

export interface ModelInitializationState {
  isInitializing: boolean;
  isInitialized: boolean;
  error: string | null;
  selection: ModelSelection | null;
  availableModels: DiscoveredModel[];
  logs: string[];
}

export interface UseModelInitializationReturn extends ModelInitializationState {
  refreshModels: () => Promise<void>;
  getDetectionModel: () => string;
  getRestorationModel: () => string;
}

/**
 * Hook for initializing AI models at app startup
 * @param enabled - Whether to auto-initialize on mount
 */
export function useModelInitialization(enabled: boolean = true): UseModelInitializationReturn {
  const [state, setState] = useState<ModelInitializationState>({
    isInitializing: false,
    isInitialized: isModelCacheInitialized(),
    error: null,
    selection: isModelCacheInitialized() ? getCurrentModelSelection() : null,
    availableModels: getCachedModels(),
    logs: [],
  });

  const addLog = useCallback((msg: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-49), msg], // Keep last 50 logs
    }));
    console.log(msg);
  }, []);

  const initializeModels = useCallback(async () => {
    if (state.isInitializing) return;

    setState(prev => ({
      ...prev,
      isInitializing: true,
      error: null,
    }));

    try {
      addLog('[MODEL_INIT] Starting model discovery...');
      const selection = await selectBestModels(addLog);

      setState(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: true,
        selection,
        availableModels: getCachedModels(),
        error: null,
      }));

      addLog(`[MODEL_INIT] Model initialization complete`);
      addLog(`[MODEL_INIT] Detection: ${selection.detectionModel}`);
      addLog(`[MODEL_INIT] Restoration: ${selection.restorationModel}`);

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      addLog(`[MODEL_INIT] Error: ${errMsg}`);

      setState(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: true, // Still mark as initialized (with defaults)
        error: errMsg,
        selection: getCurrentModelSelection(),
      }));
    }
  }, [state.isInitializing, addLog]);

  const refreshModels = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isInitializing: true,
      error: null,
    }));

    try {
      addLog('[MODEL_INIT] Refreshing model cache...');
      const selection = await refreshModelCache(addLog);

      setState(prev => ({
        ...prev,
        isInitializing: false,
        isInitialized: true,
        selection,
        availableModels: getCachedModels(),
        error: null,
      }));

      addLog('[MODEL_INIT] Model refresh complete');

    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      addLog(`[MODEL_INIT] Refresh error: ${errMsg}`);

      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errMsg,
      }));
    }
  }, [addLog]);

  const getDetectionModel = useCallback((): string => {
    return state.selection?.detectionModel || getCurrentModelSelection().detectionModel;
  }, [state.selection]);

  const getRestorationModel = useCallback((): string => {
    return state.selection?.restorationModel || getCurrentModelSelection().restorationModel;
  }, [state.selection]);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (enabled && !state.isInitialized && !state.isInitializing) {
      initializeModels();
    }
  }, [enabled, state.isInitialized, state.isInitializing, initializeModels]);

  return {
    ...state,
    refreshModels,
    getDetectionModel,
    getRestorationModel,
  };
}

export default useModelInitialization;
