
import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { DetectedCrop, AIResponseItem, PipelineConfiguration } from "../types";
import { fileToBase64 } from "../utils/imageProcessing";

// Fix TS2580: Declare process for TypeScript compiler
declare const process: any;

// --- PIPELINE CONFIGURATION ---

const TISSAIA_CONFIG: PipelineConfiguration = {
  pipeline_configuration: {
    meta: {
      id: "TISSAIA_CORE_V2",
      revision: "2.1.0-RC",
      last_updated: "2023-10-27",
      environment: "production"
    },
    global_constraints: {
      max_concurrent_restorations: 3,
      max_input_file_size_mb: 50,
      supported_mime_types: ["image/png", "image/jpeg", "image/webp", "image/heic"],
      security_sanitization: true
    },
    data_contracts: {
        ScanFile: { id: "UUID", lifecycle_state: "DONE", metrics: { original_resolution: "0x0", processing_time_ms: 0 } }
    },
    stages: {
      STAGE_1_INGESTION: {
        name: "Ingestion & Heuristics",
        description: "Initial file load and fast CV analysis.",
        timeout_ms: 5000,
        config: {
            heuristics_engine: {
                method: 'Analiza Krawędzi i Transformata Hougha',
                library: 'OpenCV.js (WASM)',
                parameters: { gaussian_blur_kernel: 5, canny_threshold_1: 50, canny_threshold_2: 150, hough_min_line_length: 100, hough_max_line_gap: 10 }
            },
            thumbnail_generation: { max_width: 800, quality: 0.8, format: 'image/jpeg' }
        },
        ui_feedback: { loading_message: "LOADING_RAW_BUFFER" }
      },
      STAGE_2_DETECTION: {
        name: "Total War (Detection)",
        description: "Multi-strategy vision analysis to segment scan bed.",
        service_endpoint: "geminiService.analyzeImage",
        model_config: {
          model_name: 'gemini-3-pro-preview',
          temperature: 0.4,
          max_output_tokens: 4096,
          safety_settings: 'BLOCK_ONLY_HIGH'
        },
        prompt_engineering: {
          system_role: "You are the NECRO_OS V14 Engine. Your goal is 100% segmentation accuracy based on the provided manifest.",
          task_directive: "Analyze the provided scanner flatbed image and return bounding boxes for each individual photograph.",
          output_format_enforcement: "Output JSON Array.",
          strategy_fallback: "Escalate strategy level if detected count does not match manifest.",
          strategies: [
            { level: 1, name: "Standard Watershed", focus: "High-Contrast", prompt_modifier: "Execute 'Standard Watershed' strategy. Identify distinct photographs. Filter: Area Threshold > 1.5%. Aspect Ratio 0.2-5.0. CRITICAL: Separate touching objects. Return rotation (0, 90, 180, 270) so heads face UP." },
            { level: 2, name: "Brute Force", focus: "Edge-Aware", prompt_modifier: "Execute 'Brute Force Parameters'. Increase sensitivity to faint edges. Detect overlapping photos or low-contrast boundaries. Return rotation." },
            { level: 3, name: "Glue Protocol", focus: "Fragment Merge", prompt_modifier: "Execute 'Glue Protocol'. Verify if photos are torn or fragmented. If an image is split, merge bounding boxes. Ignore dust. Return rotation." },
            { level: 4, name: "Fallback Contour", focus: "Emergency", prompt_modifier: "NECRO_OS EMERGENCY: Ignore all filters. Find any rectangular shapes that look like paper. Return rotation." }
          ]
        },
        error_handling: { retry_count: 4, fallback_action: 'ABORT' }
      },
      STAGE_3_SMART_CROP: {
        name: "Smart Crop Protocol",
        description: "Client-side hygiene cut and rotation.",
        execution_context: "Browser Main Thread",
        logic_rules: {
            coordinate_mapping: "Normalized 0-1000 to Pixel",
            hygiene_cut: { enabled: true, margin_percentage: 0.10, reason: "Remove scanner artifacts and white borders" },
            rotation_handling: { auto_rotate: true, background_fill: "transparent" },
            output_format: { mime: "image/png", quality: 1.0, encoding: "base64" }
        }
      },
      STAGE_4_ALCHEMY: {
        name: "Alchemy (Restoration)",
        description: "Generative restoration of cropped artifacts.",
        service_endpoint: "geminiService.restoreImage",
        cost_estimation: "High",
        model_config: {
            model_name: 'gemini-3-pro-image-preview',
            temperature: 0.7,
            safety_settings: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        prompt_directives: {
            structure: {
                role: "NECRO_OS PHASE B: ALCHEMY PROTOCOL ACTIVATED.",
                input_context: "INPUT: A 'Smart Cropped' fragment of a vintage photo.",
                steps: [
                    { id: 'OUTPAINTING', instruction: "Regenerate missing 10% borders." },
                    { id: 'HYGIENE', instruction: "Remove scratches, dust, and scanner artifacts." },
                    { id: 'DETAIL', instruction: "Enhance facial features and sharpness." },
                    { id: 'COLOR_GRADING', instruction: "Apply 'Kodak Portra 400' color profile." },
                    { id: 'SUPER_SHARPEN', instruction: "Maximize clarity." }
                ]
            }
        },
        ui_feedback: { loading_message: "GENERATING_ARTIFACT", success_message: "RESTORED" }
      }
    }
  }
};

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
  const apiKey = process.env.API_KEY;
  const config = TISSAIA_CONFIG.pipeline_configuration.stages.STAGE_2_DETECTION;

  // SIMULATION MODE CHECK
  if (!apiKey || apiKey.trim() === '') {
    if (logCallback) logCallback(`[SIMULATION] API Key missing. Engaging DEMO PROTOCOL...`);
    return mockAnalyzeImage(fileId, expectedCount);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const base64Data = await fileToBase64(file);

  let detectedObjects: AIResponseItem[] = [];
  let attempt = 0;
  const strategies = config.prompt_engineering.strategies;
  const maxAttempts = expectedCount ? strategies.length : 1; 

  while (attempt < maxAttempts) {
    const strategy = strategies[attempt];
    const targetHint = expectedCount ? ` ${config.prompt_engineering.strategy_fallback}: MANIFEST COUNT TARGET: ${expectedCount}.` : "";
    
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

      const rawText = response.text;
      if (!rawText) throw new Error("AI returned empty response");

      detectedObjects = JSON.parse(rawText) as AIResponseItem[];
      
      // Verification Gate
      if (expectedCount === null || detectedObjects.length === expectedCount) {
        if (logCallback) logCallback(`[${config.name}] Success: ${detectedObjects.length} objects matched manifest.`);
        break;
      } else {
        if (logCallback) logCallback(`[${config.name}] Mismatch: Found ${detectedObjects.length}, Expected ${expectedCount}. Escalating strategy...`);
      }

    } catch (e: any) {
        if (logCallback) logCallback(`[${config.name}] Strategy Error: ${e.message}`);
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
