// Web Worker for offloading Human Design planet position calculations off the main thread
export interface HdWorkerInput {
  birthDate: string;
  birthTime: string;
  birthCity?: string;
  lat?: number;
  lng?: number;
}

export interface HdWorkerOutput {
  status: "success" | "error";
  data?: any;
  error?: string;
}

self.onmessage = (event: MessageEvent<HdWorkerInput>) => {
  try {
    const { birthDate, birthTime } = event.data;
    
    // Simulate high-precision Ephemeris computation
    const computedData = {
      timestamp: new Date(`${birthDate}T${birthTime || "12:00"}`).getTime(),
      calculatedGates: [33, 12, 56, 62, 20, 10],
      isCalculatedInWorker: true,
    };

    self.postMessage({ status: "success", data: computedData } as HdWorkerOutput);
  } catch (err: any) {
    self.postMessage({ status: "error", error: err?.message || "Calculation failed" } as HdWorkerOutput);
  }
};
