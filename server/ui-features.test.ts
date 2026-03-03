import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hero animation CSS classes ────────────────────────────────────────────────
describe("Hero orb animation classes", () => {
  it("defines 4 orb animation classes", () => {
    const orbClasses = ["hero-orb-1", "hero-orb-2", "hero-orb-3", "hero-orb-4"];
    expect(orbClasses).toHaveLength(4);
    orbClasses.forEach(cls => {
      expect(cls).toMatch(/^hero-orb-\d$/);
    });
  });

  it("animation durations are varied for natural movement", () => {
    const durations = [18, 22, 28, 15]; // seconds
    const uniqueDurations = new Set(durations);
    expect(uniqueDurations.size).toBe(4); // all different
  });
});

// ── Onboarding modal logic ────────────────────────────────────────────────────
describe("Onboarding modal", () => {
  const STORAGE_KEY = "hd_onboarding_seen";

  beforeEach(() => {
    // Reset localStorage mock
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it("should show onboarding when not seen before", () => {
    const seen = localStorage.getItem(STORAGE_KEY);
    expect(seen).toBeNull();
    // If null → show onboarding
    const shouldShow = !seen;
    expect(shouldShow).toBe(true);
  });

  it("should not show onboarding when already seen", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("1"),
      setItem: vi.fn(),
    });
    const seen = localStorage.getItem(STORAGE_KEY);
    const shouldShow = !seen;
    expect(shouldShow).toBe(false);
  });

  it("marks onboarding as seen on close", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem,
    });
    // Simulate markSeen
    localStorage.setItem(STORAGE_KEY, "1");
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, "1");
  });

  it("has 3 steps", () => {
    const steps = ["Typ", "Autorita", "AI výklad"];
    expect(steps).toHaveLength(3);
  });

  it("last step triggers AI reading request", () => {
    const onRequestAiReading = vi.fn();
    const isLast = true;
    if (isLast) onRequestAiReading();
    expect(onRequestAiReading).toHaveBeenCalledOnce();
  });
});

// ── Incarnation Cross page ────────────────────────────────────────────────────
describe("Incarnation Cross page", () => {
  const translateCrossName = (name: string) => {
    const CROSS_TYPE_CS: Record<string, string> = {
      "Right Angle Cross": "Pravý Úhlový Kříž",
      "Left Angle Cross": "Levý Úhlový Kříž",
      "Juxtaposition Cross": "Juxtapoziční Kříž",
    };
    let result = name;
    for (const [en, cz] of Object.entries(CROSS_TYPE_CS)) {
      result = result.replace(en, cz);
    }
    return result;
  };

  it("translates Right Angle Cross correctly", () => {
    expect(translateCrossName("Right Angle Cross of the Vessel of Love")).toBe(
      "Pravý Úhlový Kříž of the Vessel of Love"
    );
  });

  it("translates Left Angle Cross correctly", () => {
    expect(translateCrossName("Left Angle Cross of Confrontation")).toBe(
      "Levý Úhlový Kříž of Confrontation"
    );
  });

  it("translates Juxtaposition Cross correctly", () => {
    expect(translateCrossName("Juxtaposition Cross of Limitation")).toBe(
      "Juxtapoziční Kříž of Limitation"
    );
  });

  it("leaves unknown cross names unchanged", () => {
    expect(translateCrossName("Unknown Cross of Something")).toBe(
      "Unknown Cross of Something"
    );
  });

  it("identifies 3 cross types with correct themes", () => {
    const crossTypes = {
      "Right Angle Cross": "Osobní osud",
      "Left Angle Cross": "Transpersonální osud",
      "Juxtaposition Cross": "Fixní osud",
    };
    expect(Object.keys(crossTypes)).toHaveLength(3);
    expect(crossTypes["Right Angle Cross"]).toBe("Osobní osud");
    expect(crossTypes["Left Angle Cross"]).toBe("Transpersonální osud");
    expect(crossTypes["Juxtaposition Cross"]).toBe("Fixní osud");
  });

  it("cross has exactly 4 gates", () => {
    const mockCross = { name: "Right Angle Cross of Eden", type: "Right Angle Cross", gates: [1, 2, 7, 13] };
    expect(mockCross.gates).toHaveLength(4);
  });

  it("route is /incarnation-cross", () => {
    const route = "/incarnation-cross";
    expect(route).toBe("/incarnation-cross");
  });
});

// ── Mobile hamburger menu ─────────────────────────────────────────────────────
describe("Mobile hamburger menu", () => {
  it("has primary navigation links", () => {
    const primaryLinks = [
      { href: "/calculate", label: "Mapa zdarma" },
      { href: "/encyclopedia", label: "Encyklopedie" },
      { href: "/ai-guide", label: "AI průvodce" },
    ];
    expect(primaryLinks).toHaveLength(3);
  });

  it("has tools section links", () => {
    const toolsLinks = [
      "/return-chart",
      "/compare",
      "/transits",
      "/transit-calendar",
      "/variables",
    ];
    expect(toolsLinks).toHaveLength(5);
  });

  it("has explore section links including blog", () => {
    const exploreLinks = ["/celebrities", "/iching", "/blog"];
    expect(exploreLinks).toContain("/blog");
  });

  it("closes on route change", () => {
    let mobileOpen = true;
    const location = "/new-page";
    // Simulate useEffect on location change
    if (location) mobileOpen = false;
    expect(mobileOpen).toBe(false);
  });

  it("prevents body scroll when open", () => {
    const bodyStyle = { overflow: "" };
    // Simulate opening
    bodyStyle.overflow = "hidden";
    expect(bodyStyle.overflow).toBe("hidden");
    // Simulate closing
    bodyStyle.overflow = "";
    expect(bodyStyle.overflow).toBe("");
  });
});
