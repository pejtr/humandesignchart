export const CHART_RESULT_KEY = "chartResult";
export const CHART_META_KEY = "chartMeta";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStores(): StorageLike[] {
  if (typeof window === "undefined") return [];
  return [window.sessionStorage, window.localStorage];
}

export function saveChartDraft(chart: unknown, meta: unknown, stores = browserStores()) {
  const chartJson = JSON.stringify(chart);
  const metaJson = JSON.stringify(meta);
  for (const store of stores) {
    try {
      store.setItem(CHART_RESULT_KEY, chartJson);
      store.setItem(CHART_META_KEY, metaJson);
    } catch {
      // A full or unavailable browser storage must not break chart creation.
    }
  }
}

export function readChartDraft(stores = browserStores()) {
  for (const store of stores) {
    try {
      const chart = store.getItem(CHART_RESULT_KEY);
      const meta = store.getItem(CHART_META_KEY);
      if (chart) return { chart, meta };
    } catch {
      // Try the next storage (localStorage is the durable fallback).
    }
  }
  return null;
}

export function clearChartDraft(stores = browserStores()) {
  for (const store of stores) {
    try {
      store.removeItem(CHART_RESULT_KEY);
      store.removeItem(CHART_META_KEY);
    } catch {
      // A successful database save must not fail because storage is blocked.
    }
  }
}

export function hasChartDraft(stores = browserStores()) {
  return readChartDraft(stores) !== null;
}
