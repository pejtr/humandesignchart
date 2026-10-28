import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReportWebVitals } from "../client/src/hooks/useReportWebVitals";
import { trackGA4Event } from "../client/src/hooks/useGA4";

// No browser/DOM dependency: execute the hook's effect against isolated event targets.
vi.mock("react", () => ({
  useEffect: (callback: () => void) => { callback(); },
}));
vi.mock("../client/src/hooks/useGA4", () => ({
  trackGA4Event: vi.fn(),
}));

type ReportEntry = { startTime: number; duration?: number };
class FakeObserver {
  static instances: FakeObserver[] = [];
  private callback: PerformanceObserverCallback;
  type = "";
  disconnected = false;
  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
    FakeObserver.instances.push(this);
  }
  observe(options: PerformanceObserverInit) {
    this.type = (options as { type?: string }).type || "";
  }
  disconnect() { this.disconnected = true; }
  emit(entries: ReportEntry[]) {
    const list = { getEntries: () => entries } as unknown as PerformanceObserverEntryList;
    this.callback(list, this as unknown as PerformanceObserver);
  }
}
let browserWindow: EventTarget;
let browserStorage: Map<string, string>;
const setConsent = (analytics: boolean) => {
  browserStorage.set("hd-cookie-consent", JSON.stringify({ accepted: true, analytics }));
  browserWindow.dispatchEvent(new Event("hd:marketing-consent-changed"));
};
const lcp = (startTime: number) =>
  FakeObserver.instances.filter(o => o.type === "largest-contentful-paint" && !o.disconnected).forEach(o => o.emit([{ startTime }]));

describe("Report Web Vitals consent boundary", () => {
  beforeEach(() => {
    browserStorage = new Map();
    browserWindow = new EventTarget();
    FakeObserver.instances = [];
    vi.clearAllMocks();
    vi.stubGlobal("PerformanceObserver", FakeObserver);
    (browserWindow as EventTarget & { PerformanceObserver?: typeof FakeObserver }).PerformanceObserver = FakeObserver;
    vi.stubGlobal("window", browserWindow);
    vi.stubGlobal("document", new EventTarget());
    vi.stubGlobal("location", { pathname: "/en/read" });
    vi.stubGlobal("localStorage", { getItem: (k: string) => browserStorage.get(k) || null });
  });
  it("does not start or permanently exhaust reporting before analytics consent", () => {
    useReportWebVitals();
    expect(FakeObserver.instances).toHaveLength(0);
    browserWindow.dispatchEvent(new Event("pagehide"));
    expect(trackGA4Event).not.toHaveBeenCalled();
    setConsent(true);
    expect(FakeObserver.instances.length).toBeGreaterThan(0);
    lcp(2750);
    browserWindow.dispatchEvent(new Event("pagehide"));
    expect(trackGA4Event).toHaveBeenCalledWith("web_vital", expect.objectContaining({
      metric_name: "LCP", metric_value: 2750,
    }));
  });
  it("drops collected data on revocation and sends only post-consent observations", () => {
    browserStorage.set("hd-cookie-consent", JSON.stringify({ accepted: true, analytics: true }));
    useReportWebVitals();
    lcp(9999);
    setConsent(false);
    expect(FakeObserver.instances.every(o => o.disconnected)).toBe(true);
    browserWindow.dispatchEvent(new Event("pagehide"));
    expect(trackGA4Event).not.toHaveBeenCalled();
    setConsent(true);
    lcp(1200);
    browserWindow.dispatchEvent(new Event("pagehide"));
    expect(trackGA4Event).toHaveBeenCalledWith("web_vital", expect.objectContaining({
      metric_name: "LCP", metric_value: 1200,
    }));
    expect(trackGA4Event).not.toHaveBeenCalledWith("web_vital", expect.objectContaining({ metric_value: 9999 }));
  });
});
