/**
 * Tutorial steps configuration for Tissaia AI
 */

import { OnboardingStep } from '../../hooks/useOnboarding';

/**
 * Main onboarding tutorial steps
 */
export const mainTutorialSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Tissaia AI!',
    description:
      'This quick tour will help you get started with text detection and image restoration. Let\'s explore the key features together.',
    position: 'center',
  },
  {
    id: 'upload-area',
    title: 'Upload Your Images',
    description:
      'Start by uploading images containing text. You can drag and drop files here or click to browse. Multiple images are supported for batch processing.',
    target: '#upload-area',
    position: 'bottom',
  },
  {
    id: 'file-list',
    title: 'Manage Your Files',
    description:
      'All uploaded images appear here. You can preview, select, and manage your files. Click on any image to view details and perform actions.',
    target: '#file-list',
    position: 'right',
  },
  {
    id: 'analyze-button',
    title: 'Analyze Text',
    description:
      'Click the Analyze button to detect text regions in your images. The AI will identify and highlight all text areas with bounding boxes.',
    target: '#analyze-button',
    position: 'bottom',
  },
  {
    id: 'crop-map',
    title: 'Review Detected Regions',
    description:
      'The crop map shows all detected text regions. You can select specific regions to restore or process all at once.',
    target: '#crop-map',
    position: 'top',
    optional: true,
  },
  {
    id: 'restore-button',
    title: 'Restore Images',
    description:
      'After selecting text regions, click Restore to remove text and restore the background. The AI will intelligently fill in the text areas.',
    target: '#restore-button',
    position: 'bottom',
  },
  {
    id: 'gallery',
    title: 'View Results',
    description:
      'Your restored images appear in the gallery. You can download, compare with originals, or process additional regions.',
    target: '#gallery',
    position: 'top',
    optional: true,
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description:
      'Access settings to change themes, language, quality preferences, and more. You can also enable keyboard shortcuts and batch processing modes.',
    target: '#settings-button',
    position: 'left',
    optional: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description:
      'You now know the basics of Tissaia AI. Feel free to explore advanced features like batch processing, custom themes, and keyboard shortcuts. Happy restoring!',
    position: 'center',
  },
];

/**
 * Quick start steps for experienced users
 */
export const quickStartSteps: OnboardingStep[] = [
  {
    id: 'upload',
    title: 'Upload Images',
    description: 'Drag and drop or click to upload images with text.',
    target: '#upload-area',
    position: 'bottom',
  },
  {
    id: 'analyze',
    title: 'Analyze',
    description: 'Detect text regions in your images.',
    target: '#analyze-button',
    position: 'bottom',
  },
  {
    id: 'restore',
    title: 'Restore',
    description: 'Remove text and restore backgrounds.',
    target: '#restore-button',
    position: 'bottom',
  },
];

/**
 * Advanced features tour
 */
export const advancedTutorialSteps: OnboardingStep[] = [
  {
    id: 'batch-processing',
    title: 'Batch Processing',
    description:
      'Process multiple images at once with queue management. You can pause, resume, and retry failed jobs.',
    target: '#batch-controls',
    position: 'bottom',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description:
      'Press "?" to see all available keyboard shortcuts. Speed up your workflow with quick commands.',
    position: 'center',
  },
  {
    id: 'themes',
    title: 'Themes',
    description:
      'Choose from 5 different themes including Dark, Light, Cyberpunk, Classic, and High Contrast.',
    target: '#theme-switcher',
    position: 'left',
  },
  {
    id: 'offline-mode',
    title: 'Offline Support',
    description:
      'Tissaia AI works offline! Your data is stored locally and synced when you\'re back online.',
    position: 'center',
  },
];

/**
 * Mobile-specific tutorial
 */
export const mobileTutorialSteps: OnboardingStep[] = [
  {
    id: 'mobile-upload',
    title: 'Upload from Camera or Gallery',
    description: 'Tap to upload images from your camera or photo gallery.',
    target: '#upload-area',
    position: 'bottom',
  },
  {
    id: 'touch-gestures',
    title: 'Touch Gestures',
    description:
      'Use pinch to zoom, swipe to navigate, and double-tap to select. Pull down to refresh.',
    position: 'center',
  },
  {
    id: 'mobile-menu',
    title: 'Mobile Menu',
    description: 'Access all features from the hamburger menu in the top corner.',
    target: '#mobile-menu',
    position: 'bottom',
  },
];
