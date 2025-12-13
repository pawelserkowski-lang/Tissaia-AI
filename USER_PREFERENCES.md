# User Preferences – "Cyber Matrix Pro" v2.0

<div align="center">

![Version](https://img.shields.io/badge/Version-2.0-00ffa3?style=for-the-badge)
![Theme](https://img.shields.io/badge/Theme-Matrix%20Glass-001a00?style=for-the-badge)
![Language](https://img.shields.io/badge/Language-PL%20%7C%20EN-blue?style=for-the-badge)

**Comprehensive configuration guide for Tissaia AI user preferences and customization.**

[Security](#-security) • [AI Providers](#-ai-providers) • [Architecture](#-architecture) • [UI Theme](#-ui-theme) • [Health Dashboard](#-health-dashboard)

</div>

---

## Table of Contents

- [Security](#-security)
- [AI Providers – Multi-Model Architecture](#-ai-providers--multi-model-architecture)
- [Vercel Integration](#-vercel-integration)
- [Architecture](#-architecture)
- [UI – Matrix Glass Theme](#-ui--matrix-glass-theme)
- [Decision Process – De Bono's Six Hats](#-decision-process--de-bonos-six-hats)
- [Special Files](#-special-files)
- [Code Hygiene](#-code-hygiene)
- [Edge Cases](#-edge-cases)
- [Bonus Features](#-bonus-features)
- [Health Dashboard](#-health-dashboard)
- [Version History](#-version-history)

---

## 🔐 Security

### Security Rules

| # | Rule | Type | Description |
|---|------|------|-------------|
| 1 | **API Keys from Environment** | ✅ Required | Only via `process.env` / `%ENV_VAR%` on Windows |
| 2 | **Full Local File Access** | ✅ Required | Read/write without restrictions |
| 3 | **Full System Access** | ✅ Required | System operations allowed |
| 4 | **Full Internet Access** | ✅ Required | No domain restrictions |
| 5 | **Audit Log** | 💡 Recommended | Every operation logged with timestamp |
| 6 | **CVE Scanning** | 💡 Recommended | Automatic npm/pip dependency checks |
| 7 | **AES-256 Encryption** | 💡 Recommended | Encrypt sensitive local data |
| 8 | **API Key Rotation** | 💡 Recommended | Reminders every 90 days |
| 9 | **Key Validation** | 💡 Recommended | Verify key before use |
| 10 | **Vercel Secrets** | 💡 Recommended | Keys as encrypted secrets |

### Environment Configuration (.env)

```env
# ⚠️ NEVER commit this file to repository!
# Copy to .env.local and fill in values

# === PRIMARY AI PROVIDER ===
ANTHROPIC_API_KEY=sk-ant-...

# === SECONDARY PROVIDERS ===
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...

# === OPTIONAL PROVIDERS ===
MISTRAL_API_KEY=
GROQ_API_KEY=gsk_...

# === ENTERPRISE ===
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# === LOCAL ===
OLLAMA_BASE_URL=http://localhost:11434

# === PROVIDER SELECTION ===
AI_PRIMARY_PROVIDER=anthropic
AI_FALLBACK_PROVIDER=openai
```

---

## 🤖 AI Providers – Multi-Model Architecture

### Supported Providers

| Provider | Endpoint | Model Listing | Status |
|----------|----------|---------------|--------|
| **Anthropic** | `api.anthropic.com` | `GET /v1/models` | 🟢 Primary |
| **OpenAI** | `api.openai.com` | `GET /v1/models` | 🟡 Secondary |
| **Google AI** | `generativelanguage.googleapis.com` | `GET /v1beta/models` | 🟡 Secondary |
| **Mistral** | `api.mistral.ai` | `GET /v1/models` | 🔵 Optional |
| **Groq** | `api.groq.com` | `GET /openai/v1/models` | 🔵 Optional |
| **Ollama** | `localhost:11434` | `GET /api/tags` | 🔵 Local |
| **Azure OpenAI** | `*.openai.azure.com` | Custom endpoint | 🔵 Enterprise |
| **AWS Bedrock** | `bedrock-runtime.*.amazonaws.com` | `ListFoundationModels` | 🔵 Enterprise |

### TypeScript Interface

```typescript
/**
 * Universal interface for all AI providers
 */
interface AIProvider {
  name: string;
  apiKeyEnvVar: string;
  baseUrl: string;
  listModels(): Promise<AIModel[]>;
  chat(messages: Message[], model: string): Promise<Response>;
  validateApiKey(): Promise<boolean>;
}

/**
 * AI Model with full metadata
 */
interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  pricing: {
    input: number;   // $ per 1M tokens
    output: number;  // $ per 1M tokens
  };
  capabilities: ('chat' | 'vision' | 'tools' | 'code')[];
  isAvailable: boolean;
}

/**
 * Fallback chain configuration
 */
interface FallbackConfig {
  providers: string[];
  autoSwitch: boolean;
  maxRetries: number;
  retryDelay: number;
}
```

### Model Management Features

| Feature | Description |
|---------|-------------|
| **Auto-discovery** | Automatic model list fetching after API key input |
| **Capability filtering** | Filter models by capabilities (vision, tools, etc.) |
| **Cost estimation** | Estimate costs before sending request |
| **Fallback chain** | Automatic switch to backup provider on errors |
| **Rate limit handling** | Intelligent API rate limit management |
| **Model comparison** | Compare models by price/quality/speed |

### Model Selector UI

```
╔═══════════════════════════════════════════════════════════════╗
║  🤖 AI MODEL SELECTION                                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Provider: [▼ Anthropic    ]  🔑 Key: ••••••••••XXXX ✅       ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ 📋 AVAILABLE MODELS (fetched from API)                  │  ║
║  ├─────────────────────────────────────────────────────────┤  ║
║  │ ◉ claude-opus-4-5-20250514      │ 200K │ $15/$75  │ 🔥 │  ║
║  │ ○ claude-sonnet-4-5-20250514    │ 200K │ $3/$15   │    │  ║
║  │ ○ claude-haiku-4-5-20250514     │ 200K │ $0.25/$1 │ ⚡ │  ║
║  │ ○ claude-3-5-sonnet-20241022    │ 200K │ $3/$15   │    │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  ℹ️ Context: 200,000 tokens | Vision: ✅ | Tools: ✅          ║
║                                                               ║
║  [🔄 Refresh List]  [⚙️ Provider Settings]  [💾 Save]         ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🚀 Vercel Integration

### Configuration (vercel.json)

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "regions": ["cdg1", "fra1"],
  "env": {
    "VITE_API_URL": "@api_url",
    "VITE_AI_PROVIDER": "@ai_provider"
  },
  "functions": {
    "api/**/*.ts": {
      "runtime": "edge",
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Edge Functions Structure

```
/api
├── /ai
│   ├── chat.ts          # Main AI endpoint
│   ├── models.ts        # Model listing
│   └── validate-key.ts  # API key validation
├── /health
│   └── status.ts        # Health check
└── /proxy
    └── [...provider].ts # Proxy to various AI providers
```

### Vercel Environment Variables

| Variable | Target | Type |
|----------|--------|------|
| `ANTHROPIC_API_KEY` | Production, Preview | 🔒 Secret |
| `OPENAI_API_KEY` | Production, Preview | 🔒 Secret |
| `GOOGLE_AI_API_KEY` | Production | 🔒 Secret |
| `VITE_APP_VERSION` | All | System |
| `AI_PRIMARY_PROVIDER` | Production | Plain |

### Edge Function – AI Chat

```typescript
// api/ai/chat.ts
export const runtime = 'edge';
export const preferredRegion = ['cdg1', 'fra1']; // Europe

export async function POST(request: Request) {
  const { provider, model, messages } = await request.json();

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Missing API key for selected provider',
      provider: provider
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const providerConfig = getProviderConfig(provider);

  const response = await fetch(providerConfig.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  });

  return response;
}
```

### Edge Function – List Models

```typescript
// api/ai/models.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || 'anthropic';

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Missing API key',
      models: []
    }), { status: 401 });
  }

  const models = await fetchModelsFromProvider(provider, apiKey);

  return new Response(JSON.stringify({
    provider,
    models,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### CI/CD Pipeline

| Trigger | Action | Environment |
|---------|--------|-------------|
| Push to `main` | Auto deploy | Production |
| Push to `develop` | Auto deploy | Preview |
| Pull Request | Preview URL + comment | Preview |
| Tag `v*.*.*` | Release deployment | Production |

---

## 🏗️ Architecture

### Stack Requirements

| # | Element | Status | Description |
|---|---------|--------|-------------|
| 1 | **Vite + React 19** | ✅ Required | Latest version with full HMR |
| 2 | **Offline/Online Mode** | ✅ Required | Service Worker + IndexedDB |
| 3 | **TanStack Query** | 💡 Recommended | Intelligent API caching |
| 4 | **Zustand** | 💡 Recommended | Lightweight state manager |
| 5 | **Feature Flags** | 💡 Recommended | Enable/disable without redeploy |
| 6 | **Lazy Loading** | 💡 Recommended | Dynamic component loading |
| 7 | **Vercel Edge Functions** | 💡 Recommended | AI proxy on edge |
| 8 | **Multi-provider abstraction** | 💡 Recommended | AI abstraction layer |
| 9 | **Provider adapter pattern** | 💡 Recommended | Easy addition of new AI providers |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ UI Layer │  │ Zustand  │  │ TanStack │  │ Service Worker   │ │
│  │ (Matrix  │  │ (State)  │  │ Query    │  │ (Offline Cache)  │ │
│  │  Glass)  │  │          │  │ (Cache)  │  │                  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                 │           │
│       └─────────────┴─────────────┴─────────────────┘           │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────┼───────────────────────────────────┐
│                        VERCEL EDGE                               │
│  ┌───────────────────────────┴────────────────────────────────┐ │
│  │                    Edge Functions                           │ │
│  │  ┌─────────┐  ┌─────────────┐  ┌─────────────────────────┐ │ │
│  │  │ /ai/    │  │ /ai/models  │  │ /health/status          │ │ │
│  │  │ chat    │  │             │  │                         │ │ │
│  │  └────┬────┘  └──────┬──────┘  └─────────────────────────┘ │ │
│  └───────┼──────────────┼─────────────────────────────────────┘ │
└──────────┼──────────────┼───────────────────────────────────────┘
           │              │
┌──────────┼──────────────┼───────────────────────────────────────┐
│          │   AI PROVIDERS LAYER                                  │
│  ┌───────┴───────┐  ┌───┴────┐  ┌────────┐  ┌────────┐         │
│  │   Anthropic   │  │ OpenAI │  │ Google │  │ Ollama │  ...    │
│  │   (Primary)   │  │        │  │   AI   │  │(Local) │         │
│  └───────────────┘  └────────┘  └────────┘  └────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI – Matrix Glass Theme

### Visual Specification

| Element | Value | Description |
|---------|-------|-------------|
| **Glassmorphism** | `backdrop-filter: blur(16px)` | Semi-transparent panels |
| **Background** | `linear-gradient(135deg, #0a1f0a, #001a00)` | Dark green gradient |
| **Matrix Effect** | Canvas/WebGL animation | Digital rain background |
| **Font** | `JetBrains Mono`, `Fira Code` | Monospace with ligatures |
| **Accent** | `#00ff41` | Neon green |
| **Hover Glow** | `box-shadow: 0 0 20px #00ff41` | Glowing effect |

### Localization

| Language | Code | Status |
|----------|------|--------|
| 🇵🇱 Polish | `pl-PL` | Default |
| 🇬🇧 English | `en-US` | Available |

### CSS Variables

```css
:root {
  /* Colors */
  --matrix-bg-primary: #0a1f0a;
  --matrix-bg-secondary: #001a00;
  --matrix-accent: #00ff41;
  --matrix-accent-dim: #00cc33;
  --matrix-text: #00ff41;
  --matrix-text-dim: #008f11;
  --matrix-glass-bg: rgba(0, 31, 0, 0.7);
  --matrix-glass-border: rgba(0, 255, 65, 0.2);

  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

  /* Effects */
  --glass-blur: blur(16px);
  --glow-shadow: 0 0 20px var(--matrix-accent);
  --glow-shadow-intense: 0 0 40px var(--matrix-accent);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### Matrix Progress Bar

Animated progress bar in Matrix style for **every process**.

#### Usage Contexts

| Process | Message (EN) | Message (PL) |
|---------|--------------|--------------|
| App Loading | "Initializing Matrix..." | "Inicjalizacja Matrixa..." |
| API Fetch | "Intercepting data..." | "Przechwytywanie danych..." |
| File Save | "Saving to reality..." | "Zapisywanie do rzeczywistości..." |
| Package Install | "Downloading red pill..." | "Pobieranie czerwonej pigułki..." |
| Project Build | "Compiling source code..." | "Kompilowanie kodu źródłowego..." |
| Backup | "Backing up consciousness..." | "Tworzenie kopii zapasowej świadomości..." |
| AI Response | "Model is thinking..." | "Model myśli..." |
| File Upload | "Data transmission..." | "Transmisja danych..." |
| Download | "Decoding packets..." | "Dekodowanie pakietów..." |

#### Visual Effects

- ✅ Flowing Japanese/hex characters in progress bar background
- ✅ Glitch effect at 100%
- ✅ Pulsing `#00ff41` glow
- ✅ Random "decoding" text: `01101001 → READY`
- ✅ Typing effect on messages

#### React Component

```tsx
interface MatrixProgressProps {
  progress: number;        // 0-100
  message: string;         // Message to display
  showRain?: boolean;      // Show matrix rain
  glitchOnComplete?: boolean; // Glitch on completion
}

const MatrixProgress: React.FC<MatrixProgressProps> = ({
  progress,
  message,
  showRain = true,
  glitchOnComplete = true
}) => {
  // Implementation...
};
```

#### ASCII Preview

```
┌─────────────────────────────────────────────────────────┐
│  ░▒▓█ LOADING DATA █▓▒░                                 │
│  ╔══════════════════════════════════════════════════╗   │
│  ║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░ ║   │
│  ╚══════════════════════════════════════════════════╝   │
│  [64%] Decoding reality... 010110101                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ゴ ジ ラ マ ト リ ッ ク ス  (flowing characters)  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🧠 Decision Process – De Bono's Six Hats

Before every non-trivial decision, simulate a debate:

| Hat | Color | Perspective | Key Question |
|-----|-------|-------------|--------------|
| ⚪ **White** | White | Facts and data | "What hard data do we have?" |
| 🔴 **Red** | Red | Emotions and intuition | "What does gut feeling say?" |
| ⚫ **Black** | Black | Criticism and risks | "What could go wrong?" |
| 🟡 **Yellow** | Yellow | Optimism and benefits | "What are the pros?" |
| 🟢 **Green** | Green | Creativity | "What crazy alternatives exist?" |
| 🔵 **Blue** | Blue | Meta-perspective | "What's the best process?" |

### Decision Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROBLEM / DECISION                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. SIX HATS ANALYSIS                                            │
│     ⚪ → 🔴 → ⚫ → 🟡 → 🟢 → 🔵                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. GENERATE 6 SOLUTIONS                                         │
│     Each from different hat perspective                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. SCORING MATRIX                                               │
│     ┌──────────────┬───────┬──────────┬───────────┬──────────┐ │
│     │ Solution     │ Secur.│ Perform. │ Readabil. │ Scalabil.│ │
│     ├──────────────┼───────┼──────────┼───────────┼──────────┤ │
│     │ Option 1     │ 8/10  │ 7/10     │ 9/10      │ 6/10     │ │
│     │ Option 2     │ 9/10  │ 6/10     │ 7/10      │ 8/10     │ │
│     │ ...          │ ...   │ ...      │ ...       │ ...      │ │
│     └──────────────┴───────┴──────────┴───────────┴──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. TOP 2 FOR DEEPER ANALYSIS                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. FINAL RECOMMENDATION + JUSTIFICATION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. MINI-RETROSPECTIVE (after implementation)                    │
│     "What worked? What would I change?"                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Special Files

| File | Role | When to Update |
|------|------|----------------|
| `README.md` | Main project documentation | On architecture changes |
| `ARCHITECTURE.md` | Diagrams and architectural decisions | On structural changes |
| `AGENTS.md` | AI/automation agent documentation | On agent add/modify |
| `CHANGELOG.md` | Change history (Keep a Changelog) | On every release |
| `AI_PROVIDERS.md` | AI provider documentation | On new provider addition |
| `.env.example` | Environment variables template | On new variable addition |
| `vercel.json` | Vercel configuration | On deployment changes |
| `*.desktop` | Linux launcher files | On path changes |
| `backups/` | Code snapshots before changes | Before every refactoring |

### Directory Structure

```
project-root/
├── 📄 README.md
├── 📄 ARCHITECTURE.md
├── 📄 AGENTS.md
├── 📄 AI_PROVIDERS.md
├── 📄 CHANGELOG.md
├── 📄 .env.example
├── 📄 vercel.json
├── 📁 api/
│   ├── 📁 ai/
│   │   ├── 📄 chat.ts
│   │   ├── 📄 models.ts
│   │   └── 📄 validate-key.ts
│   ├── 📁 health/
│   │   └── 📄 status.ts
│   └── 📁 proxy/
│       └── 📄 [...provider].ts
├── 📁 src/
│   ├── 📁 components/
│   ├── 📁 hooks/
│   ├── 📁 providers/
│   ├── 📁 stores/
│   ├── 📁 utils/
│   └── 📁 i18n/
├── 📁 docs/
├── 📁 backups/
└── 📁 scripts/
    └── 📄 *.desktop
```

---

## 🧹 Code Hygiene

| # | Rule | Tool | Description |
|---|------|------|-------------|
| 1 | **Scout Rule** | - | Leave code cleaner than you found it |
| 2 | **Auto-formatting** | ESLint + Prettier (JS/TS), Ruff (Python) | On every save |
| 3 | **Pre-commit hooks** | Husky + lint-staged | No ugly code passes through |
| 4 | **Tests** | Vitest (frontend), pytest (backend) | On every logic change |
| 5 | **Documentation** | JSDoc / docstrings | For every public function |
| 6 | **Dead code removal** | - | Regular cleanup |

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "react/react-in-jsx-scope": "off"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Pre-commit Hooks (Husky)

```bash
#!/bin/sh
# .husky/pre-commit

npx lint-staged
npm run test:unit -- --passWithNoTests
```

---

## ⚠️ Edge Cases

| Scenario | Solution | Priority |
|----------|----------|----------|
| **No Internet** | Graceful degradation → "Offline Mode" + cache | 🔴 Critical |
| **API Timeout** | Retry with exponential backoff (3x: 1s → 2s → 4s) | 🔴 Critical |
| **Critical UI Error** | React Error Boundary → friendly message | 🔴 Critical |
| **Memory Overflow** | Auto-cleanup old IndexedDB entries | 🟡 High |
| **API Rate Limiting** | Queue + throttling + user info | 🟡 High |
| **Invalid API Data** | Zod/Yup validation + fallback values | 🟡 High |
| **Session Loss** | Auto-save drafts every 30s to localStorage | 🟡 High |
| **Expired API Key** | Notification + fallback to another provider | 🟡 High |
| **Provider Unavailable** | Automatic switch to backup | 🟡 High |
| **New Model in API** | Auto-discovery on refresh | 🟢 Normal |
| **Vercel Deployment Fail** | Rollback to previous version | 🟢 Normal |
| **Edge Function Timeout** | Graceful degradation + retry | 🟢 Normal |

### Error Boundary Component

```tsx
class MatrixErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="matrix-error">
          <h1>⚠️ Matrix Error Detected</h1>
          <p>Something went wrong. Try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 🎁 Bonus Features

| # | Feature | Shortcut / Trigger | Description |
|---|---------|-------------------|-------------|
| 1 | **Panic Button** | `Ctrl+Shift+X` | Immediately stop all operations |
| 2 | **Terminal Mode** | Konami Code | Hidden CLI mode inside app |
| 3 | **Easter Egg** | "follow the white rabbit" | Matrix animation 🐇 |
| 4 | **Health Dashboard** | Menu / `Ctrl+H` | System status panel |
| 5 | **Model Switcher** | `Ctrl+M` | Quick AI model change |
| 6 | **Theme Toggle** | `Ctrl+T` | Theme switching (if available) |

### Konami Code Implementation

```typescript
const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

const useKonamiCode = (callback: () => void) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[index]) {
        if (index === KONAMI_CODE.length - 1) {
          callback();
          setIndex(0);
        } else {
          setIndex(i => i + 1);
        }
      } else {
        setIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, callback]);
};
```

---

## 📊 Health Dashboard

### Full View

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🖥️  MATRIX HEALTH DASHBOARD v2.0                                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  🤖 ACTIVE AI MODEL                                                   ║
║  ╔═════════════════════════════════════════════════════════════════╗  ║
║  ║  Provider:    Anthropic                                         ║  ║
║  ║  Model:       claude-opus-4-5-20250514                         ║  ║
║  ║  Status:      🟢 ONLINE (142ms latency)                         ║  ║
║  ║  Context:     200,000 tokens                                    ║  ║
║  ║  Capabilities: 💬 Chat  👁️ Vision  🔧 Tools  💻 Code            ║  ║
║  ║  Session:     12,847 / 200,000 tokens (6.4%)                    ║  ║
║  ║  Est. Cost:   $0.47 (session)                                   ║  ║
║  ╚═════════════════════════════════════════════════════════════════╝  ║
║                                                                       ║
║  📋 AVAILABLE MODELS (live from API)                [🔄 Refresh]      ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ Provider     │ Model                    │ Status │ Latency     │  ║
║  ├─────────────────────────────────────────────────────────────────┤  ║
║  │ Anthropic    │ claude-opus-4-5          │ 🟢     │ 142ms       │  ║
║  │ Anthropic    │ claude-sonnet-4-5        │ 🟢     │ 98ms        │  ║
║  │ OpenAI       │ gpt-4o                   │ 🟢     │ 201ms       │  ║
║  │ OpenAI       │ gpt-4o-mini              │ 🟢     │ 87ms        │  ║
║  │ Google       │ gemini-1.5-pro           │ 🟡     │ 340ms       │  ║
║  │ Mistral      │ mistral-large            │ ⚪     │ N/A (no key)│  ║
║  │ Ollama       │ llama3.2:latest          │ 🔴     │ offline     │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🌐 VERCEL DEPLOYMENT                                                 ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ Environment: Production     │ Region: cdg1 (Paris)             │  ║
║  │ Last Deploy: 2025-12-12 14:32:01                                │  ║
║  │ Build Time:  47s            │ Status: 🟢 Ready                  │  ║
║  │ URL: https://cyber-matrix.vercel.app                            │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🔄 FALLBACK CHAIN                                                    ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ 1. Anthropic (primary) → 2. OpenAI → 3. Google → 4. Ollama     │  ║
║  │ Auto-switch: ✅ Enabled    │ Last fallback: never              │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🌐 CONNECTION           💾 MEMORY           📦 CACHE                 ║
║  ┌───────────────┐      ┌────────────┐     ┌──────────┐              ║
║  │ API:    🟢    │      │ RAM: 64%   │     │ 2.4 MB   │              ║
║  │ WS:     🟢    │      │ Heap: 45%  │     │ 847 items│              ║
║  │ CDN:    🟢    │      │ IndexDB:OK │     │ TTL: 24h │              ║
║  └───────────────┘      └────────────┘     └──────────┘              ║
║                                                                       ║
║  📈 RECENT OPERATIONS                                                 ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ 14:32:01 │ ✅ │ Fetch /api/data      │ 89ms                     │  ║
║  │ 14:31:58 │ ✅ │ AI Response          │ 1.2s                     │  ║
║  │ 14:31:45 │ ⚠️ │ Retry /api/status    │ timeout                  │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  [⚙️ Change Model]  [🔑 Manage Keys]  [📊 Cost Statistics]            ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Dashboard Sections

| Section | Data Displayed |
|---------|----------------|
| **AI Model** | Name, provider, status, latency, context, capabilities, token usage, cost |
| **Model List** | All available models from API, connection status, latency |
| **Vercel** | Environment, region, last deploy, build time, status, URL |
| **Fallback Chain** | Provider order, auto-switch status, last fallback |
| **Connection** | API, WebSocket, CDN status |
| **Memory** | RAM, Heap, IndexedDB |
| **Cache** | Size, entry count, TTL |
| **Operations** | Log of recent operations with time and status |

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-12 | Multi-provider AI, Vercel Integration, Health Dashboard v2 |
| 1.1 | 2025-12-12 | Matrix Progress Bar, Health Dashboard |
| 1.0 | 2025-12-12 | Initial release |

---

## 🤝 Support

If you encounter issues:

1. Check Health Dashboard
2. Review console logs
3. Verify API keys
4. Check Vercel deployment status

---

<div align="center">

**[Back to README](README.md)** • **[Architecture](architecture.md)** • **[API Documentation](docs/API_DOCUMENTATION.md)**

*"There is no spoon." – The Matrix (1999)* 🥄

</div>
