/**
 * SVG aura icons for each Human Design type,
 * matching the generated "Pět typů lidí a jejich aura" graphic.
 *
 * Generator     = Flower of Life (overlapping circles)
 * Manifesting G = Flower of Life + radiating spikes
 * Projector     = Octagon / focused beam
 * Manifestor    = Merkaba / Star of David (two triangles)
 * Reflector     = Concentric ripple circles
 */

interface TypeAuraIconProps {
  type: string;
  size?: number;
  className?: string;
  animate?: boolean;
}

const TYPE_COLORS: Record<string, { primary: string; secondary: string }> = {
  Generator:                { primary: "#C8A050", secondary: "#E8C878" },
  "Manifesting Generator":  { primary: "#E07030", secondary: "#F09050" },
  Projector:                { primary: "#7B5EA7", secondary: "#9B7EC7" },
  Manifestor:               { primary: "#2D8B70", secondary: "#4DAB90" },
  Reflector:                { primary: "#9A9A9A", secondary: "#BABABA" },
};

function normalizeType(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("manifest") && lower.includes("gener")) return "Manifesting Generator";
  if (lower.includes("gener")) return "Generator";
  if (lower.includes("projekt") || lower.includes("project")) return "Projector";
  if (lower.includes("manifest")) return "Manifestor";
  if (lower.includes("reflek") || lower.includes("reflect")) return "Reflector";
  return type;
}

function FlowerOfLife({ color, secondary, animate }: { color: string; secondary: string; animate?: boolean }) {
  const r = 14;
  const cx = 32, cy = 32;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60) * Math.PI / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={28} fill="none" stroke={secondary} strokeWidth="0.8" opacity={0.5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1" opacity={0.7}>
        {animate && <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="30s" repeatCount="indefinite" />}
      </circle>
      {petals.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={r} fill="none" stroke={color} strokeWidth="0.8" opacity={0.5}>
          {animate && <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur={`${28 + i * 2}s`} repeatCount="indefinite" />}
        </circle>
      ))}
    </g>
  );
}

function FlowerOfLifeWithSpikes({ color, secondary, animate }: { color: string; secondary: string; animate?: boolean }) {
  const r = 14;
  const cx = 32, cy = 32;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60) * Math.PI / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const spikes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30) * Math.PI / 180;
    return {
      x1: cx + 22 * Math.cos(angle), y1: cy + 22 * Math.sin(angle),
      x2: cx + 30 * Math.cos(angle), y2: cy + 30 * Math.sin(angle),
    };
  });
  return (
    <g>
      {spikes.map((s, i) => (
        <line key={`s${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={secondary} strokeWidth="0.8" opacity={0.5}>
          {animate && <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />}
        </line>
      ))}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1" opacity={0.7}>
        {animate && <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="25s" repeatCount="indefinite" />}
      </circle>
      {petals.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={r} fill="none" stroke={color} strokeWidth="0.8" opacity={0.5}>
          {animate && <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur={`${22 + i * 2}s`} repeatCount="indefinite" />}
        </circle>
      ))}
    </g>
  );
}

function Octagon({ color, secondary, animate }: { color: string; secondary: string; animate?: boolean }) {
  const cx = 32, cy = 32, r = 24;
  const points = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 22.5) * Math.PI / 180;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
  const innerPoints = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 22.5) * Math.PI / 180;
    return `${cx + (r * 0.6) * Math.cos(angle)},${cy + (r * 0.6) * Math.sin(angle)}`;
  }).join(" ");
  return (
    <g>
      <polygon points={points} fill="none" stroke={color} strokeWidth="1.2" opacity={0.7}>
        {animate && <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="40s" repeatCount="indefinite" />}
      </polygon>
      <polygon points={innerPoints} fill="none" stroke={secondary} strokeWidth="0.8" opacity={0.4}>
        {animate && <animateTransform attributeName="transform" type="rotate" from="360 32 32" to="0 32 32" dur="35s" repeatCount="indefinite" />}
      </polygon>
      <line x1={cx} y1={cy - r - 2} x2={cx} y2={cy - r + 6} stroke={color} strokeWidth="1" opacity={0.6} />
    </g>
  );
}

function Merkaba({ color, secondary, animate }: { color: string; secondary: string; animate?: boolean }) {
  const cx = 32, cy = 32, r = 25;
  const triUp = Array.from({ length: 3 }, (_, i) => {
    const angle = (i * 120 - 90) * Math.PI / 180;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
  const triDown = Array.from({ length: 3 }, (_, i) => {
    const angle = (i * 120 + 90) * Math.PI / 180;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
  return (
    <g>
      <polygon points={triUp} fill="none" stroke={color} strokeWidth="1.2" opacity={0.7}>
        {animate && <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="50s" repeatCount="indefinite" />}
      </polygon>
      <polygon points={triDown} fill="none" stroke={secondary} strokeWidth="1" opacity={0.5}>
        {animate && <animateTransform attributeName="transform" type="rotate" from="360 32 32" to="0 32 32" dur="45s" repeatCount="indefinite" />}
      </polygon>
    </g>
  );
}

function ConcentricCircles({ color, secondary, animate }: { color: string; secondary: string; animate?: boolean }) {
  const cx = 32, cy = 32;
  const radii = [8, 14, 20, 26];
  return (
    <g>
      {radii.map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={i % 2 === 0 ? color : secondary} strokeWidth={i === 0 ? "1.2" : "0.8"} opacity={0.7 - i * 0.1}>
          {animate && <animate attributeName="r" values={`${r};${r + 1.5};${r}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />}
          {animate && <animate attributeName="opacity" values={`${0.7 - i * 0.1};${0.4 - i * 0.05};${0.7 - i * 0.1}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />}
        </circle>
      ))}
    </g>
  );
}

export default function TypeAuraIcon({ type, size = 48, className = "", animate = false }: TypeAuraIconProps) {
  const normalized = normalizeType(type);
  const colors = TYPE_COLORS[normalized] || TYPE_COLORS.Generator;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={{ overflow: "visible" }}>
      {normalized === "Generator" && <FlowerOfLife color={colors.primary} secondary={colors.secondary} animate={animate} />}
      {normalized === "Manifesting Generator" && <FlowerOfLifeWithSpikes color={colors.primary} secondary={colors.secondary} animate={animate} />}
      {normalized === "Projector" && <Octagon color={colors.primary} secondary={colors.secondary} animate={animate} />}
      {normalized === "Manifestor" && <Merkaba color={colors.primary} secondary={colors.secondary} animate={animate} />}
      {normalized === "Reflector" && <ConcentricCircles color={colors.primary} secondary={colors.secondary} animate={animate} />}
    </svg>
  );
}

export { TYPE_COLORS, normalizeType };
