import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DetectedCrop, AIResponseItem } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

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
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeImage = async (file: File, fileId: string): Promise<DetectedCrop[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key Missing: Please check your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64Data } },
          { text: "Identify the main objects or regions of interest in this forensic scan. For each object, provide a specific label (e.g., 'fingerprint', 'scratch', 'subject_face', 'artifact'), a confidence score (0-1), and a bounding box using 0-1000 scale." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: "You are a highly precise forensic architecture engine. Your job is to segment image data for restoration."
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("AI returned empty response");

    const detectedObjects = JSON.parse(rawText) as AIResponseItem[];

    // Map AI response to our internal type
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
    console.error("Gemini Service Error:", error);
    throw error;
  }
};