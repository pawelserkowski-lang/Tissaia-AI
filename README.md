
# Tissaia | Architect Engine

## Overview
Tissaia is a high-fidelity photo restoration and analysis dashboard designed with a futuristic, cyberpunk-inspired "Architect Engine" aesthetic. It simulates a professional forensic image processing environment used by EPS AI Solutions, featuring a highly immersive UI/UX.

## Key Features
- **Immersive Launcher**: BIOS-style boot sequence with a simulated biometric authentication process.
- **Data Ingestion**: Robust drag-and-drop file interface with real-time preview, upload simulation, and filtering.
- **Crop Map**: A specialized segmentation view for analyzing detected regions in high-resolution scans with an interactive map interface.
- **Magic Spell**: A generative AI restoration showcase displaying enhanced artifacts with before/after logic.
- **Architect UI**: A fully custom design system utilizing Glassmorphism, neon accents (`#00ffa3`), and complex micro-interactions powered by Tailwind CSS.

## v1.1.0 Release Notes (Latest)
- **Dynamic Grid Logic**: Updated `STAGE_1_INGESTION` and `STAGE_2_DETECTION` to dynamically calculate layout grids. Now supports scans with 8+ photos without canvas overflow.
- **One-Click Workflow**: The "ZATWIERDŹ WSZYSTKIE" (Approve All) button now intelligently handles mixed states, automatically verifying pending counts and initiating restoration for ready items.
- **Fast Scan Heuristics**: Improved Phase Pre-A simulation to propose realistic bounding boxes for high-density scans.
- **Visual Hygiene**: Crop labels now scale down automatically when high density (>6 items) is detected to prevent UI clutter.

## Tech Stack
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, FontAwesome 6
- **Build**: Vite

## Setup & Running

### Automated Launcher (Recommended)

**Windows:**
Double-click **`LAUNCH_TISSAIA.bat`** or **`START_TISSAIA.cmd`**.

**Linux / macOS:**
Run the script:
```bash
./start.sh
```

These launchers will automatically:
1. Check for Node.js.
2. Install dependencies (`npm install`) if missing.
3. Prompt for an API Key to create/configure `.env`.
4. Launch the application.

### Manual Setup
1. Clone the repository.
2. Create a `.env` file and add `GEMINI_API_KEY=your_key_here`.
3. Install dependencies via `npm install` or `yarn`.
4. Run the development server via `npm run dev`.

## UI Design System
- **Theme**: Dark mode default (`bg-gray-950`), optimized for high-contrast professional environments.
- **Accent Color**: Tissaia Accent (Neon Cyan/Green) used for active states, success indicators, and holographic effects.
- **Components**: 
  - Glass panels with blur filters.
  - Custom tooltips for better accessibility in compact views.
  - Animated skeletal loading states.
