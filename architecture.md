# Architecture Documentation

## 🏗️ Project Structure
The application follows a standard React component-based architecture, optimized for client-side AI interaction.

```text
Tissaia_Project/
├── services/               # Core Logic & AI Integration
│   ├── geminiService.ts    # Google GenAI implementation (Detection/Restoration)
│   ├── tissaiaService.ts   # Pipeline orchestration
│   └── imageProcessing.ts  # Canvas & Buffer utilities
├── components/             # UI Components
│   ├── Launcher.tsx        # BIOS Boot Sequence
│   ├── FileListView.tsx    # Ingestion & Drag-n-Drop
│   ├── CropMapView.tsx     # Detection Visualization
│   └── MagicSpellView.tsx  # Restoration Results
├── App.tsx                 # Main State Controller
├── LAUNCH_TISSAIA.bat      # Windows Entry Point (Auto-Update)
└── start.sh                # Unix Entry Point (Auto-Update)
```

## 🧠 NECRO_OS Pipeline (AI Architecture)

The core logic resides in `services/geminiService.ts`, implementing a 4-Stage Pipeline defined in `TISSAIA_CONFIG`.

### Stage 1: Ingestion & Heuristics
- **Goal:** Initial file load and edge detection.
- **Method:** Browser-side `File` API + Hough Transform simulation.
- **Constraints:** Max 50MB input, supported formats (PNG, JPEG, WEBP).

### Stage 2: Detection (Phase A)
- **Service:** `geminiService.analyzeImage`
- **Strategies:** The system employs a fallback strategy mechanism if the detected count does not match the manifest:
    1.  **Level 1 (YOLO v8 Simulation):** Real-time detection, focuses on speed.
    2.  **Level 2 (EfficientDet D7):** Multi-scale accuracy with BiFPN.
    3.  **Level 3 (Faster R-CNN):** Region proposal focus.
    4.  **Level 4 (RetinaNet):** Dense object detection.
- **Fallback:** If the API Key is missing, `mockAnalyzeImage` generates dynamic bounding boxes based on a grid algorithm.

### Stage 3: Smart Crop
- **Execution:** Client-side (Canvas).
- **Logic:** Maps normalized (0-1000) coordinates from the AI model to pixel coordinates.
- **Hygiene:** Applies rotation and margin correction to remove scanner white borders.

### Stage 4: Alchemy (Phase B)
- **Service:** `geminiService.restoreImage`
- **Model:** `gemini-3-pro-image-preview`
- **Prompt Engineering:** Structured prompts instruct the model to:
    1.  **Outpaint:** Regenerate missing 10% borders.
    2.  **Hygiene:** Remove dust/scratches.
    3.  **Color Grade:** Apply "Kodak Portra 400" profile.

## 🔄 Simulation Mode
A key architectural feature is the robust **Simulation Mode**.
- **Detection:** `mockAnalyzeImage` uses a mathematical grid layout to generate realistic-looking bounding boxes for $N$ simulated photos, preventing UI breakage during testing.
- **Restoration:** `mockRestoreImage` simulates GPU processing delay and returns the original image (loopback) to verify the UI flow without incurring API costs.

## 🚀 Launch System
The project includes a custom "Self-Updating" launch system.
- **Windows (`.bat`) / Unix (`.sh`)**:
    1.  **Git Pull**: Ensures the local client is always in sync with the repository.
    2.  **Environment Setup**: Interactively creates `.env` keys.
    3.  **Dependency Check**: Installs `node_modules` only if missing to speed up boot times.

## 🎨 Design System
- **Theme:** Dark Mode (`bg-gray-950`).
- **Accent:** Neon Cyan (`#00ffa3`).
- **Glassmorphism:** Tailwind utilities for `backdrop-blur-md` and `bg-opacity`.
- **Animations:** CSS keyframes defined in `index.html` (e.g., `scan-vertical`, `fade-in`) control the boot sequence.
