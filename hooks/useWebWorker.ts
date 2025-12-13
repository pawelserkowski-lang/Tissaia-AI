import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebWorkerOptions {
  timeout?: number;
}

export interface WebWorkerResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  run: (data: any) => void;
  terminate: () => void;
}

/**
 * Custom hook to use Web Workers for heavy computations
 * Offloads processing to a separate thread to prevent UI blocking
 */
export const useWebWorker = <T = any>(
  workerFunction: (data: any) => T,
  options: WebWorkerOptions = {}
): WebWorkerResult<T> => {
  const { timeout } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const createWorker = useCallback(() => {
    // Convert function to blob URL
    const workerCode = `
      self.onmessage = function(e) {
        try {
          const result = (${workerFunction.toString()})(e.data);
          self.postMessage({ type: 'success', data: result });
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error.message || 'Unknown error'
          });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    return new Worker(workerUrl);
  }, [workerFunction]);

  const run = useCallback(
    (inputData: any) => {
      setIsLoading(true);
      setError(null);
      setData(null);

      // Create new worker
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      workerRef.current = createWorker();

      // Set timeout if specified
      if (timeout) {
        timeoutRef.current = setTimeout(() => {
          if (workerRef.current) {
            workerRef.current.terminate();
            setError(new Error(`Worker timeout after ${timeout}ms`));
            setIsLoading(false);
          }
        }, timeout);
      }

      // Handle worker response
      workerRef.current.onmessage = (e: MessageEvent) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (e.data.type === 'success') {
          setData(e.data.data);
          setError(null);
        } else if (e.data.type === 'error') {
          setError(new Error(e.data.error));
          setData(null);
        }

        setIsLoading(false);
      };

      workerRef.current.onerror = (e: ErrorEvent) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setError(new Error(e.message));
        setIsLoading(false);
      };

      // Send data to worker
      workerRef.current.postMessage(inputData);
    },
    [createWorker, timeout]
  );

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      terminate();
    };
  }, [terminate]);

  return {
    data,
    error,
    isLoading,
    run,
    terminate,
  };
};

/**
 * Hook for parallel processing with multiple workers
 */
export const useParallelWebWorkers = <T = any>(
  workerFunction: (data: any) => T,
  concurrency: number = navigator.hardwareConcurrency || 4
) => {
  const [results, setResults] = useState<T[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const runParallel = useCallback(
    async (dataArray: any[]): Promise<T[]> => {
      setIsLoading(true);
      setResults([]);
      setErrors([]);
      setProgress(0);

      const chunks: any[][] = [];
      const chunkSize = Math.ceil(dataArray.length / concurrency);

      for (let i = 0; i < dataArray.length; i += chunkSize) {
        chunks.push(dataArray.slice(i, i + chunkSize));
      }

      const workerPromises = chunks.map((chunk, index) => {
        return new Promise<T[]>((resolve, reject) => {
          const workerCode = `
            self.onmessage = function(e) {
              try {
                const results = e.data.map((${workerFunction.toString()}));
                self.postMessage({ type: 'success', data: results });
              } catch (error) {
                self.postMessage({
                  type: 'error',
                  error: error.message || 'Unknown error'
                });
              }
            };
          `;

          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          const worker = new Worker(workerUrl);

          worker.onmessage = (e: MessageEvent) => {
            if (e.data.type === 'success') {
              setProgress((prev) => prev + chunk.length);
              resolve(e.data.data);
            } else {
              reject(new Error(e.data.error));
            }
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
          };

          worker.onerror = (e: ErrorEvent) => {
            reject(new Error(e.message));
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
          };

          worker.postMessage(chunk);
        });
      });

      try {
        const allResults = await Promise.all(workerPromises);
        const flatResults = allResults.flat();
        setResults(flatResults);
        setIsLoading(false);
        return flatResults;
      } catch (error) {
        const err = error as Error;
        setErrors((prev) => [...prev, err]);
        setIsLoading(false);
        throw err;
      }
    },
    [workerFunction, concurrency]
  );

  return {
    results,
    errors,
    isLoading,
    progress,
    runParallel,
  };
};

/**
 * Common worker functions for heavy computations
 */
export const workerFunctions = {
  /**
   * Heavy calculation example
   */
  fibonacci: (n: number): number => {
    if (n <= 1) return n;
    return workerFunctions.fibonacci(n - 1) + workerFunctions.fibonacci(n - 2);
  },

  /**
   * Image processing example
   */
  imageProcessing: (imageData: ImageData): ImageData => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Grayscale
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    return imageData;
  },

  /**
   * Sort large array
   */
  sortArray: (arr: number[]): number[] => {
    return [...arr].sort((a, b) => a - b);
  },
};
