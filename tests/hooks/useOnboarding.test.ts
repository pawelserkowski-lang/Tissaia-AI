import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding, OnboardingStep } from '../../hooks/useOnboarding';

describe('useOnboarding', () => {
  const mockSteps: OnboardingStep[] = [
    {
      id: 'step1',
      title: 'Step 1',
      description: 'First step',
    },
    {
      id: 'step2',
      title: 'Step 2',
      description: 'Second step',
    },
    {
      id: 'step3',
      title: 'Step 3',
      description: 'Third step',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with inactive state', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    expect(result.current.isActive).toBe(false);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.currentStepIndex).toBe(-1);
  });

  it('should start onboarding', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep).toEqual(mockSteps[0]);
    expect(result.current.currentStepIndex).toBe(0);
  });

  it('should navigate to next step', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.next();
    });

    expect(result.current.currentStep).toEqual(mockSteps[1]);
    expect(result.current.currentStepIndex).toBe(1);
  });

  it('should navigate to previous step', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
      result.current.next();
    });

    act(() => {
      result.current.previous();
    });

    expect(result.current.currentStep).toEqual(mockSteps[0]);
    expect(result.current.currentStepIndex).toBe(0);
  });

  it('should complete onboarding on last step', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
      result.current.next();
      result.current.next();
      result.current.next(); // Complete
    });

    expect(result.current.isActive).toBe(false);
  });

  it('should skip onboarding', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.skip();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.skipped).toBe(true);
  });

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.progress).toBeCloseTo(33.33, 1);

    act(() => {
      result.current.next();
    });

    expect(result.current.progress).toBeCloseTo(66.67, 1);
  });

  it('should reset onboarding', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
      result.current.next();
      result.current.skip();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.skipped).toBe(false);
  });

  it('should go to specific step', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.goToStep('step3');
    });

    expect(result.current.currentStep).toEqual(mockSteps[2]);
    expect(result.current.currentStepIndex).toBe(2);
  });

  it('should track completed steps', () => {
    const { result } = renderHook(() =>
      useOnboarding(mockSteps, { autoStart: false })
    );

    act(() => {
      result.current.start();
      result.current.next();
    });

    expect(result.current.completed.has('step1')).toBe(true);
    expect(result.current.completed.has('step2')).toBe(false);
  });
});
