import { Temporal } from "@js-temporal/polyfill";
import tzlookup from "tz-lookup";
import type { LocalTimeDisambiguation } from "../../shared/chartSchemas";

export type TimezoneResolutionCode =
  | "INVALID_TIMEZONE"
  | "INVALID_LOCAL_DATE_TIME"
  | "NONEXISTENT_LOCAL_TIME"
  | "AMBIGUOUS_LOCAL_TIME";

export class TimezoneResolutionError extends Error {
  constructor(
    public readonly code: TimezoneResolutionCode,
    message: string,
  ) {
    super(message);
    this.name = "TimezoneResolutionError";
  }
}

export interface ResolvedBirthInstant {
  birthUtc: string;
  epochMilliseconds: number;
  utcOffsetMinutes: number;
  utcOffsetSeconds: number;
  timezone: string;
  disambiguation?: LocalTimeDisambiguation;
}

export function lookupIanaTimezone(latitude: number, longitude: number): string {
  try {
    return tzlookup(latitude, longitude);
  } catch {
    throw new TimezoneResolutionError(
      "INVALID_TIMEZONE",
      "Pro zadané souřadnice se nepodařilo určit časové pásmo.",
    );
  }
}

function zonedFrom(
  plain: Temporal.PlainDateTime,
  timezone: string,
  disambiguation: "earlier" | "later",
): Temporal.ZonedDateTime {
  return Temporal.ZonedDateTime.from(
    {
      timeZone: timezone,
      year: plain.year,
      month: plain.month,
      day: plain.day,
      hour: plain.hour,
      minute: plain.minute,
      second: plain.second,
      millisecond: plain.millisecond,
    },
    { disambiguation },
  );
}

export function resolveBirthInstant(input: {
  birthDate: string;
  birthTime: string;
  timezone: string;
  disambiguation?: LocalTimeDisambiguation;
}): ResolvedBirthInstant {
  let plain: Temporal.PlainDateTime;
  try {
    plain = Temporal.PlainDateTime.from(`${input.birthDate}T${input.birthTime}`);
  } catch {
    throw new TimezoneResolutionError(
      "INVALID_LOCAL_DATE_TIME",
      "Datum nebo čas narození není platný.",
    );
  }

  let earlier: Temporal.ZonedDateTime;
  let later: Temporal.ZonedDateTime;
  try {
    earlier = zonedFrom(plain, input.timezone, "earlier");
    later = zonedFrom(plain, input.timezone, "later");
  } catch {
    throw new TimezoneResolutionError(
      "INVALID_TIMEZONE",
      "Časové pásmo musí být platný IANA identifikátor, například Europe/Prague.",
    );
  }

  const earlierMatches = earlier.toPlainDateTime().equals(plain);
  const laterMatches = later.toPlainDateTime().equals(plain);

  if (!earlierMatches || !laterMatches) {
    throw new TimezoneResolutionError(
      "NONEXISTENT_LOCAL_TIME",
      `Místní čas ${input.birthDate} ${input.birthTime} v pásmu ${input.timezone} neexistuje kvůli změně času.`,
    );
  }

  const isAmbiguous = earlier.epochNanoseconds !== later.epochNanoseconds;
  if (isAmbiguous && !input.disambiguation) {
    throw new TimezoneResolutionError(
      "AMBIGUOUS_LOCAL_TIME",
      `Místní čas ${input.birthDate} ${input.birthTime} v pásmu ${input.timezone} nastal dvakrát. Zvolte dřívější nebo pozdější výskyt.`,
    );
  }

  const resolved = input.disambiguation === "later" ? later : earlier;
  const utcOffsetSeconds = Math.trunc(resolved.offsetNanoseconds / 1_000_000_000);
  return {
    birthUtc: resolved.toInstant().toString(),
    epochMilliseconds: resolved.epochMilliseconds,
    utcOffsetMinutes: utcOffsetSeconds / 60,
    utcOffsetSeconds,
    timezone: resolved.timeZoneId,
    disambiguation: isAmbiguous ? input.disambiguation : undefined,
  };
}
