import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'none';
  optional?: boolean;
}

export interface OnboardingOptions {
  storageKey?: string;
  autoStart?: boolean;
  showOnce?: boolean;
}

/**
 * Custom hook for managing onboarding flow
 */
export const useOnboarding = (
  steps: OnboardingStep[],
  options: OnboardingOptions = {}
) => {
  const {
    storageKey = 'tissaia-onboarding-complete',
    autoStart = true,
    showOnce = true,
  } = options;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState(false);

  /**
   * Check if onboarding was completed before
   */
  const wasCompleted = useCallback(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  }, [storageKey]);

  /**
   * Mark onboarding as completed
   */
  const markComplete = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  /**
   * Reset onboarding
   */
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setCurrentStepIndex(0);
      setCompleted(new Set());
      setSkipped(false);
      setIsActive(true);
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  /**
   * Start onboarding
   */
  const start = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStepIndex(0);
      setIsActive(true);
      setSkipped(false);
    }
  }, [steps]);

  /**
   * Go to next step
   */
  const next = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const currentStep = steps[currentStepIndex];
      setCompleted((prev) => new Set([...prev, currentStep.id]));
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Finish onboarding
      const currentStep = steps[currentStepIndex];
      setCompleted((prev) => new Set([...prev, currentStep.id]));
      setIsActive(false);
      markComplete();
    }
  }, [currentStepIndex, steps, markComplete]);

  /**
   * Go to previous step
   */
  const previous = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  /**
   * Skip onboarding
   */
  const skip = useCallback(() => {
    setIsActive(false);
    setSkipped(true);
    markComplete();
  }, [markComplete]);

  /**
   * Go to specific step
   */
  const goToStep = useCallback(
    (stepId: string) => {
      const index = steps.findIndex((s) => s.id === stepId);
      if (index !== -1) {
        setCurrentStepIndex(index);
      }
    },
    [steps]
  );

  /**
   * Auto-start onboarding if conditions are met
   */
  useEffect(() => {
    if (autoStart && !wasCompleted() && steps.length > 0) {
      // Delay start to allow page to render
      const timer = setTimeout(() => {
        start();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [autoStart, wasCompleted, steps, start]);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return {
    // State
    currentStep,
    currentStepIndex,
    isActive,
    progress,
    isFirstStep,
    isLastStep,
    completed,
    skipped,
    totalSteps: steps.length,

    // Actions
    start,
    next,
    previous,
    skip,
    goToStep,
    reset,
  };
};

/**
 * Hook to track element visibility for onboarding
 */
export const useElementHighlight = (selector?: string) => {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setElement(null);
      setRect(null);
      return;
    }

    const el = document.querySelector(selector) as HTMLElement;
    if (el) {
      setElement(el);
      setRect(el.getBoundingClientRect());

      // Update rect on scroll/resize
      const updateRect = () => {
        setRect(el.getBoundingClientRect());
      };

      window.addEventListener('scroll', updateRect);
      window.addEventListener('resize', updateRect);

      return () => {
        window.removeEventListener('scroll', updateRect);
        window.removeEventListener('resize', updateRect);
      };
    }
  }, [selector]);

  return { element, rect };
};
