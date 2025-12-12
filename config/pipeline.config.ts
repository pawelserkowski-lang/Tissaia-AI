import { PipelineConfiguration } from '../types';

export const TISSAIA_CONFIG: PipelineConfiguration = {
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
