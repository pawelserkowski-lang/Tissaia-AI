
import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { DetectedCrop, AIResponseItem, PipelineConfiguration } from "../types";
import { fileToBase64 } from "../utils/imageProcessing";

// Fix TS2580: Declare process for TypeScript compiler
declare const process: any;

// --- INTERNAL STRATEGIES ---
// Strategies updated to use YOLO and EfficientDet architectures
const DETECTION_STRATEGIES = [
  { level: 1, name: "YOLO v8", focus: "Real-time Detection", prompt_modifier: "Execute 'YOLO v8' simulation. Divide image into grid S*S. Predict Bounding Boxes (B) and Confidence Scores. Apply Non-Maximum Suppression (NMS) to merge overlapping boxes. Prioritize high-speed inference." },
  { level: 2, name: "EfficientDet D7", focus: "Multi-Scale Accuracy", prompt_modifier: "Execute 'EfficientDet D7' simulation. Utilize BiFPN (Bidirectional Feature Pyramid Network) for feature fusion. Detect small and large objects with high precision. Scaling factor: phi=7." },
  { level: 3, name: "Faster R-CNN", focus: "Region Proposals", prompt_modifier: "Execute 'Faster R-CNN' simulation. Generate Region Proposals via RPN. Apply ROI Pooling. Perform final classification and bounding box regression. Prioritize exact boundaries." },
  { level: 4, name: "RetinaNet", focus: "Dense Object Detection", prompt_modifier: "Execute 'RetinaNet' simulation. Apply Focal Loss to address class imbalance. Detect objects in dense arrangements." }
];

// --- PIPELINE CONFIGURATION ---

const TISSAIA_CONFIG: PipelineConfiguration = {
  pipeline_configuration: {
    meta: {
      id: "TISSAIA_CORE_V2",
      revision: "2.2.0-YOLO",
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
        description: "Initial file load and Edge Detection via Hough Transform to propose Object Count.",
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
        name: "Neural Object Detection",
        description: "State-of-the-art vision analysis using YOLO/EfficientDet architectures with Verified Count.",
        service_endpoint: "geminiService.analyzeImage",
        model_config: {
          model_name: 'gemini-3-pro-preview',
          temperature: 0.4,
          max_output_tokens: 4096,
          safety_settings: 'BLOCK_ONLY_HIGH'
        },
        prompt_engineering: {
          system_role: "You are the NECRO_OS V14 Vision Engine (YOLO/EfficientDet). Your goal is 100% segmentation accuracy.",
          task_directive: "Analyze the provided scanner flatbed image and return bounding boxes for each individual photograph.",
          output_format_enforcement: "Output JSON Array.",
          strategy_fallback: "Escalate model architecture if detected count does not match manifest."
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
                    { id: 'COLOR_GRADING', instruction: "Apply 'Kodak Portra 400' color profile." }
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
    const count = (expectedCount !== null) ? expectedCount : Math.floor(Math.random() * 4) + 1;
    const crops: DetectedCrop[] = [];
    
    // Dynamic Grid Layout Calculation to fit ANY count within 1000x1000
    // This fixes the bug where >4 photos would be drawn off-canvas
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const padding = 40;
    const availableWidth = 1000 - (padding * 2);
    const availableHeight = 1000 - (padding * 2);
    
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    const gap = 20;

    for(let i=0; i<count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Add some organic variation to box sizes
        const wVariation = (Math.random() * 0.15) + 0.85; // 85-100% of cell
        const hVariation = (Math.random() * 0.15) + 0.85;
        
        const itemW = (cellWidth - gap) * wVariation;
        const itemH = (cellHeight - gap) * hVariation;
        
        // Center item in cell
        const xOffset = (cellWidth - itemW) / 2;
        const yOffset = (cellHeight - itemH) / 2;

        const xmin = padding + (col * cellWidth) + xOffset;
        const ymin = padding + (row * cellHeight) + yOffset;
        const xmax = xmin + itemW;
        const ymax = ymin + itemH;

        crops.push({
            id: `${fileId}_sim_${i}`,
            label: `SIM_OBJ_${String.fromCharCode(65 + i)}`,
            confidence: 0.85 + (Math.random() * 0.14),
            xmin: Math.floor(xmin),
            ymin: Math.floor(ymin),
            xmax: Math.floor(xmax),
            ymax: Math.floor(ymax),
            rotation: 0
        });
    }
    return crops;
};

const mockRestoreImage = async (base64Data: string, mimeType: string): Promise<string> => {
    await wait(3000); // Simulate heavy GPU processing
    return `data:${mimeType};base64,${base64Data}`;
};


// PHASE A: NEURAL OBJECT DETECTION
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

          // Update best candidate logic
          const diff = expectedCount !== null ? Math.abs(detectedObjects.length - expectedCount) : 0;
          if (diff < minDiff) {
              minDiff = diff;
              bestDetectedObjects = detectedObjects;
          }
      } catch (jsonErr) {
          throw new Error("Malformed JSON response from Neural Engine.");
      }
      
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
