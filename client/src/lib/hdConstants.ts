/**
 * Shared HD constants — single source of truth for planet symbols, type colors,
 * cross translations, and planet colors used across multiple page components.
 */

export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Earth: "⊕",
  Moon: "☽",
  "North Node": "☊",
  "South Node": "☋",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
};

export const PLANET_COLORS: Record<string, string> = {
  Sun: "text-amber-500",
  Moon: "text-slate-400",
  Mercury: "text-cyan-500",
  Venus: "text-pink-400",
  Mars: "text-red-500",
  Jupiter: "text-orange-400",
  Saturn: "text-stone-500",
  Uranus: "text-teal-400",
  Neptune: "text-indigo-400",
  Pluto: "text-purple-500",
  "North Node": "text-emerald-500",
  "South Node": "text-rose-400",
};

export const TYPE_COLORS: Record<string, string> = {
  Manifestor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Generator: "bg-amber-50 text-amber-700 border-amber-200",
  "Manifesting Generator": "bg-orange-50 text-orange-700 border-orange-200",
  Projector: "bg-violet-50 text-violet-700 border-violet-200",
  Reflector: "bg-slate-100 text-slate-700 border-slate-200",
};

export const CROSS_TYPE_CS: Record<string, string> = {
  "Right Angle Cross": "Pravý Úhlový Kříž",
  "Left Angle Cross": "Levý Úhlový Kříž",
  "Juxtaposition Cross": "Juxtapoziční Kříž",
};

export function translateCrossName(name: string, locale?: string): string {
  if (locale === "en") return name;
  let result = name;
  for (const [en, cz] of Object.entries(CROSS_TYPE_CS)) {
    result = result.replace(en, cz);
  }
  return result;
}
