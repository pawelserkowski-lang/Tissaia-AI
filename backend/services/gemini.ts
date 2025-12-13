import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';
import type { DetectedCrop, AIResponseItem } from '../types/index.js';
import logger from './logger.js';
import { fileToBase64, getMimeType } from './storage.js';

// Detection strategies
const DETECTION_STRATEGIES = [
  {
    level: 1,
    name: 'YOLO v8',
    focus: 'Real-time Detection',
    prompt_modifier:
      "Execute 'YOLO v8' simulation. Divide image into grid S*S. Predict Bounding Boxes (B) and Confidence Scores. Apply Non-Maximum Suppression (NMS) to merge overlapping boxes. Prioritize high-speed inference.",
  },
  {
    level: 2,
    name: 'EfficientDet D7',
    focus: 'Multi-Scale Accuracy',
    prompt_modifier:
      "Execute 'EfficientDet D7' simulation. Utilize BiFPN (Bidirectional Feature Pyramid Network) for feature fusion. Detect small and large objects with high precision. Scaling factor: phi=7.",
  },
  {
    level: 3,
    name: 'Faster R-CNN',
    focus: 'Region Proposals',
    prompt_modifier:
      "Execute 'Faster R-CNN' simulation. Generate Region Proposals via RPN. Apply ROI Pooling. Perform final classification and bounding box regression. Prioritize exact boundaries.",
  },
  {
    level: 4,
    name: 'RetinaNet',
    focus: 'Dense Object Detection',
    prompt_modifier:
      "Execute 'RetinaNet' simulation. Apply Focal Loss to address class imbalance. Detect objects in dense arrangements.",
  },
];

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
      rotation: {
        type: Type.NUMBER,
        description: "Rotation in degrees needed to make the person's head point UP (0, 90, 180, 270).",
      },
    },
    required: ['label', 'confidence', 'ymin', 'xmin', 'ymax', 'ymax', 'rotation'],
  },
};

// Configuration from pipeline.config.ts
const DETECTION_CONFIG = {
  name: 'Neural Object Detection',
  model_config: {
    model_name: 'gemini-3-pro-preview',
    temperature: 0.4,
    top_k: 40,
  },
  prompt_engineering: {
    system_role:
      'You are the NECRO_OS V14 Vision Engine (YOLO/EfficientDet). Your goal is 100% segmentation accuracy.',
    task_directive:
      'Analyze the provided scanner flatbed image and return bounding boxes for each individual photograph.',
    output_format_enforcement: 'Output JSON Array.',
    strategy_fallback: 'Escalate model architecture if detected count does not match manifest.',
  },
  error_handling: {
    retry_count: 4,
  },
};

const ALCHEMY_CONFIG = {
  name: 'Alchemy (Restoration)',
  model_config: {
    model_name: 'gemini-3-pro-image-preview',
    temperature: 0.7,
  },
  prompt_directives: {
    structure: {
      role: 'NECRO_OS PHASE B: ALCHEMY PROTOCOL ACTIVATED.',
      input_context: "INPUT: A 'Smart Cropped' fragment of a vintage photo.",
      steps: [
        { id: 'OUTPAINTING', instruction: 'Regenerate missing 10% borders.' },
        { id: 'HYGIENE', instruction: 'Remove scratches, dust, and scanner artifacts.' },
        { id: 'DETAIL', instruction: 'Enhance facial features and sharpness.' },
        { id: 'COLOR_GRADING', instruction: "Apply 'Kodak Portra 400' color profile." },
      ],
    },
  },
};

/**
 * Analyze image and detect objects/photos
 */
export const analyzeImage = async (
  filePath: string,
  fileId: string,
  expectedCount: number | null,
  logs: string[] = []
): Promise<DetectedCrop[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const msg = '[ERROR] Gemini API key not configured. Please set GEMINI_API_KEY in .env file.';
    logger.error(msg);
    logs.push(msg);
    throw new Error('API key not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Get file info and convert to base64
  const mimeType = getMimeType(filePath);
  let base64Data: string;

  try {
    base64Data = await fileToBase64(filePath);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Failed to process image file for analysis', { error: errMsg, filePath });
    throw new Error(`Failed to process image file: ${errMsg}`);
  }

  let detectedObjects: AIResponseItem[] = [];
  let bestDetectedObjects: AIResponseItem[] = [];
  let minDiff = Infinity;
  let attempt = 0;

  const maxAttempts =
    expectedCount !== null
      ? Math.min(DETECTION_CONFIG.error_handling.retry_count, DETECTION_STRATEGIES.length)
      : 1;

  while (attempt < maxAttempts) {
    const strategy = DETECTION_STRATEGIES[attempt];
    const targetHint =
      expectedCount !== null
        ? ` ${DETECTION_CONFIG.prompt_engineering.strategy_fallback}: MANIFEST COUNT TARGET: ${expectedCount}.`
        : '';

    const logMsg = `[${DETECTION_CONFIG.name}] Executing Strategy Lvl ${strategy.level}: ${strategy.name}...`;
    logger.info(logMsg);
    logs.push(logMsg);

    try {
      const response = await ai.models.generateContent({
        model: DETECTION_CONFIG.model_config.model_name,
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            {
              text: `${DETECTION_CONFIG.prompt_engineering.system_role} ${DETECTION_CONFIG.prompt_engineering.task_directive} ${strategy.prompt_modifier}${targetHint} ${DETECTION_CONFIG.prompt_engineering.output_format_enforcement}`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: DETECTION_CONFIG.model_config.temperature,
          topK: DETECTION_CONFIG.model_config.top_k,
          systemInstruction: DETECTION_CONFIG.prompt_engineering.system_role,
        },
      });

      // Safely access text and clean Markdown blocks
      const rawText = typeof (response as any).text === 'function' ? (response as any).text() : response.text;
      if (!rawText) throw new Error('AI returned empty response');

      const cleanJson = rawText.replace(/```json\n?|```/g, '').trim();

      try {
        detectedObjects = JSON.parse(cleanJson) as AIResponseItem[];

        // Validate response structure
        if (!Array.isArray(detectedObjects)) {
          throw new Error('AI response is not an array');
        }

        // Validate each detected object
        detectedObjects.forEach((obj, idx) => {
          if (!obj.label || typeof obj.label !== 'string') {
            throw new Error(`Object ${idx} missing or invalid 'label' field`);
          }
          if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
            throw new Error(`Object ${idx} has invalid confidence value: ${obj.confidence}`);
          }
          const coords = ['xmin', 'ymin', 'xmax', 'ymax'];
          coords.forEach((coord) => {
            const val = (obj as any)[coord];
            if (typeof val !== 'number' || val < 0 || val > 1000) {
              throw new Error(`Object ${idx} has invalid ${coord} coordinate: ${val}`);
            }
          });
          if (typeof obj.rotation !== 'number' || ![0, 90, 180, 270].includes(obj.rotation)) {
            throw new Error(`Object ${idx} has invalid rotation value: ${obj.rotation}`);
          }
        });

        // Update best candidate
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
        const successMsg = `[${DETECTION_CONFIG.name}] Success: ${detectedObjects.length} objects matched manifest.`;
        logger.info(successMsg);
        logs.push(successMsg);
        break;
      } else {
        const mismatchMsg = `[${DETECTION_CONFIG.name}] Mismatch: Found ${detectedObjects.length}, Expected ${expectedCount}. Escalating strategy...`;
        logger.warn(mismatchMsg);
        logs.push(mismatchMsg);
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const errorMsg = `[${DETECTION_CONFIG.name}] Strategy Error: ${errMsg}`;
      logger.error(errorMsg);
      logs.push(errorMsg);

      // Throw on API errors
      if (errMsg.includes('429') || errMsg.includes('Quota') || errMsg.includes('API key') || errMsg.includes('403')) {
        throw new Error(`API Error: ${errMsg}`);
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
    rotation: obj.rotation,
  }));
};

/**
 * Restore/enhance an image using AI
 */
export const restoreImage = async (base64Data: string, mimeType: string = 'image/png'): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const msg = '[ERROR] Gemini API key not configured';
    logger.error(msg);
    throw new Error('API key not configured');
  }

  const ai = new GoogleGenAI({ apiKey });
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Construct prompt from config
  const promptStruct = ALCHEMY_CONFIG.prompt_directives.structure;
  const steps = promptStruct.steps.map((step, idx) => `${idx + 1}. ${step.id}: ${step.instruction}`).join('\n');
  const prompt = `
${promptStruct.role}
${promptStruct.input_context}
TASKS:
${steps}
Return the High-Fidelity restored image.
`;

  try {
    logger.info('[Alchemy] Starting image restoration');

    const response = await ai.models.generateContent({
      model: ALCHEMY_CONFIG.model_config.model_name,
      contents: {
        parts: [{ inlineData: { mimeType, data: cleanBase64 } }, { text: prompt }],
      },
      config: {
        temperature: ALCHEMY_CONFIG.model_config.temperature,
      },
    });

    // Validate response structure
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('AI returned no candidates in response');
    }

    for (const part of response.candidates[0]?.content?.parts || []) {
      if (part.inlineData) {
        const restoredData = part.inlineData.data;
        if (!restoredData || typeof restoredData !== 'string') {
          throw new Error('AI returned invalid image data');
        }
        logger.info('[Alchemy] Image restoration successful');
        return `data:image/png;base64,${restoredData}`;
      }
    }

    throw new Error('No image data found in AI response');
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logger.error('[Alchemy] Restoration error', { error: errMsg });

    if (errMsg.includes('429') || errMsg.includes('Quota')) {
      throw new Error('API quota exceeded');
    } else if (errMsg.includes('403') || errMsg.includes('API key')) {
      throw new Error('API authentication failed');
    } else {
      throw new Error(`Restoration failed: ${errMsg}`);
    }
  }
};
