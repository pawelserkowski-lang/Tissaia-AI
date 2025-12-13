import React from 'react';
import { OnboardingStep } from '../../hooks/useOnboarding';

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  completed: Set<string>;
  currentStepId?: string;
  onStepClick?: (stepId: string) => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  steps,
  completed,
  currentStepId,
  onStepClick,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Getting Started Checklist
      </h3>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = completed.has(step.id);
          const isCurrent = step.id === currentStepId;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${onStepClick ? 'cursor-pointer' : ''}`}
              onClick={() => onStepClick?.(step.id)}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      isCurrent
                        ? 'border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      isCompleted
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {index + 1}. {step.title}
                  </span>
                  {step.optional && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (Optional)
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>
            {completed.size} of {steps.length} completed
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(completed.size / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
