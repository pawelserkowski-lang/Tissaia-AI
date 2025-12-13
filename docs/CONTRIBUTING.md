# Contributing to Tissaia AI

Thank you for considering contributing to Tissaia AI! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Tissaia-AI.git
cd Tissaia-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Backend Setup (Optional)

```bash
# Start backend server
npm run backend

# Or run both frontend and backend
npm run dev:all
```

## Project Structure

```
Tissaia-AI/
├── backend/          # Express.js backend
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── middleware/  # Express middleware
├── components/      # React components
├── context/         # React contexts
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
│   ├── database/   # IndexedDB utilities
│   ├── i18n/       # Internationalization
│   ├── performance/ # Performance utilities
│   └── validation/ # Validation utilities
├── public/          # Static assets
└── docs/           # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types and interfaces
- Avoid using `any` type
- Use strict mode

```typescript
// Good
interface User {
  id: number;
  name: string;
  email: string;
}

// Bad
const user: any = { id: 1, name: 'John' };
```

### React Components

- Use functional components with hooks
- Follow single responsibility principle
- Use meaningful component names
- Add JSDoc comments

```typescript
/**
 * ImageEditor component for editing images with filters and transformations
 *
 * @param {ImageEditorProps} props - Component props
 * @returns {JSX.Element} ImageEditor component
 */
export const ImageEditor: React.FC<ImageEditorProps> = ({ image, onExport }) => {
  // Component implementation
};
```

### Hooks

- Prefix custom hooks with `use`
- Follow React hooks rules
- Document parameters and return values
- Add usage examples

```typescript
/**
 * Custom hook for image editing
 *
 * @param {string | File} image - Image to edit
 * @param {ImageEditorOptions} options - Editor options
 * @returns {ImageEditorResult} Editor state and methods
 *
 * @example
 * const editor = useImageEditor(imageFile, {
 *   maxWidth: 2048,
 *   format: 'image/jpeg'
 * });
 */
export const useImageEditor = (image, options) => {
  // Hook implementation
};
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ImageEditor`)
- **Hooks**: camelCase with `use` prefix (e.g., `useImageEditor`)
- **Utils**: camelCase (e.g., `formatDate`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Files**: Match export name (e.g., `ImageEditor.tsx`, `useImageEditor.ts`)

### Comments and Documentation

- Add JSDoc comments to all exported functions
- Document complex logic
- Include usage examples
- Keep comments up to date

```typescript
/**
 * Optimizes image by compressing and resizing
 *
 * @param {File} file - Image file to optimize
 * @param {ImageOptimizationOptions} options - Optimization options
 * @param {number} [options.maxWidth=1920] - Maximum width
 * @param {number} [options.maxHeight=1080] - Maximum height
 * @param {number} [options.quality=0.8] - Compression quality (0-1)
 * @returns {Promise<Blob>} Optimized image blob
 *
 * @throws {Error} If image loading fails
 *
 * @example
 * const optimized = await optimizeImage(file, {
 *   maxWidth: 1024,
 *   quality: 0.9
 * });
 */
export async function optimizeImage(file, options) {
  // Implementation
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for all new features
- Aim for 80%+ code coverage
- Use descriptive test names
- Test edge cases

```typescript
import { render, screen } from '@testing-library/react';
import { ImageEditor } from './ImageEditor';

describe('ImageEditor', () => {
  it('should render editor interface', () => {
    render(<ImageEditor image={mockImage} />);
    expect(screen.getByText('Image Editor')).toBeInTheDocument();
  });

  it('should apply brightness filter', async () => {
    const { getByLabelText } = render(<ImageEditor image={mockImage} />);
    const slider = getByLabelText(/brightness/i);

    fireEvent.change(slider, { target: { value: 150 } });

    expect(slider.value).toBe('150');
  });
});
```

## Git Workflow

### Branching

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(editor): add brightness filter to image editor

- Implement brightness slider control
- Add brightness adjustment to canvas rendering
- Update editor state management

Closes #123
```

```
fix(upload): prevent memory leak in file upload

- Clean up blob URLs after upload
- Add proper cleanup in useEffect

Fixes #456
```

### Pull Requests

1. Create a feature branch from `develop`
2. Make your changes
3. Add tests
4. Update documentation
5. Submit PR with clear description
6. Request review

**PR Template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing done

## Screenshots (if applicable)
Add screenshots

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Self-review completed
```

## Adding New Features

### 1. Plan

- Discuss feature in GitHub issues
- Get feedback from maintainers
- Create design document if needed

### 2. Implement

- Follow coding standards
- Write clean, maintainable code
- Add comprehensive tests
- Update documentation

### 3. Document

- Add JSDoc comments
- Update API documentation
- Add usage examples
- Update README if needed

### 4. Test

- Write unit tests
- Test edge cases
- Verify cross-browser compatibility
- Check mobile responsiveness

### 5. Submit

- Create pull request
- Fill out PR template
- Address review feedback
- Ensure CI passes

## Performance Guidelines

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load components and routes
- Optimize images before upload
- Use Web Workers for heavy computation
- Debounce/throttle frequent operations
- Monitor bundle size

## Accessibility

- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios
- Provide text alternatives for images

## Internationalization

- Use translation keys, not hardcoded text
- Add translations for all languages
- Use locale-aware formatting
- Test RTL language support

```typescript
// Good
<h1>{t('upload.title')}</h1>

// Bad
<h1>Upload Images</h1>
```

## Security

- Validate all user input
- Sanitize data before storage
- Use Content Security Policy
- Avoid XSS vulnerabilities
- Don't expose API keys in frontend
- Use HTTPS in production

## Getting Help

- Check existing documentation
- Search GitHub issues
- Ask in discussions
- Join our Discord server
- Email: support@tissaia-ai.com

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website

Thank you for contributing! 🎉
