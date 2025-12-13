import { useState, useCallback, useRef } from 'react';

export interface BatchJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface BatchProcessorOptions {
  concurrency?: number; // Max parallel jobs
  onJobComplete?: (job: BatchJob) => void;
  onJobFailed?: (job: BatchJob, error: Error) => void;
  onBatchComplete?: (jobs: BatchJob[]) => void;
}

/**
 * Custom hook for batch processing files
 */
export const useBatchProcessor = (options: BatchProcessorOptions = {}) => {
  const { concurrency = 3, onJobComplete, onJobFailed, onBatchComplete } = options;

  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const processingQueue = useRef<string[]>([]);
  const activeJobs = useRef<Set<string>>(new Set());

  /**
   * Add jobs to the queue
   */
  const addJobs = useCallback((files: File[]) => {
    const newJobs: BatchJob[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      status: 'pending',
      progress: 0,
    }));

    setJobs((prev) => [...prev, ...newJobs]);
    processingQueue.current.push(...newJobs.map((j) => j.id));

    return newJobs;
  }, []);

  /**
   * Process a single job
   */
  const processJob = useCallback(
    async (jobId: string, processor: (job: BatchJob) => Promise<void>) => {
      activeJobs.current.add(jobId);

      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: 'processing' as const, startTime: Date.now() }
            : job
        )
      );

      try {
        const job = jobs.find((j) => j.id === jobId);
        if (!job) throw new Error('Job not found');

        await processor(job);

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: 'completed' as const,
                  progress: 100,
                  endTime: Date.now(),
                }
              : job
          )
        );

        const completedJob = jobs.find((j) => j.id === jobId);
        if (completedJob && onJobComplete) {
          onJobComplete({ ...completedJob, status: 'completed', progress: 100 });
        }
      } catch (error) {
        const err = error as Error;
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: 'failed' as const,
                  error: err.message,
                  endTime: Date.now(),
                }
              : job
          )
        );

        const failedJob = jobs.find((j) => j.id === jobId);
        if (failedJob && onJobFailed) {
          onJobFailed({ ...failedJob, status: 'failed', error: err.message }, err);
        }
      } finally {
        activeJobs.current.delete(jobId);
      }
    },
    [jobs, onJobComplete, onJobFailed]
  );

  /**
   * Process the queue
   */
  const processQueue = useCallback(
    async (processor: (job: BatchJob) => Promise<void>) => {
      if (isProcessing || isPaused) return;

      setIsProcessing(true);

      while (processingQueue.current.length > 0 && !isPaused) {
        // Wait if we've reached concurrency limit
        while (activeJobs.current.size >= concurrency) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const jobId = processingQueue.current.shift();
        if (jobId) {
          processJob(jobId, processor);
        }
      }

      // Wait for all active jobs to complete
      while (activeJobs.current.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setIsProcessing(false);

      // Notify batch completion
      if (onBatchComplete) {
        onBatchComplete(jobs);
      }
    },
    [isProcessing, isPaused, concurrency, processJob, jobs, onBatchComplete]
  );

  /**
   * Start batch processing
   */
  const startBatch = useCallback(
    (processor: (job: BatchJob) => Promise<void>) => {
      setIsPaused(false);
      processQueue(processor);
    },
    [processQueue]
  );

  /**
   * Pause batch processing
   */
  const pauseBatch = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume batch processing
   */
  const resumeBatch = useCallback(
    (processor: (job: BatchJob) => Promise<void>) => {
      setIsPaused(false);
      processQueue(processor);
    },
    [processQueue]
  );

  /**
   * Cancel all pending jobs
   */
  const cancelBatch = useCallback(() => {
    processingQueue.current = [];
    setIsPaused(false);
    setIsProcessing(false);

    setJobs((prev) =>
      prev.map((job) =>
        job.status === 'pending'
          ? { ...job, status: 'failed' as const, error: 'Cancelled by user' }
          : job
      )
    );
  }, []);

  /**
   * Clear completed jobs
   */
  const clearCompleted = useCallback(() => {
    setJobs((prev) => prev.filter((job) => job.status !== 'completed'));
  }, []);

  /**
   * Retry failed jobs
   */
  const retryFailed = useCallback(() => {
    setJobs((prev) =>
      prev.map((job) =>
        job.status === 'failed'
          ? { ...job, status: 'pending' as const, error: undefined, progress: 0 }
          : job
      )
    );

    const failedJobIds = jobs.filter((j) => j.status === 'failed').map((j) => j.id);
    processingQueue.current.push(...failedJobIds);
  }, [jobs]);

  /**
   * Update job progress
   */
  const updateJobProgress = useCallback((jobId: string, progress: number) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, progress } : job))
    );
  }, []);

  /**
   * Get batch statistics
   */
  const getStats = useCallback(() => {
    const total = jobs.length;
    const pending = jobs.filter((j) => j.status === 'pending').length;
    const processing = jobs.filter((j) => j.status === 'processing').length;
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;

    const completedJobs = jobs.filter(
      (j) => j.status === 'completed' && j.startTime && j.endTime
    );
    const avgDuration =
      completedJobs.length > 0
        ? completedJobs.reduce((sum, j) => sum + (j.endTime! - j.startTime!), 0) /
          completedJobs.length
        : 0;

    const estimatedTimeRemaining =
      processing + pending > 0 ? avgDuration * (processing + pending) : 0;

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      avgDuration,
      estimatedTimeRemaining,
      progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [jobs]);

  return {
    jobs,
    isProcessing,
    isPaused,
    addJobs,
    startBatch,
    pauseBatch,
    resumeBatch,
    cancelBatch,
    clearCompleted,
    retryFailed,
    updateJobProgress,
    getStats,
  };
};
