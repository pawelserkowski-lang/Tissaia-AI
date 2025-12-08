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
      ymin: { type: Type.NUMBER, description: "Bounding box ymin [0-1000]" },
      xmin: { type: Type.NUMBER, description: "Bounding box xmin [0-1000]" },
      ymax: { type: Type.NUMBER, description: "Bounding box ymax [0-1000]" },
      xmax: { type: Type.NUMBER, description: "Bounding box xmax [0-1000]" },
      rotation: { type: Type.NUMBER, description: "Rotation in degrees needed to make the person's head point UP (0, 90, 180, 270)." }
    },
    required: ["label", "confidence", "ymin", "xmin", "ymax", "xmax", "rotation"]
  }
};

// OPTIMIZATION: Resize image for analysis phase ONLY.
// Detection doesn't need 4K resolution. 1536px is plenty for bounding boxes.
// This reduces payload from ~10MB to ~300KB, speeding up Gemini 3 Pro drastically.
const resizeForAnalysis = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1536; // Sweet spot for Gemini Vision speed/accuracy
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use JPEG at 0.8 quality for efficient analysis payload
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
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

// Phase B: Adaptive Segmentation (The Loop)
// Implements Strategies L1 - L4
export const analyzeImage = async (file: File, fileId: string, expectedCount: number | null, logCallback?: (msg: string) => void): Promise<DetectedCrop[]> => {
  if (!import.meta.env.VITE_API_KEY) {
    throw new Error("API Key Missing: Please check your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  
  // OPTIMIZATION: Use resized image for analysis to speed up "Initial Verification"
  // If we are doing a deep retry (expectedCount is set), we might use full res, 
  // but usually resize is safer for latency even then.
  const base64Data = await resizeForAnalysis(file);

  // Strategies Definition (Prompts)
  const STRATEGIES = [
    {
      level: 1,
      name: "Standard Watershed",
      prompt: `TISSAIA V14: Execute Standard Extraction. Identify distinct photographs. Be precise. Return bounding box coordinates normalized to [0-1000]. Return rotation (0, 90, 180, 270) so heads face UP.`
    },
    {
      level: 2,
      name: "Brute Force Parameter Search",
      prompt: `TISSAIA V14: EXECUTE DEEP SCAN. Previous scan failed count check. Look for faint borders, low contrast edges, and overlapping items. Sensitivity: HIGH. Coords [0-1000]. Return rotation.`
    },
    {
      level: 3,
      name: "The Glue Protocol",
      prompt: `TISSAIA V14: GLUE PROTOCOL ACTIVE. Verify if photos are torn or fragmented. If an image is split, merge the bounding box into one valid photo. Ignore small dust/scraps. Coords [0-1000]. Return rotation.`
    },
    {
      level: 4,
      name: "Fallback Contour",
      prompt: `TISSAIA V14: EMERGENCY FALLBACK. Ignore all noise. Find any rectangular shapes that look like paper. Coords [0-1000]. Return rotation.`
    }
  ];

  let detectedObjects: AIResponseItem[] = [];
  let attempt = 0;
  const maxAttempts = expectedCount ? 4 : 1; // Only loop if we have a Ground Truth

  while (attempt < maxAttempts) {
    const strategy = STRATEGIES[attempt];
    const targetHint = expectedCount ? ` TARGET COUNT: ${expectedCount}.` : "";
    
    if (logCallback) logCallback(`Uruchamianie strategii L${strategy.level}: ${strategy.name}...`);

    try {
      const response = await ai.models.generateContent({
        model: ANALYSIS_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: `${strategy.prompt}${targetHint} Output JSON.` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          systemInstruction: "You are the Tissaia Forensic Architecture Engine. Your goal is 100% segmentation accuracy. Always return coordinates in [0-1000] scale."
        }
      });

      const rawText = response.text;
      if (!rawText) throw new Error("AI returned empty response");
      
      // MODIFIED: Sanitization logic for Markdown blocks
      const cleanText = rawText.replace(/```json\n?|```/g, '').trim();

      detectedObjects = JSON.parse(cleanText) as AIResponseItem[];
      
      // Verification Gate
      if (expectedCount === null || detectedObjects.length === expectedCount) {
        if (logCallback) logCallback(`Sukces L${strategy.level}: Wykryto ${detectedObjects.length} (Zgodność 100%).`);
        break; // Match found!
      } else {
        if (logCallback) logCallback(`Błąd L${strategy.level}: Wykryto ${detectedObjects.length} vs Oczekiwano ${expectedCount}. Ponawianie...`);
      }

    } catch (error) {
      console.error(`Strategy L${strategy.level} Failed:`, error);
      if (logCallback) logCallback(`Wyjątek w L${strategy.level}.`);
    }

    attempt++;
  }

  // If we exhaust all strategies, we return the last result (or best fit logic could be added)
  return detectedObjects.map((obj, idx) => ({
    id: `ai-${fileId}-${idx}-${Date.now()}`,
    label: obj.label,
    confidence: obj.confidence,
    ymin: obj.ymin,
    xmin: obj.xmin,
    ymax: obj.ymax,
    xmax: obj.xmax,
    rotation: obj.rotation || 0
  }));
};

// Section 3: Generative Restoration Kernel
export const restoreImage = async (cropBase64: string, mimeType: string): Promise<string> => {
    if (!import.meta.env.VITE_API_KEY) {
    console.error("Brak klucza API! Upewnij się, że zdefiniowałeś VITE_API_KEY.");
    throw new Error("API Key not found");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    
    // Clean base64 header if present for API call
    const cleanBase64 = cropBase64.includes(',') ? cropBase64.split(',')[1] : cropBase64;

    try {
        const response = await ai.models.generateContent({
            model: RESTORATION_MODEL,
            contents: {
                parts: [
                    { text: "Execute Restoration Tasks: 1) Outpainting: Fix missing borders/geometry. 2) Digital Hygiene: Remove dust, scratches, scan lines. 3) Forensic Detail: Reconstruct facial landmarks without blurring. 4) HDR Remastering: Apply 'Kodak Portra 400' color science." },
                    { inlineData: { mimeType: mimeType, data: cleanBase64 } }
                ]
            },
            config: {
               imageConfig: {
                   imageSize: "1K", 
                   aspectRatio: "1:1" 
               }
            }
        });

        for (const candidate of response.candidates || []) {
            for (const part of candidate.content?.parts || []) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        
        throw new Error("No image generated by Restoration Kernel");

    } catch (error) {
        console.error("Gemini Restoration Error:", error);
        throw error;
    }
}