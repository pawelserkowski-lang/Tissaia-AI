import React, { useEffect } from 'react';
import { OnboardingStep } from '../../hooks/useOnboarding';
import { useElementHighlight } from '../../hooks/useOnboarding';

interface OnboardingTourProps {
  step: OnboardingStep | null;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  currentStepIndex: number;
  totalSteps: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  step,
  isActive,
  onNext,
  onPrevious,
  onSkip,
  isFirstStep,
  isLastStep,
  progress,
  currentStepIndex,
  totalSteps,
}) => {
  const { element, rect } = useElementHighlight(step?.target);

  useEffect(() => {
    if (element && isActive) {
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add highlight class
      element.classList.add('onboarding-highlight');

      return () => {
        element.classList.remove('onboarding-highlight');
      };
    }
  }, [element, isActive]);

  if (!isActive || !step) return null;

  const getTooltipPosition = () => {
    if (!rect || !step.position || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const offset = 20;
    const positions: Record<string, React.CSSProperties> = {
      top: {
        bottom: `${window.innerHeight - rect.top + offset}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      bottom: {
        top: `${rect.bottom + offset}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      left: {
        top: `${rect.top + rect.height / 2}px`,
        right: `${window.innerWidth - rect.left + offset}px`,
        transform: 'translateY(-50%)',
      },
      right: {
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.right + offset}px`,
        transform: 'translateY(-50%)',
      },
    };

    return positions[step.position] || positions.center;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] pointer-events-auto" />

      {/* Highlight cutout */}
      {rect && step.target && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            border: '2px solid #3b82f6',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[10000] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md"
        style={getTooltipPosition()}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {step.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{step.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Skip tour
          </button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <button
                onClick={onPrevious}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={onNext}
              className="px-6 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {/* Optional indicator */}
        {step.optional && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            This step is optional
          </p>
        )}
      </div>
    </>
  );
};
