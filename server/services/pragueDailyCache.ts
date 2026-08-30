import { Temporal } from "@js-temporal/polyfill";

export const DAILY_TRANSIT_TIME_ZONE = "Europe/Prague";

export function getPragueDay(date: Date = new Date()): string {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime())
    .toZonedDateTimeISO(DAILY_TRANSIT_TIME_ZONE)
    .toPlainDate()
    .toString();
}

export function getPragueDayStart(date: Date = new Date()): Date {
  const start = Temporal.Instant.fromEpochMilliseconds(date.getTime())
    .toZonedDateTimeISO(DAILY_TRANSIT_TIME_ZONE)
    .startOfDay()
    .toInstant();
  return new Date(Number(start.epochMilliseconds));
}

export function millisecondsUntilNextPragueMidnight(date: Date = new Date()): number {
  const now = Temporal.Instant.fromEpochMilliseconds(date.getTime());
  const nextMidnight = now
    .toZonedDateTimeISO(DAILY_TRANSIT_TIME_ZONE)
    .startOfDay()
    .add({ days: 1 })
    .toInstant();
  return Math.max(1, Number(nextMidnight.epochMilliseconds - now.epochMilliseconds));
}

/**
 * Deduplicates concurrent work and keeps it for one Prague calendar day.
 * Rejected work is evicted so a later request can retry safely.
 */
export class PragueDailyKeyedCache<T> {
  private day = "";
  private readonly entries = new Map<string, Promise<T>>();

  get(key: string, factory: () => Promise<T>, date: Date = new Date()): Promise<T> {
    const currentDay = getPragueDay(date);
    if (currentDay !== this.day) {
      this.day = currentDay;
      this.entries.clear();
    }

    const existing = this.entries.get(key);
    if (existing) return existing;

    const pending = factory().catch(error => {
      if (this.entries.get(key) === pending) this.entries.delete(key);
      throw error;
    });
    this.entries.set(key, pending);
    return pending;
  }

  clear(): void {
    this.day = "";
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
