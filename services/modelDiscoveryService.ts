/**
 * Model Discovery Service
 *
 * Automatically fetches and selects the best AI models from Gemini API.
 * Prioritizes the newest model versions for optimal performance.
 */

import { GoogleGenAI } from "@google/genai";

// Fix TS2580: Declare process for TypeScript compiler
declare const process: {
  env: {
    API_KEY?: string;
  };
};

// Model capability categories
export type ModelCapability = 'text' | 'vision' | 'image_generation' | 'code';

export interface DiscoveredModel {
  name: string;           // Full model name (e.g., 'gemini-2.0-flash-exp')
  displayName: string;    // Human readable name
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods: string[];
  version?: string;       // Extracted version number
  capabilities: ModelCapability[];
  isPreview: boolean;
  isExperimental: boolean;
  priority: number;       // Higher = better (newer, more capable)
}

export interface ModelSelection {
  detectionModel: string;   // For Stage 2 - Neural Object Detection
  restorationModel: string; // For Stage 4 - Alchemy (image generation)
  fallbackDetectionModel: string;
  fallbackRestorationModel: string;
}

// Default models as fallback
export const DEFAULT_MODELS: ModelSelection = {
  detectionModel: 'gemini-2.0-flash',
  restorationModel: 'gemini-2.0-flash-exp',
  fallbackDetectionModel: 'gemini-1.5-flash',
  fallbackRestorationModel: 'gemini-1.5-flash',
};

// Cached models state
let cachedModels: DiscoveredModel[] = [];
let cachedSelection: ModelSelection | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Extract version number from model name for sorting
 * E.g., "gemini-2.0-flash" -> 2.0, "gemini-1.5-pro" -> 1.5
 */
function extractVersion(modelName: string): number {
  const versionMatch = modelName.match(/(\d+)\.(\d+)/);
  if (versionMatch) {
    return parseFloat(`${versionMatch[1]}.${versionMatch[2]}`);
  }
  return 0;
}

/**
 * Calculate priority score for model selection
 * Higher score = better model (newer, more capable)
 */
function calculateModelPriority(model: DiscoveredModel): number {
  let score = 0;

  // Version is the most important factor (x100)
  const version = extractVersion(model.name);
  score += version * 100;

  // Pro models get bonus
  if (model.name.includes('pro')) score += 20;

  // Experimental models get slight bonus (newest features)
  if (model.isExperimental) score += 15;

  // Preview models get small bonus
  if (model.isPreview) score += 10;

  // Flash models are fast and efficient
  if (model.name.includes('flash')) score += 5;

  // Image generation capability bonus for restoration model
  if (model.capabilities.includes('image_generation')) score += 30;

  // Vision capability bonus for detection model
  if (model.capabilities.includes('vision')) score += 25;

  // Higher token limits are better
  if (model.outputTokenLimit) {
    score += Math.min(model.outputTokenLimit / 1000, 20);
  }

  return score;
}

/**
 * Determine model capabilities from name and supported methods
 */
function determineCapabilities(name: string, methods: string[]): ModelCapability[] {
  const caps: ModelCapability[] = [];

  // All Gemini models support text
  caps.push('text');

  // Vision models (most Gemini 1.5+ support vision)
  if (methods.includes('generateContent')) {
    caps.push('vision');
  }

  // Image generation (look for image-related names or methods)
  if (name.includes('image') ||
      name.includes('imagen') ||
      methods.includes('generateImage') ||
      name.includes('exp')) {
    caps.push('image_generation');
  }

  // Code capability
  if (name.includes('code') || methods.includes('generateCode')) {
    caps.push('code');
  }

  return caps;
}

/**
 * Fetch available models from Gemini API
 */
export async function fetchAvailableModels(logCallback?: (msg: string) => void): Promise<DiscoveredModel[]> {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    if (logCallback) logCallback('[MODEL_DISCOVERY] No API key available, using default models');
    return [];
  }

  // Check cache
  if (cachedModels.length > 0 && Date.now() - lastFetchTime < CACHE_DURATION_MS) {
    if (logCallback) logCallback('[MODEL_DISCOVERY] Using cached model list');
    return cachedModels;
  }

  try {
    if (logCallback) logCallback('[MODEL_DISCOVERY] Fetching available models from Gemini API...');

    const ai = new GoogleGenAI({ apiKey });

    // Use the models.list endpoint
    const response = await ai.models.list();

    const models: DiscoveredModel[] = [];

    // Process the response - handle both iterator and direct array
    const modelList = response as any;

    if (modelList && typeof modelList[Symbol.asyncIterator] === 'function') {
      // It's an async iterator
      for await (const model of modelList) {
        const modelData = processModelData(model);
        if (modelData) models.push(modelData);
      }
    } else if (Array.isArray(modelList)) {
      // Direct array
      for (const model of modelList) {
        const modelData = processModelData(model);
        if (modelData) models.push(modelData);
      }
    } else if (modelList?.models) {
      // Object with models array
      for (const model of modelList.models) {
        const modelData = processModelData(model);
        if (modelData) models.push(modelData);
      }
    }

    // Sort by priority (highest first)
    models.sort((a, b) => b.priority - a.priority);

    // Update cache
    cachedModels = models;
    lastFetchTime = Date.now();

    if (logCallback) {
      logCallback(`[MODEL_DISCOVERY] Found ${models.length} available models`);
      if (models.length > 0) {
        logCallback(`[MODEL_DISCOVERY] Top models: ${models.slice(0, 3).map(m => m.name).join(', ')}`);
      }
    }

    return models;

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (logCallback) logCallback(`[MODEL_DISCOVERY] Error fetching models: ${errMsg}`);
    console.error('[MODEL_DISCOVERY] API Error:', error);
    return cachedModels.length > 0 ? cachedModels : [];
  }
}

/**
 * Process raw model data from API
 */
function processModelData(model: any): DiscoveredModel | null {
  if (!model || !model.name) return null;

  // Extract just the model ID from full path (e.g., "models/gemini-2.0-flash" -> "gemini-2.0-flash")
  const modelName = model.name.replace('models/', '');

  // Filter out non-generative models
  const methods = model.supportedGenerationMethods || [];
  if (!methods.includes('generateContent')) {
    return null;
  }

  const isPreview = modelName.includes('preview');
  const isExperimental = modelName.includes('exp');
  const capabilities = determineCapabilities(modelName, methods);

  const discoveredModel: DiscoveredModel = {
    name: modelName,
    displayName: model.displayName || modelName,
    description: model.description,
    inputTokenLimit: model.inputTokenLimit,
    outputTokenLimit: model.outputTokenLimit,
    supportedGenerationMethods: methods,
    version: extractVersion(modelName).toString(),
    capabilities,
    isPreview,
    isExperimental,
    priority: 0, // Will be calculated below
  };

  discoveredModel.priority = calculateModelPriority(discoveredModel);

  return discoveredModel;
}

/**
 * Select the best models for each pipeline stage
 * Prioritizes: newest version > pro > experimental > preview > flash
 */
export async function selectBestModels(logCallback?: (msg: string) => void): Promise<ModelSelection> {
  // Check cache
  if (cachedSelection && Date.now() - lastFetchTime < CACHE_DURATION_MS) {
    if (logCallback) logCallback('[MODEL_DISCOVERY] Using cached model selection');
    return cachedSelection;
  }

  const models = await fetchAvailableModels(logCallback);

  if (models.length === 0) {
    if (logCallback) logCallback('[MODEL_DISCOVERY] No models found, using defaults');
    return DEFAULT_MODELS;
  }

  // Find best model for detection (needs vision capability)
  const visionModels = models.filter(m => m.capabilities.includes('vision'));
  const detectionModel = visionModels[0]?.name || DEFAULT_MODELS.detectionModel;
  const fallbackDetection = visionModels[1]?.name || DEFAULT_MODELS.fallbackDetectionModel;

  // Find best model for restoration (prefer image generation capability, but vision works too)
  const imageModels = models.filter(m => m.capabilities.includes('image_generation'));
  const restorationModel = imageModels[0]?.name || visionModels[0]?.name || DEFAULT_MODELS.restorationModel;
  const fallbackRestoration = imageModels[1]?.name || visionModels[1]?.name || DEFAULT_MODELS.fallbackRestorationModel;

  const selection: ModelSelection = {
    detectionModel,
    restorationModel,
    fallbackDetectionModel: fallbackDetection,
    fallbackRestorationModel: fallbackRestoration,
  };

  cachedSelection = selection;

  if (logCallback) {
    logCallback(`[MODEL_DISCOVERY] Selected Detection Model: ${detectionModel}`);
    logCallback(`[MODEL_DISCOVERY] Selected Restoration Model: ${restorationModel}`);
  }

  return selection;
}

/**
 * Get current model selection (from cache or fetch if needed)
 */
export function getCurrentModelSelection(): ModelSelection {
  return cachedSelection || DEFAULT_MODELS;
}

/**
 * Force refresh of model cache
 */
export async function refreshModelCache(logCallback?: (msg: string) => void): Promise<ModelSelection> {
  cachedModels = [];
  cachedSelection = null;
  lastFetchTime = 0;
  return selectBestModels(logCallback);
}

/**
 * Get all cached models (for UI display)
 */
export function getCachedModels(): DiscoveredModel[] {
  return [...cachedModels];
}

/**
 * Check if models are initialized
 */
export function isModelCacheInitialized(): boolean {
  return cachedSelection !== null;
}
