
import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { DetectedCrop, AIResponseItem } from "../types";
import { fileToBase64 } from "../utils/image/processing";
import { TISSAIA_CONFIG } from "../config/pipeline.config";
import { DETECTION_STRATEGIES } from "../config/constants";
import { mockAnalyzeImage, mockRestoreImage } from "./mock/mock-ai.service";
import { analyzeImageViaBackend, restoreImageViaBackend } from "./backendApiService";

// Fix TS2580: Declare process for TypeScript compiler
declare const process: {
  env: {
    API_KEY?: string;
  };
};

// Check if backend mode is enabled via environment variable
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true' || import.meta.env.VITE_USE_BACKEND === '1';

const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING },
      confidence: { type: Type.NUMBER },
      ymin: { type: Type.NUMBER },
      xmin: { type: Type.NUMBER },
      ymax: { type: Type.NUMBER },
      xmax: { type: Type.NUMBER },
      rotation: { type: Type.NUMBER, description: "Rotation in degrees needed to make the person's head point UP (0, 90, 180, 270)." }
    },
    required: ["label", "confidence", "ymin", "xmin", "ymax", "xmax", "rotation"]
  }
};

// PHASE A: NEURAL OBJECT DETECTION
export const analyzeImage = async (file: File, fileId: string, expectedCount: number | null, logCallback?: (msg: string) => void): Promise<DetectedCrop[]> => {
  // USE BACKEND API IF ENABLED
  if (USE_BACKEND) {
    if (logCallback) logCallback(`[MODE] Using Backend API Server`);
    try {
      return await analyzeImageViaBackend(file, fileId, expectedCount, logCallback);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (logCallback) logCallback(`[BACKEND ERROR] ${errMsg}. Falling back to local mode...`);
      // Fall through to local processing on backend error
    }
  }

  const apiKey = process.env.API_KEY;
  const config = TISSAIA_CONFIG.pipeline_configuration.stages.STAGE_2_DETECTION;

  // SIMULATION MODE CHECK
  if (!apiKey || apiKey.trim() === '') {
    if (logCallback) logCallback(`[SIMULATION] API Key missing. Engaging DEMO PROTOCOL...`);
    return mockAnalyzeImage(fileId, expectedCount);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Process image file with error context
  let base64Data: string;
  try {
    base64Data = await fileToBase64(file);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process image file for analysis: ${errMsg}`);
  }

  let detectedObjects: AIResponseItem[] = [];
  let bestDetectedObjects: AIResponseItem[] = [];
  let minDiff = Infinity;
  let attempt = 0;
  // Use local strategies variable
  const strategies = DETECTION_STRATEGIES;
  // Use configured retry_count, bounded by available strategies
  const maxAttempts = (expectedCount !== null)
      ? Math.min(config.error_handling.retry_count, strategies.length) 
      : 1;

  while (attempt < maxAttempts) {
    const strategy = strategies[attempt];
    const targetHint = (expectedCount !== null) ? ` ${config.prompt_engineering.strategy_fallback}: MANIFEST COUNT TARGET: ${expectedCount}.` : "";
    
    if (logCallback) logCallback(`[${config.name}] Executing Strategy Lvl ${strategy.level}: ${strategy.name}...`);

    try {
      const response = await ai.models.generateContent({
        model: config.model_config.model_name,
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: `${config.prompt_engineering.system_role} ${config.prompt_engineering.task_directive} ${strategy.prompt_modifier}${targetHint} ${config.prompt_engineering.output_format_enforcement}` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: config.model_config.temperature,
          topK: config.model_config.top_k,
          systemInstruction: config.prompt_engineering.system_role
        }
      });

      // Safely access text and clean Markdown blocks
      const rawText = typeof (response as any).text === 'function' ? (response as any).text() : response.text;
      if (!rawText) throw new Error("AI returned empty response");

      const cleanJson = rawText.replace(/```json\n?|```/g, '').trim();

      try {
          detectedObjects = JSON.parse(cleanJson) as AIResponseItem[];

          // Validate response structure and data integrity
          if (!Array.isArray(detectedObjects)) {
            throw new Error("AI response is not an array");
          }

          // Validate each detected object has required fields and valid data
          detectedObjects.forEach((obj, idx) => {
            if (!obj.label || typeof obj.label !== 'string') {
              throw new Error(`Object ${idx} missing or invalid 'label' field`);
            }
            if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
              throw new Error(`Object ${idx} has invalid confidence value: ${obj.confidence}`);
            }
            const coords = ['xmin', 'ymin', 'xmax', 'ymax'];
            coords.forEach(coord => {
              const val = (obj as any)[coord];
              if (typeof val !== 'number' || val < 0 || val > 1000) {
                throw new Error(`Object ${idx} has invalid ${coord} coordinate: ${val}`);
              }
            });
            if (typeof obj.rotation !== 'number' || ![0, 90, 180, 270].includes(obj.rotation)) {
              throw new Error(`Object ${idx} has invalid rotation value: ${obj.rotation}`);
            }
          });

          // Update best candidate logic
          const diff = expectedCount !== null ? Math.abs(detectedObjects.length - expectedCount) : 0;
          if (diff < minDiff) {
              minDiff = diff;
              bestDetectedObjects = detectedObjects;
          }
      } catch (jsonErr: unknown) {
          const errMsg = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
          throw new Error(`Invalid AI response structure: ${errMsg}`);
      }
      
      // Verification Gate
      if (expectedCount === null || detectedObjects.length === expectedCount) {
        if (logCallback) logCallback(`[${config.name}] Success: ${detectedObjects.length} objects matched manifest.`);
        break;
      } else {
        if (logCallback) logCallback(`[${config.name}] Mismatch: Found ${detectedObjects.length}, Expected ${expectedCount}. Escalating strategy...`);
      }

    } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        if (logCallback) logCallback(`[${config.name}] Strategy Error: ${errMsg}`);
        // Fallback to simulation on API error
        if (errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('API key') || errMsg.includes('403')) {
             if (logCallback) logCallback(`[WARN] API Error (${errMsg}). Falling back to SIMULATION.`);
             return mockAnalyzeImage(fileId, expectedCount);
        }
    }
    attempt++;
  }

  return bestDetectedObjects.map((obj, i) => ({
      id: `${fileId}_crop_${i}`,
      label: obj.label,
      confidence: obj.confidence,
      ymin: obj.ymin,
      xmin: obj.xmin,
      ymax: obj.ymax,
      xmax: obj.xmax,
      rotation: obj.rotation
  }));
};

// PHASE B: ALCHEMY
export const restoreImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<string> => {
    // USE BACKEND API IF ENABLED
    if (USE_BACKEND) {
        try {
            return await restoreImageViaBackend(base64Data, mimeType);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.warn(`[BACKEND ERROR] ${errMsg}. Falling back to local mode...`);
            // Fall through to local processing on backend error
        }
    }

    const apiKey = process.env.API_KEY;
    const config = TISSAIA_CONFIG.pipeline_configuration.stages.STAGE_4_ALCHEMY;

    // SIMULATION MODE CHECK
    if (!apiKey || apiKey.trim() === '') {
        return mockRestoreImage(base64Data, mimeType);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // Construct Prompt from Config
    const promptStruct = config.prompt_directives.structure;
    const steps = promptStruct.steps.map((step, idx) => `${idx + 1}. ${step.id}: ${step.instruction}`).join('\n');
    const prompt = `
    ${promptStruct.role}
    ${promptStruct.input_context}
    TASKS:
    ${steps}
    Return the High-Fidelity restored image.
    `;

    try {
        const response = await ai.models.generateContent({
            model: config.model_config.model_name,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                temperature: config.model_config.temperature
            }
        });

        // Validate response structure
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("AI returned no candidates in response");
        }

        for (const part of response.candidates[0]?.content?.parts || []) {
            if (part.inlineData) {
                const restoredData = part.inlineData.data;
                if (!restoredData || typeof restoredData !== 'string') {
                    throw new Error("AI returned invalid image data");
                }
                return `data:image/png;base64,${restoredData}`;
            }
        }
        throw new Error("No image data found in AI response");

    } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error(`[ALCHEMY ERROR] ${errMsg}`, e);

        // Log specific API errors before falling back
        if (errMsg.includes('429') || errMsg.includes('Quota')) {
            console.warn('[ALCHEMY] API quota exceeded, using simulation fallback');
        } else if (errMsg.includes('403') || errMsg.includes('API key')) {
            console.warn('[ALCHEMY] API authentication failed, using simulation fallback');
        } else {
            console.warn(`[ALCHEMY] Restoration failed (${errMsg}), using simulation fallback`);
        }

        return mockRestoreImage(base64Data, mimeType);
    }
};
