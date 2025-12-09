import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetectedCrop, AIResponseItem } from "../types";

// Polyfill for process in browser environment to satisfy TypeScript
declare const process: {
  env: {
    API_KEY: string;
  }
};

// Section 3 Spec: "Gemini 3 Pro Vision" for analysis
const ANALYSIS_MODEL = 'gemini-3-pro-preview';
// Section 3 Spec: "Gemini 3 Pro Image Preview" for generation
const RESTORATION_MODEL = 'gemini-3-pro-image-preview';

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

const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// PHASE A: TOTAL WAR EXTRACTION
// Implements NECRO_OS Strategies
export const analyzeImage = async (file: File, fileId: string, expectedCount: number | null, logCallback?: (msg: string) => void): Promise<DetectedCrop[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key Missing: Please check your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  // Strategies Definition (NECRO_OS V14)
  const STRATEGIES = [
    {
      level: 1,
      name: "Standard Watershed (High-Contrast)",
      prompt: `NECRO_OS PHASE A: Execute 'Standard Watershed' strategy. 
      Identify distinct photographs on the scanner flatbed. 
      Filter: Area Threshold > 1.5%. Aspect Ratio 0.2-5.0.
      CRITICAL: Separate touching objects. Return rotation (0, 90, 180, 270) so heads face UP. Accuracy must be 100%.`
    },
    {
      level: 2,
      name: "Brute Force Parameters (Edge-Aware)",
      prompt: `NECRO_OS PHASE A (RETRY): Execute 'Brute Force Parameters'. 
      Previous count failed. Increase sensitivity to faint edges. 
      Detect overlapping photos or low-contrast boundaries. Return rotation.`
    },
    {
      level: 3,
      name: "Glue Protocol (Fragment Merge)",
      prompt: `NECRO_OS PHASE A (GLUE): Execute 'Glue Protocol'. 
      Verify if photos are torn or fragmented. If an image is split, merge bounding boxes. 
      Ignore dust. Return rotation.`
    },
    {
      level: 4,
      name: "Fallback Contour",
      prompt: `NECRO_OS EMERGENCY: Ignore all filters. Find any rectangular shapes that look like paper. Return rotation.`
    }
  ];

  let detectedObjects: AIResponseItem[] = [];
  let attempt = 0;
  const maxAttempts = expectedCount ? 4 : 1; // Only loop if we have a Ground Truth

  while (attempt < maxAttempts) {
    const strategy = STRATEGIES[attempt];
    const targetHint = expectedCount ? ` MANIFEST COUNT TARGET: ${expectedCount}.` : "";
    
    if (logCallback) logCallback(`[PHASE A] Executing ${strategy.name}...`);

    try {
      const response = await ai.models.generateContent({
        model: ANALYSIS_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: `${strategy.prompt}${targetHint} Output JSON.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          systemInstruction: "You are the NECRO_OS V14 Engine. Your goal is 100% segmentation accuracy based on the provided manifest."
        }
      });

      const rawText = response.text;
      if (!rawText) throw new Error("AI returned empty response");

      detectedObjects = JSON.parse(rawText) as AIResponseItem[];
      
      // Verification Gate
      if (expectedCount === null || detectedObjects.length === expectedCount) {
        if (logCallback) logCallback(`[PHASE A] Success: ${detectedObjects.length} objects matched manifest.`);
        break;
      } else {
        if (logCallback) logCallback(`[PHASE A] Mismatch: Found ${detectedObjects.length}, Expected ${expectedCount}. Escalating...`);
      }

    } catch (e: any) {
        if (logCallback) logCallback(`[PHASE A] Strategy Error: ${e.message}`);
    }

    attempt++;
  }

  return detectedObjects.map((obj, i) => ({
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

// PHASE B: ALCHEMY (GENERATIVE RESTORATION)
// PHASE POST: FINALIZATION
export const restoreImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key Missing");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Remove data:image/png;base64, prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // NECRO_OS V14 Prompt
    const prompt = `
    NECRO_OS PHASE B: ALCHEMY PROTOCOL ACTIVATED.
    
    INPUT: A "Smart Cropped" fragment of a vintage photo (borders cropped 10% to remove jagged edges).
    
    TASKS:
    1. OUTPAINTING: Regenerate the missing 10% borders to restore the complete composition.
    2. ORIENTATION: Ensure the subject is upright.
    3. DIGITAL HYGIENE: Remove dust, scratches, and scanner artifacts.
    4. FORENSIC DETAIL: Enhance facial features and textures.
    5. COLOR GRADING: Apply "Kodak Portra 400" aesthetic (natural warmth, fine grain).
    
    PHASE POST:
    6. SUPER SHARPEN: Apply visual sharpening to the final output.
    
    Return the High-Fidelity restored image.
    `;

    try {
        const response = await ai.models.generateContent({
            model: RESTORATION_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType, data: cleanBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    // Default aspect ratio, model infers from input + outpainting request
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        
        throw new Error("No image generated.");

    } catch (e) {
        console.error("Alchemy Failed", e);
        return `data:${mimeType};base64,${cleanBase64}`;
    }
};