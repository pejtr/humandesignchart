import { clearDailyTransitCaches, warmDailyTransitCache } from "../routers/transit";
import { millisecondsUntilNextPragueMidnight } from "../services/pragueDailyCache";
import { processDailyTransits } from "./dailyTransit";

export function startDailyTransitScheduler(now: () => Date = () => new Date()): () => void {
  let timer: NodeJS.Timeout | undefined;

  const scheduleNext = () => {
    timer = setTimeout(async () => {
      clearDailyTransitCaches();
      try {
        await warmDailyTransitCache(now());
        await processDailyTransits();
      } catch (error) {
        console.error("[DailyTransitScheduler] Midnight refresh failed:", error);
      } finally {
        scheduleNext();
      }
    }, millisecondsUntilNextPragueMidnight(now()));
    timer.unref?.();
  };

  warmDailyTransitCache(now()).catch(error =>
    console.error("[DailyTransitScheduler] Startup cache warm failed:", error),
  );
  scheduleNext();
  return () => timer && clearTimeout(timer);
}
