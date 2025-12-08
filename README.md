# Tissaia | Architect Engine

## Overview
Tissaia is a high-fidelity photo restoration and analysis dashboard designed with a futuristic, cyberpunk-inspired "Architect Engine" aesthetic. It simulates a professional forensic image processing environment used by EPS AI Solutions, featuring a highly immersive UI/UX.

## Key Features
- **Immersive Launcher**: BIOS-style boot sequence with a simulated biometric authentication process.
- **Data Ingestion**: Robust drag-and-drop file interface with real-time preview, upload simulation, and filtering.
- **Crop Map**: A specialized segmentation view for analyzing detected regions in high-resolution scans with an interactive map interface.
- **Magic Spell**: A generative AI restoration showcase displaying enhanced artifacts with before/after logic.
- **Architect UI**: A fully custom design system utilizing Glassmorphism, neon accents (`#00ffa3`), and complex micro-interactions powered by Tailwind CSS.

## Tech Stack
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, FontAwesome 6
- **Build**: Vite

## Setup & Running

### Windows (Recommended)
Double-click **`LAUNCH_TISSAIA.bat`**. 
This script will automatically:
1. Check for Node.js.
2. Create/Check your `.env` file (you will need to paste your API Key).
3. Install dependencies (`npm install`).
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