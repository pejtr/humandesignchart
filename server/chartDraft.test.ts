import { describe, expect, it } from "vitest";
import { clearChartDraft, hasChartDraft, readChartDraft, saveChartDraft } from "../client/src/lib/chartDraft";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("chart draft recovery", () => {
  it("mirrors a draft and reads it from the durable fallback", () => {
    const session = memoryStorage();
    const local = memoryStorage();
    saveChartDraft({ type: "Generator" }, { name: "Petr" }, [session, local]);
    session.removeItem("chartResult");
    session.removeItem("chartMeta");

    expect(readChartDraft([session, local])).toEqual({
      chart: JSON.stringify({ type: "Generator" }),
      meta: JSON.stringify({ name: "Petr" }),
    });
    expect(hasChartDraft([session, local])).toBe(true);
  });

  it("clears both browser copies after a database save", () => {
    const session = memoryStorage();
    const local = memoryStorage();
    saveChartDraft({ id: 1 }, { name: "Petr" }, [session, local]);
    clearChartDraft([session, local]);
    expect(hasChartDraft([session, local])).toBe(false);
  });
});
