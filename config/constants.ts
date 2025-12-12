export const DETECTION_STRATEGIES = [
  { level: 1, name: "YOLO v8", focus: "Real-time Detection", prompt_modifier: "Execute 'YOLO v8' simulation. Divide image into grid S*S. Predict Bounding Boxes (B) and Confidence Scores. Apply Non-Maximum Suppression (NMS) to merge overlapping boxes. Prioritize high-speed inference." },
  { level: 2, name: "EfficientDet D7", focus: "Multi-Scale Accuracy", prompt_modifier: "Execute 'EfficientDet D7' simulation. Utilize BiFPN (Bidirectional Feature Pyramid Network) for feature fusion. Detect small and large objects with high precision. Scaling factor: phi=7." },
  { level: 3, name: "Faster R-CNN", focus: "Region Proposals", prompt_modifier: "Execute 'Faster R-CNN' simulation. Generate Region Proposals via RPN. Apply ROI Pooling. Perform final classification and bounding box regression. Prioritize exact boundaries." },
  { level: 4, name: "RetinaNet", focus: "Dense Object Detection", prompt_modifier: "Execute 'RetinaNet' simulation. Apply Focal Loss to address class imbalance. Detect objects in dense arrangements." }
];

export const GRID_LAYOUT_CONSTANTS = {
  NORMALIZATION_BASE: 1000,
  PADDING: 40,
  GAP: 20,
  HYGIENE_CUT_PERCENTAGE: 0.10
};

export const CONCURRENCY_LIMITS = {
  MAX_RESTORATIONS: 3
};
