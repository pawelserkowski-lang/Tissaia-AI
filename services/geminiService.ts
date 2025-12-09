import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { DetectedCrop, AIResponseItem } from "../types";
import { fileToBase64 } from "../utils/imageProcessing";

// Fix TS2580: Declare process for TypeScript compiler (Vercel/Vite build)
declare const process: any;

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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- SIMULATION LOGIC ---

const mockAnalyzeImage = async (fileId: string, expectedCount: number | null): Promise<DetectedCrop[]> => {
    await wait(2000); // Simulate network latency
    const count = expectedCount || Math.floor(Math.random() * 3) + 1;
    const crops: DetectedCrop[] = [];
    
    for(let i=0; i<count; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const width = 300;
        const height = 400;
        const gap = 50;

        crops.push({
            id: `${fileId}_sim_${i}`,
            label: `SIM_SUBJECT_${String.fromCharCode(65 + i)}`,
            confidence: 0.85 + (Math.random() * 0.14),
            xmin: 100 + (col * (width + gap)),
            ymin: 100 + (row * (height + gap)),
            xmax: 100 + (col * (width + gap)) + width,
            ymax: 100 + (row * (height + gap)) + height,
            rotation: 0
        });
    }
    return crops;
};

const mockRestoreImage = async (base64Data: string, mimeType: string): Promise<string> => {
    await wait(3000); // Simulate heavy GPU processing
    return `data:${mimeType};base64,${base64Data}`;
};


// PHASE A: TOTAL WAR EXTRACTION
export const analyzeImage = async (file: File, fileId: string, expectedCount: number | null, logCallback?: (msg: string) => void): Promise<DetectedCrop[]> => {
  // Retrieve API Key dynamically at function call time
  const apiKey = process.env.API_KEY;

  // SIMULATION MODE CHECK
  if (!apiKey || apiKey.trim() === '') {
    if (logCallback) logCallback(`[SIMULATION] API Key missing. Engaging DEMO PROTOCOL...`);
    return mockAnalyzeImage(fileId, expectedCount);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const base64Data = await fileToBase64(file);

  const STRATEGIES = [
    {
      level: 1,
      name: "Standard Watershed (High-Contrast)",
      prompt: `NECRO_OS PHASE A: Execute 'Standard Watershed' strategy. Identify distinct photographs on the scanner flatbed. Filter: Area Threshold > 1.5%. Aspect Ratio 0.2-5.0. CRITICAL: Separate touching objects. Return rotation (0, 90, 180, 270) so heads face UP. Accuracy must be 100%.`
    },
    {
      level: 2,
      name: "Brute Force Parameters (Edge-Aware)",
      prompt: `NECRO_OS PHASE A (RETRY): Execute 'Brute Force Parameters'. Increase sensitivity to faint edges. Detect overlapping photos or low-contrast boundaries. Return rotation.`
    },
    {
      level: 3,
      name: "Glue Protocol (Fragment Merge)",
      prompt: `NECRO_OS PHASE A (GLUE): Execute 'Glue Protocol'. Verify if photos are torn or fragmented. If an image is split, merge bounding boxes. Ignore dust. Return rotation.`
    },
    {
      level: 4,
      name: "Fallback Contour",
      prompt: `NECRO_OS EMERGENCY: Ignore all filters. Find any rectangular shapes that look like paper. Return rotation.`
    }
  ];

  let detectedObjects: AIResponseItem[] = [];
  let attempt = 0;
  const maxAttempts = expectedCount ? 4 : 1; 

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
        // Fallback to simulation on API error
        if (e.message.includes('429') || e.message.includes('Quota') || e.message.includes('API key') || e.message.includes('403')) {
             if (logCallback) logCallback(`[WARN] API Error (${e.message}). Falling back to SIMULATION.`);
             return mockAnalyzeImage(fileId, expectedCount);
        }
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

// PHASE B: ALCHEMY
export const restoreImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<string> => {
    // Retrieve API Key dynamically
    const apiKey = process.env.API_KEY;

    // SIMULATION MODE CHECK
    if (!apiKey || apiKey.trim() === '') {
        return mockRestoreImage(base64Data, mimeType);
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
    NECRO_OS PHASE B: ALCHEMY PROTOCOL ACTIVATED.
    INPUT: A "Smart Cropped" fragment of a vintage photo.
    TASKS: 1. OUTPAINTING: Regenerate missing 10% borders. 2. ORIENTATION: Upright. 3. HYGIENE: Remove artifacts. 4. DETAIL: Enhance features. 5. COLOR: Kodak Portra 400.
    PHASE POST: 6. SUPER SHARPEN.
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
        return mockRestoreImage(base64Data, mimeType);
    }
};