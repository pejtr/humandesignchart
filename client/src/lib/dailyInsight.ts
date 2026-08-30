type TransitGate = {
  planet: string;
  gate: number;
  theme?: string;
  themeEn?: string;
};

type DailyChart = {
  chartData?: {
    type?: string;
    strategy?: string;
    activatedGates?: number[];
  } | null;
};

export function buildDailyInsight(
  transitGates: TransitGate[] | undefined,
  chart: DailyChart | undefined,
  locale: string,
): string | null {
  const isCs = locale === "cs";
  const sun = transitGates?.find(gate => gate.planet === "Sun");
  if (!sun) return null;

  const chartData = chart?.chartData;
  const matchingGate = transitGates?.find(gate => chartData?.activatedGates?.includes(gate.gate));
  if (matchingGate) {
    const theme = isCs ? matchingGate.theme : matchingGate.themeEn;
    return isCs
      ? `Dnes se ve vaší mapě zesiluje Brána ${matchingGate.gate}${theme ? ` — ${theme}` : ""}.`
      : `Gate ${matchingGate.gate}${theme ? ` — ${theme}` : ""} is amplified in your chart today.`;
  }

  const theme = (isCs ? sun.theme : sun.themeEn) || (isCs ? `Brána ${sun.gate}` : `Gate ${sun.gate}`);
  if (chartData?.type) {
    return isCs
      ? `Pro váš typ ${chartData.type}: dnešní téma je ${theme.toLocaleLowerCase("cs-CZ")}.`
      : `For your ${chartData.type} design, today's theme is ${theme.toLocaleLowerCase("en-US")}.`;
  }

  return isCs ? `Téma dne: ${theme}.` : `Theme of the day: ${theme}.`;
}
