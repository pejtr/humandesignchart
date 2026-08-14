import { describe, expect, it } from "vitest";
import { resolveBirthInstant, TimezoneResolutionError } from "./timezone";

describe("canonical historical timezone resolution", () => {
  it("uses Prague daylight-saving rules for the exact 1990 birth date", () => {
    expect(resolveBirthInstant({
      birthDate: "1990-06-15",
      birthTime: "14:30",
      timezone: "Europe/Prague",
    })).toMatchObject({
      birthUtc: "1990-06-15T12:30:00Z",
      utcOffsetMinutes: 120,
      timezone: "Europe/Prague",
    });
  });

  it("uses standard time for Prague in winter", () => {
    expect(resolveBirthInstant({
      birthDate: "1990-01-15",
      birthTime: "12:00",
      timezone: "Europe/Prague",
    })).toMatchObject({
      birthUtc: "1990-01-15T11:00:00Z",
      utcOffsetMinutes: 60,
    });
  });

  it("preserves historical local-mean-time seconds before standard time", () => {
    expect(resolveBirthInstant({
      birthDate: "1879-03-14",
      birthTime: "11:30",
      timezone: "Europe/Berlin",
    })).toMatchObject({
      birthUtc: "1879-03-14T10:36:32Z",
      utcOffsetSeconds: 3208,
    });
  });

  it("rejects a nonexistent local time during the spring DST jump", () => {
    expect(() => resolveBirthInstant({
      birthDate: "2024-03-31",
      birthTime: "02:30",
      timezone: "Europe/Prague",
    })).toThrowError(expect.objectContaining<Partial<TimezoneResolutionError>>({
      code: "NONEXISTENT_LOCAL_TIME",
    }));
  });

  it("requires an explicit choice for an ambiguous autumn time", () => {
    expect(() => resolveBirthInstant({
      birthDate: "2024-10-27",
      birthTime: "02:30",
      timezone: "Europe/Prague",
    })).toThrowError(expect.objectContaining<Partial<TimezoneResolutionError>>({
      code: "AMBIGUOUS_LOCAL_TIME",
    }));
  });

  it("resolves both occurrences of an ambiguous time deterministically", () => {
    const base = {
      birthDate: "2024-10-27",
      birthTime: "02:30",
      timezone: "Europe/Prague",
    } as const;

    expect(resolveBirthInstant({ ...base, disambiguation: "earlier" })).toMatchObject({
      birthUtc: "2024-10-27T00:30:00Z",
      utcOffsetMinutes: 120,
    });
    expect(resolveBirthInstant({ ...base, disambiguation: "later" })).toMatchObject({
      birthUtc: "2024-10-27T01:30:00Z",
      utcOffsetMinutes: 60,
    });
  });

  it("rejects display labels and numeric-offset substitutes", () => {
    expect(() => resolveBirthInstant({
      birthDate: "1990-01-15",
      birthTime: "12:00",
      timezone: "UTC+1",
    })).toThrowError(expect.objectContaining<Partial<TimezoneResolutionError>>({
      code: "INVALID_TIMEZONE",
    }));
  });
});
