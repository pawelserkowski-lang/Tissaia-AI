
# TISSAIA | ARCHITECT ENGINE

> **EPS AI Solutions** | *Forensic Image Restoration System*

![Version](https://img.shields.io/badge/version-1.1.0-neon)
![Status](https://img.shields.io/badge/status-active-success)
![Engine](https://img.shields.io/badge/engine-React_19-blue)

## 🌌 Overview
Tissaia is a high-fidelity photo restoration and analysis dashboard designed with a futuristic, cyberpunk-inspired "Architect Engine" aesthetic. It simulates a professional forensic image processing environment, featuring a highly immersive UI/UX that blends **Glassmorphism**, **Neon Accents**, and **BIOS-style** interactions.

The system is designed to handle the ingestion of high-resolution scanner flatbeds, detect individual photos (crops), and perform generative restoration ("Alchemy") on them.

## 🚀 Quick Start

### 1. Automated Launcher (Recommended)
We provide an "All-in-One" launcher that handles everything: updates, dependencies, configuration, and startup.

| OS | Action |
| :--- | :--- |
| **Windows** | Double-click **`LAUNCH_TISSAIA.bat`** |
| **Linux / macOS** | Run `./start.sh` in terminal |

**What the launcher does:**
1.  **Auto-Update:** Pulls the latest code from the repository (`git pull`).
2.  **Environment Check:** Verifies Node.js is installed.
3.  **Dependency Management:** Automatically runs `npm install` if `node_modules` is missing.
4.  **Configuration:** Prompts for your **Gemini API Key** to set up `.env` (if missing).
    *   *Press Enter without a key to run in **Simulation Mode**.*
5.  **Launch:** Starts the development server (`npm run dev`).

### 2. Manual Setup
If you prefer the command line:

```bash
# Clone
git clone <repo-url>
cd tissaia-architect-engine

# Configure (Optional)
# Create .env and add: API_KEY=your_key

# Install
npm install

# Run
npm run dev
```

---

## 🔮 Core Features

### 🖥️ Immersive Interface
- **BIOS Boot Sequence:** Simulated hardware initialization and biometric authentication.
- **Architect UI:** Custom design system utilizing `#00ffa3` neon accents, blur filters, and micro-interactions.

### 🧠 AI Pipeline (NECRO_OS)
- **Ingestion & Heuristics:** Real-time preview and edge detection simulation.
- **Neural Detection (Phase A):**
    - Integrates with **Google Gemini Vision** to detect photos on a scanner flatbed.
    - Features a **Multi-Strategy System** (YOLO v8, EfficientDet D7 simulations) to ensure accuracy.
    - **Dynamic Grid:** Automatically calculates layout for 8+ detected items.
- **Alchemy (Phase B):**
    - Generative restoration pipeline.
    - Capabilities: Outpainting borders, removing dust/scratches, detail enhancement, and color grading (Kodak Portra 400 profile).

### 🛠️ Developer Tools
- **Simulation Mode:** If no API Key is provided, the system falls back to a sophisticated mock engine, generating simulated bounding boxes and fake processing delays for UI testing.
- **Auto-Submission Agent:** The repository includes protocols (`AGENTS.md`) for AI agents to automatically submit changes, ensuring the "Launcher -> Git Pull" loop is always fresh.

---

## 🔧 Troubleshooting

**"Node.js is not installed"**
> Download and install Node.js (LTS version) from [nodejs.org](https://nodejs.org/).

**"Git not found"**
> The launcher cannot auto-update. Install Git or download the repository manually.

**"API Key Error"**
> Ensure your `.env` file contains a valid `GEMINI_API_KEY` or `API_KEY`. Delete the `.env` file to restart the setup wizard in the launcher.

**"Port 5173 already in use"**
> The launcher will try to find an open port automatically. Check your terminal output for the correct URL (e.g., `http://localhost:5174`).

---

## 📦 Tech Stack
- **Framework:** React 19, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, FontAwesome 6
- **AI Integration:** Google Generative AI SDK (`@google/genai`)
- **Runtime:** Node.js (Local), Vercel (Production ready structure)
