import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetectedCrop, AIResponseItem } from "../types";

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
    },
    required: ["label", "confidence", "ymin", "xmin", "ymax", "xmax"]
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

// Phase B: Adaptive Segmentation (AI Assisted)
export const analyzeImage = async (file: File, fileId: string): Promise<DetectedCrop[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key Missing: Please check your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: "TISSAIA V14 ENGINE: Execute 'Total War' Extraction Protocol. Identify distinct photographs on this flatbed scan. Be precise with bounding boxes (0-1000 scale). Ignore scanning bed artifacts. For each item, provide: label (e.g., 'photo', 'polaroid'), confidence, and coordinates." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: "You are the Tissaia Forensic Architecture Engine. Your goal is 100% segmentation accuracy."
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("AI returned empty response");

    const detectedObjects = JSON.parse(rawText) as AIResponseItem[];

    return detectedObjects.map((obj, idx) => ({
      id: `ai-${fileId}-${idx}-${Date.now()}`,
      label: obj.label,
      confidence: obj.confidence,
      ymin: obj.ymin,
      xmin: obj.xmin,
      ymax: obj.ymax,
      xmax: obj.xmax
    }));

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Section 3: Generative Restoration Kernel
export const restoreImage = async (cropBase64: string, mimeType: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key Missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: RESTORATION_MODEL,
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: cropBase64 } },
                    { text: "Execute Restoration Tasks: 1) Outpainting: Fix missing borders/geometry. 2) Digital Hygiene: Remove dust, scratches, scan lines. 3) Forensic Detail: Reconstruct facial landmarks without blurring. 4) HDR Remastering: Apply 'Kodak Portra 400' color science." }
                ]
            },
            config: {
               systemInstruction: "You are a Forensic Photo Restoration Specialist. Your output must be high-fidelity, print-ready, and historically accurate.",
               imageConfig: {
                   imageSize: "1K", // High Quality
                   aspectRatio: "1:1" // Or adapt based on crop logic
               }
            }
        });

        // Extract image from response
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        
        throw new Error("No image generated");

    } catch (error) {
        console.error("Gemini Restoration Error:", error);
        throw error;
    }
}
