import { useState, useCallback } from "react";
import type { HdWorkerInput, HdWorkerOutput } from "@/workers/hdCalculator.worker";

export function useHdWorker() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateAsync = useCallback((input: HdWorkerInput): Promise<any> => {
    return new Promise((resolve, reject) => {
      setIsCalculating(true);
      setError(null);

      // Fallback or Worker execution
      try {
        const worker = new Worker(
          new URL("../workers/hdCalculator.worker.ts", import.meta.url),
          { type: "module" }
        );

        worker.onmessage = (e: MessageEvent<HdWorkerOutput>) => {
          setIsCalculating(false);
          if (e.data.status === "success") {
            setResult(e.data.data);
            resolve(e.data.data);
          } else {
            setError(e.data.error || "Error");
            reject(new Error(e.data.error));
          }
          worker.terminate();
        };

        worker.onerror = (err) => {
          setIsCalculating(false);
          setError("Worker execution error");
          reject(err);
          worker.terminate();
        };

        worker.postMessage(input);
      } catch (err: any) {
        setIsCalculating(false);
        setError(err?.message || "Worker not supported");
        resolve({ isCalculatedInWorker: false });
      }
    });
  }, []);

  return { calculateAsync, isCalculating, result, error };
}
