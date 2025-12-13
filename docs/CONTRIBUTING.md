# Contributing to Tissaia AI

<div align="center">

![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-00ffa3?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

**Thank you for considering contributing to Tissaia AI!**

</div>

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

---

## Code of Conduct

### Our Standards

- **Be Respectful** - Treat everyone with respect and consideration
- **Be Constructive** - Provide helpful, actionable feedback
- **Be Collaborative** - Work together towards common goals
- **Be Inclusive** - Welcome contributors of all backgrounds and skill levels

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Personal attacks or inflammatory comments
- Sharing private information without consent
- Any other conduct that would be inappropriate in a professional setting

---

## Getting Started

### Finding Issues

1. Check [GitHub Issues](https://github.com/your-repo/Tissaia-AI/issues) for open tasks
2. Look for issues labeled `good first issue` for newcomers
3. Check `help wanted` labels for priority tasks
4. Comment on an issue before starting to avoid duplicated effort

### Types of Contributions

| Type | Description |
|------|-------------|
| **Bug Fixes** | Fix reported bugs or issues |
| **Features** | Implement new functionality |
| **Documentation** | Improve or add documentation |
| **Tests** | Add or improve test coverage |
| **Performance** | Optimize existing code |
| **Accessibility** | Improve a11y compliance |
| **Translations** | Add language translations |

---

## Development Setup

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| Git | 2.x | Version control |
| VS Code | Latest | Recommended editor |

### Installation

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/your-username/Tissaia-AI.git
cd Tissaia-AI

# 3. Add upstream remote
git remote add upstream https://github.com/original/Tissaia-AI.git

# 4. Install dependencies
npm install

# 5. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 6. Start development server
npm run dev
```

### Backend Setup (Optional)

```bash
# Start backend server
npm run backend

# Or run both frontend and backend
npm run dev:all
```

### VS Code Extensions

Recommended extensions for development:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## Project Structure

```
Tissaia-AI/
├── components/           # React UI components
│   ├── FileListView.tsx # Data ingestion
│   ├── CropMapView.tsx  # Segmentation view
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useFileScanner.ts
│   ├── useImageEditor.ts
│   └── ...
├── services/            # External service integrations
│   ├── geminiService.ts
│   └── backendApiService.ts
├── utils/               # Utility functions
│   ├── image/
│   ├── validation/
│   └── ...
├── context/             # React context providers
├── types/               # TypeScript definitions
├── backend/             # Node.js backend
├── tests/               # Test suite
└── docs/                # Documentation
```

---

## Coding Standards

### TypeScript

```typescript
// DO: Use explicit types
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processUser(user: UserData): ProcessedUser {
  // Implementation
}

// DON'T: Use 'any' type
function processUser(user: any): any {  // Avoid this
  // Implementation
}
```

### React Components

```typescript
// DO: Use functional components with typed props
interface ImageCardProps {
  image: ImageData;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onSelect,
  isSelected = false
}) => {
  // Component implementation
};

// DON'T: Use class components for new code
class ImageCard extends React.Component {  // Avoid this
  // ...
}
```

### Custom Hooks

```typescript
// DO: Prefix with 'use', document with JSDoc
/**
 * Custom hook for managing image editing state
 *
 * @param image - Initial image to edit
 * @param options - Editor configuration
 * @returns Editor state and methods
 *
 * @example
 * const editor = useImageEditor(imageFile, { maxWidth: 2048 });
 */
export function useImageEditor(
  image: File | null,
  options: ImageEditorOptions = {}
): ImageEditorResult {
  // Implementation
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ImageEditor`, `FileListView` |
| Hooks | camelCase with `use` | `useImageEditor`, `useFileScanner` |
| Functions | camelCase | `processImage`, `validateFile` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_ENDPOINT` |
| Types/Interfaces | PascalCase | `ImageData`, `ProcessingResult` |
| Files | Match export name | `ImageEditor.tsx`, `useImageEditor.ts` |

### CSS/Tailwind

```tsx
// DO: Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">

// DO: Use CSS variables for theme values
<div className="bg-[var(--bg-primary)] text-[var(--text-primary)]">

// DON'T: Use inline styles for layout
<div style={{ display: 'flex', padding: '16px' }}>  // Avoid this
```

### Comments

```typescript
// DO: Document complex logic
/**
 * Calculates optimal bounding box margins based on image dimensions
 * and detected content density. Uses the following algorithm:
 * 1. Analyze edge detection results
 * 2. Calculate content-to-edge ratio
 * 3. Apply dynamic margin based on ratio
 */
function calculateDynamicMargins(box: BoundingBox, edges: EdgeData): number {
  // Implementation
}

// DO: Use TODO comments with context
// TODO(username): Optimize this loop for large datasets - Issue #123

// DON'T: State the obvious
// This function processes an image
function processImage() { }  // Unnecessary comment
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- useImageEditor.test.ts

# Run tests with UI
npm run test:ui
```

### Writing Tests

```typescript
// tests/hooks/useImageEditor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageEditor } from '../../hooks/useImageEditor';

describe('useImageEditor', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useImageEditor(null));

    expect(result.current.image).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should update brightness correctly', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const { result } = renderHook(() => useImageEditor(mockFile));

    await act(async () => {
      result.current.setBrightness(150);
    });

    expect(result.current.editorState.brightness).toBe(150);
  });

  it('should handle errors gracefully', async () => {
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
    const { result } = renderHook(() => useImageEditor(invalidFile));

    expect(result.current.error).toBeDefined();
  });
});
```

### Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Statements | 80% | - |
| Branches | 75% | - |
| Functions | 80% | - |
| Lines | 80% | - |

---

## Git Workflow

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation updates |
| `refactor/*` | Code refactoring |
| `test/*` | Test additions |

### Creating a Branch

```bash
# Update from upstream
git checkout develop
git fetch upstream
git merge upstream/develop

# Create feature branch
git checkout -b feature/image-filters
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code change without feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build process, dependencies |

**Examples:**

```bash
# Feature
git commit -m "feat(editor): add brightness filter control

- Add brightness slider component
- Implement canvas filter application
- Add unit tests for brightness adjustment

Closes #123"

# Bug fix
git commit -m "fix(upload): prevent memory leak on file upload

Revoke object URLs after component unmount

Fixes #456"

# Documentation
git commit -m "docs: update API documentation for hooks"
```

---

## Pull Request Process

### Before Submitting

1. **Run Tests**
   ```bash
   npm test
   ```

2. **Check TypeScript**
   ```bash
   npm run type-check
   ```

3. **Lint Code**
   ```bash
   npm run lint
   ```

4. **Format Code**
   ```bash
   npm run format
   ```

5. **Update Documentation** (if needed)

### Creating a PR

1. Push your branch
   ```bash
   git push origin feature/your-feature
   ```

2. Go to GitHub and click "New Pull Request"

3. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
Describe testing done

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests for my changes
- [ ] New and existing tests pass locally
- [ ] I have updated the documentation
- [ ] I have added JSDoc comments where appropriate
```

### Review Process

1. **Automated Checks** - CI runs tests, linting, type checking
2. **Code Review** - Maintainer reviews code
3. **Feedback** - Address any requested changes
4. **Approval** - Receive approval from maintainer
5. **Merge** - PR is merged to target branch

---

## Documentation

### JSDoc Comments

```typescript
/**
 * Processes an image with specified transformations
 *
 * @param image - The image file to process
 * @param options - Processing options
 * @param options.resize - Resize dimensions
 * @param options.quality - Output quality (0-1)
 * @returns Processed image as Blob
 *
 * @throws {InvalidImageError} If image format is not supported
 *
 * @example
 * ```typescript
 * const processed = await processImage(file, {
 *   resize: { width: 1920, height: 1080 },
 *   quality: 0.9
 * });
 * ```
 */
async function processImage(
  image: File,
  options: ProcessOptions
): Promise<Blob> {
  // Implementation
}
```

### README Updates

When adding new features, update:
- Feature list in README.md
- API documentation in docs/API_DOCUMENTATION.md
- Any affected guides

---

## Getting Help

### Resources

| Resource | Link |
|----------|------|
| Documentation | `docs/` directory |
| GitHub Issues | [Issues](https://github.com/your-repo/Tissaia-AI/issues) |
| Discussions | [Discussions](https://github.com/your-repo/Tissaia-AI/discussions) |

### Contact

- **Issues**: Open a GitHub issue
- **Questions**: Use GitHub Discussions
- **Email**: support@tissaia-ai.com

---

## Recognition

Contributors are recognized in:

- **README.md** - Contributors section
- **Release Notes** - Contribution credits
- **GitHub** - Contributor graph

Thank you for contributing!

---

<div align="center">

**[Back to README](../README.md)** | **[API Documentation](API_DOCUMENTATION.md)** | **[Architecture](../architecture.md)**

</div>
