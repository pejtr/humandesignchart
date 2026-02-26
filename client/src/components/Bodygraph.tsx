import { useMemo, useState } from "react";
import type { HumanDesignChartData } from "@shared/types";

interface BodygraphProps {
  chart: HumanDesignChartData;
  width?: number;
  height?: number;
  showLabels?: boolean;
  transitGates?: number[];
  interactive?: boolean;
  onGateClick?: (gate: number) => void;
  onCenterClick?: (center: string) => void;
  onChannelClick?: (gate1: number, gate2: number) => void;
}

// Center positions (x, y) in the bodygraph SVG coordinate system
const CENTER_POSITIONS: Record<string, { x: number; y: number; rx: number; ry: number }> = {
  Head:         { x: 250, y: 50,  rx: 36, ry: 30 },
  Ajna:         { x: 250, y: 130, rx: 38, ry: 28 },
  Throat:       { x: 250, y: 220, rx: 40, ry: 30 },
  G:            { x: 250, y: 330, rx: 36, ry: 36 },
  Heart:        { x: 160, y: 310, rx: 28, ry: 24 },
  Sacral:       { x: 250, y: 440, rx: 40, ry: 28 },
  SolarPlexus:  { x: 340, y: 400, rx: 34, ry: 28 },
  Spleen:       { x: 160, y: 400, rx: 34, ry: 28 },
  Root:         { x: 250, y: 540, rx: 40, ry: 30 },
};

// Czech center display names
const CENTER_DISPLAY: Record<string, string> = {
  Head: "Hlava",
  Ajna: "Ajna",
  Throat: "Hrdlo",
  G: "G Centrum",
  Heart: "Srdce",
  Sacral: "Sakrální",
  SolarPlexus: "Sol. Plexus",
  Spleen: "Slezina",
  Root: "Kořen",
};

// Defined center colors per center (unique hues)
const CENTER_DEFINED_COLORS: Record<string, { fill: string; stroke: string }> = {
  Head:         { fill: "oklch(0.65 0.22 300)", stroke: "oklch(0.78 0.18 300)" }, // violet
  Ajna:         { fill: "oklch(0.60 0.20 240)", stroke: "oklch(0.75 0.16 240)" }, // indigo
  Throat:       { fill: "oklch(0.65 0.18 160)", stroke: "oklch(0.78 0.15 160)" }, // teal
  G:            { fill: "oklch(0.68 0.22 80)",  stroke: "oklch(0.80 0.18 80)" },  // amber
  Heart:        { fill: "oklch(0.60 0.24 25)",  stroke: "oklch(0.75 0.20 25)" },  // red
  Sacral:       { fill: "oklch(0.65 0.22 40)",  stroke: "oklch(0.78 0.18 40)" },  // orange
  SolarPlexus:  { fill: "oklch(0.62 0.20 340)", stroke: "oklch(0.76 0.16 340)" }, // magenta
  Spleen:       { fill: "oklch(0.58 0.18 200)", stroke: "oklch(0.72 0.15 200)" }, // blue
  Root:         { fill: "oklch(0.60 0.20 140)", stroke: "oklch(0.75 0.16 140)" }, // green
};

// Channel paths between centers
const CHANNEL_PATHS: Record<string, { from: string; to: string; path: string }> = {
  "64-47": { from: "Head", to: "Ajna", path: "M 232,78 L 232,102" },
  "61-24": { from: "Head", to: "Ajna", path: "M 250,80 L 250,102" },
  "63-4":  { from: "Head", to: "Ajna", path: "M 268,78 L 268,102" },
  "17-62": { from: "Ajna", to: "Throat", path: "M 232,158 L 232,190" },
  "43-23": { from: "Ajna", to: "Throat", path: "M 250,158 L 250,190" },
  "11-56": { from: "Ajna", to: "Throat", path: "M 268,158 L 268,190" },
  "16-48": { from: "Throat", to: "Spleen", path: "M 218,240 C 190,280 170,340 162,372" },
  "20-57": { from: "Throat", to: "Spleen", path: "M 222,248 C 196,290 178,340 168,372" },
  "20-34": { from: "Throat", to: "Sacral", path: "M 240,250 L 240,412" },
  "20-10": { from: "Throat", to: "G", path: "M 244,250 L 244,294" },
  "31-7":  { from: "Throat", to: "G", path: "M 250,250 L 250,294" },
  "33-13": { from: "Throat", to: "G", path: "M 256,250 L 256,294" },
  "8-1":   { from: "Throat", to: "G", path: "M 262,250 L 262,294" },
  "45-21": { from: "Throat", to: "Heart", path: "M 218,236 C 200,260 180,280 168,290" },
  "12-22": { from: "Throat", to: "SolarPlexus", path: "M 282,240 C 310,280 330,340 338,372" },
  "35-36": { from: "Throat", to: "SolarPlexus", path: "M 278,248 C 304,290 322,340 332,372" },
  "10-34": { from: "G", to: "Sacral", path: "M 240,366 L 240,412" },
  "10-57": { from: "G", to: "Spleen", path: "M 220,350 C 200,370 180,380 172,390" },
  "25-51": { from: "G", to: "Heart", path: "M 220,330 C 200,320 185,315 188,310" },
  "15-5":  { from: "G", to: "Sacral", path: "M 244,366 L 244,412" },
  "46-29": { from: "G", to: "Sacral", path: "M 256,366 L 256,412" },
  "2-14":  { from: "G", to: "Sacral", path: "M 250,366 L 250,412" },
  "26-44": { from: "Heart", to: "Spleen", path: "M 160,334 L 160,372" },
  "40-37": { from: "Heart", to: "SolarPlexus", path: "M 188,320 C 240,360 300,380 330,390" },
  "54-32": { from: "Root", to: "Spleen", path: "M 220,516 C 190,480 170,440 164,428" },
  "38-28": { from: "Root", to: "Spleen", path: "M 214,520 C 188,484 172,444 168,428" },
  "58-18": { from: "Root", to: "Spleen", path: "M 208,524 C 186,490 174,450 170,428" },
  "53-42": { from: "Root", to: "Sacral", path: "M 240,510 L 240,468" },
  "60-3":  { from: "Root", to: "Sacral", path: "M 244,510 L 244,468" },
  "52-9":  { from: "Root", to: "Sacral", path: "M 250,510 L 250,468" },
  "19-49": { from: "Root", to: "SolarPlexus", path: "M 280,516 C 310,480 330,440 336,428" },
  "39-55": { from: "Root", to: "SolarPlexus", path: "M 286,520 C 312,484 328,444 332,428" },
  "41-30": { from: "Root", to: "SolarPlexus", path: "M 292,524 C 314,490 326,450 330,428" },
  "59-6":  { from: "Sacral", to: "SolarPlexus", path: "M 282,440 C 300,430 320,420 330,410" },
  "27-50": { from: "Sacral", to: "Spleen", path: "M 218,440 C 200,430 180,420 170,410" },
  "34-57": { from: "Sacral", to: "Spleen", path: "M 224,436 C 204,424 184,414 174,406" },
};

// Gate positions around centers
const GATE_POSITIONS: Record<number, { x: number; y: number }> = {
  // Head
  64: { x: 222, y: 42 }, 61: { x: 250, y: 32 }, 63: { x: 278, y: 42 },
  // Ajna
  47: { x: 222, y: 118 }, 24: { x: 250, y: 112 }, 4: { x: 278, y: 118 },
  17: { x: 222, y: 142 }, 43: { x: 250, y: 148 }, 11: { x: 278, y: 142 },
  // Throat
  62: { x: 218, y: 204 }, 23: { x: 236, y: 200 }, 56: { x: 282, y: 204 },
  16: { x: 208, y: 220 }, 20: { x: 228, y: 236 }, 31: { x: 250, y: 240 },
  33: { x: 264, y: 236 }, 8: { x: 272, y: 220 }, 45: { x: 218, y: 236 },
  12: { x: 282, y: 236 }, 35: { x: 276, y: 244 }, 1: { x: 268, y: 208 },
  // G Center
  7: { x: 234, y: 316 }, 13: { x: 266, y: 316 }, 10: { x: 234, y: 340 },
  25: { x: 230, y: 324 }, 15: { x: 244, y: 350 }, 46: { x: 266, y: 340 },
  2: { x: 250, y: 350 }, 29: { x: 256, y: 350 },
  // Heart
  26: { x: 148, y: 298 }, 21: { x: 172, y: 298 }, 40: { x: 172, y: 322 }, 51: { x: 148, y: 322 },
  // Sacral
  34: { x: 228, y: 430 }, 5: { x: 240, y: 450 }, 14: { x: 250, y: 456 },
  59: { x: 272, y: 430 }, 9: { x: 260, y: 450 }, 3: { x: 244, y: 456 },
  42: { x: 236, y: 456 }, 27: { x: 228, y: 450 },
  // Solar Plexus
  22: { x: 352, y: 386 }, 36: { x: 352, y: 400 }, 37: { x: 352, y: 414 },
  6: { x: 328, y: 386 }, 49: { x: 328, y: 400 }, 55: { x: 328, y: 414 }, 30: { x: 340, y: 420 },
  // Spleen
  48: { x: 148, y: 386 }, 57: { x: 148, y: 400 }, 44: { x: 148, y: 414 },
  50: { x: 172, y: 386 }, 32: { x: 172, y: 400 }, 28: { x: 172, y: 414 }, 18: { x: 160, y: 420 },
  // Root
  54: { x: 222, y: 530 }, 38: { x: 214, y: 544 }, 58: { x: 208, y: 556 },
  53: { x: 236, y: 552 }, 60: { x: 244, y: 556 }, 52: { x: 250, y: 560 },
  19: { x: 278, y: 530 }, 39: { x: 286, y: 544 }, 41: { x: 292, y: 556 },
};

export default function Bodygraph({
  chart,
  width = 500,
  height = 600,
  showLabels = true,
  transitGates = [],
  interactive = true,
  onGateClick,
  onCenterClick,
  onChannelClick,
}: BodygraphProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const activatedGateSet = useMemo(() => new Set(chart.activatedGates || []), [chart.activatedGates]);
  const transitGateSet = useMemo(() => new Set(transitGates), [transitGates]);

  const definedChannelKeys = useMemo(() => {
    return new Set(
      (chart.channels || []).map(ch => {
        const k1 = `${ch.gate1}-${ch.gate2}`;
        const k2 = `${ch.gate2}-${ch.gate1}`;
        return CHANNEL_PATHS[k1] ? k1 : k2;
      })
    );
  }, [chart.channels]);

  const personalityGates = useMemo(
    () => new Set((chart.personalityActivations || []).map(a => a.gate)),
    [chart.personalityActivations]
  );
  const designGates = useMemo(
    () => new Set((chart.designActivations || []).map(a => a.gate)),
    [chart.designActivations]
  );

  function getGateColor(gate: number): string {
    const isPers = personalityGates.has(gate);
    const isDes = designGates.has(gate);
    const isTransit = transitGateSet.has(gate);

    if (isTransit && !activatedGateSet.has(gate)) return "#22d3ee"; // cyan for transit-only
    if (isPers && isDes) return "#f0c040"; // gold for both
    if (isPers) return "#4a3a8a"; // deep purple (personality/conscious)
    if (isDes) return "#dc2626"; // red (design/unconscious)
    return "transparent";
  }

  function getGateStroke(gate: number): string {
    const isPers = personalityGates.has(gate);
    const isDes = designGates.has(gate);
    const isTransit = transitGateSet.has(gate);

    if (isTransit && !activatedGateSet.has(gate)) return "#67e8f9";
    if (isPers && isDes) return "#fcd34d";
    if (isPers) return "#7c5fc7";
    if (isDes) return "#f87171";
    return "transparent";
  }

  function getChannelColor(key: string): string {
    if (!definedChannelKeys.has(key)) return "rgba(100,100,140,0.12)";
    
    const parts = key.split("-").map(Number);
    const g1Pers = personalityGates.has(parts[0]);
    const g1Des = designGates.has(parts[0]);
    const g2Pers = personalityGates.has(parts[1]);
    const g2Des = designGates.has(parts[1]);
    
    if ((g1Pers || g2Pers) && (g1Des || g2Des)) return "url(#channelGradient)";
    if (g1Pers || g2Pers) return "#6d5aad";
    return "#dc2626";
  }

  return (
    <svg
      viewBox="0 0 500 600"
      width={width}
      height={height}
      className="bodygraph-svg"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <defs>
        {/* Gradient for channels with both personality and design */}
        <linearGradient id="channelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d5aad" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        
        {/* Glow filter for defined elements */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Subtle shadow */}
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
        </filter>

        {/* Transit glow */}
        <filter id="transitGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Radial gradient for undefined centers */}
        <radialGradient id="undefinedCenter">
          <stop offset="0%" stopColor="oklch(0.20 0.02 280)" />
          <stop offset="100%" stopColor="oklch(0.14 0.02 280)" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="500" height="600" fill="transparent" />

      {/* Draw channels */}
      {Object.entries(CHANNEL_PATHS).map(([key, { path }]) => {
        const isDefined = definedChannelKeys.has(key);
        const color = getChannelColor(key);
        const isHovered = hoveredElement === `ch-${key}`;
        return (
          <g key={key}>
            {/* Background line always visible */}
            <path
              d={path}
              stroke={isDefined ? "none" : "rgba(100,100,140,0.12)"}
              strokeWidth={isDefined ? 0 : 1.5}
              fill="none"
              strokeDasharray={isDefined ? "none" : "4 4"}
            />
            {isDefined && (
              <>
                {/* Glow behind */}
                <path
                  d={path}
                  stroke={color}
                  strokeWidth={isHovered ? 8 : 6}
                  fill="none"
                  opacity={0.3}
                  filter="url(#glow)"
                />
                {/* Main channel line */}
                <path
                  d={path}
                  stroke={color}
                  strokeWidth={isHovered ? 5 : 3.5}
                  fill="none"
                  strokeLinecap="round"
                  className={interactive ? "cursor-pointer" : ""}
                  onMouseEnter={() => setHoveredElement(`ch-${key}`)}
                  onMouseLeave={() => setHoveredElement(null)}
                  onClick={() => {
                    const parts = key.split("-").map(Number);
                    onChannelClick?.(parts[0], parts[1]);
                  }}
                  style={{ transition: "all 0.2s", opacity: isHovered ? 1 : 0.9 }}
                />
              </>
            )}
          </g>
        );
      })}

      {/* Draw centers */}
      {Object.entries(CENTER_POSITIONS).map(([name, pos]) => {
        const centerData = (chart.centers || []).find(c => c.name === name);
        const isDefined = centerData?.defined || false;
        const isHovered = hoveredElement === `center-${name}`;
        const colors = CENTER_DEFINED_COLORS[name];

        const fillColor = isDefined ? colors.fill : "url(#undefinedCenter)";
        const strokeColor = isDefined ? colors.stroke : "oklch(0.32 0.03 280)";
        const sw = isHovered ? 3 : 1.5;
        const filterVal = isDefined ? "url(#glow)" : "url(#shadow)";

        return (
          <g
            key={name}
            className={interactive ? "cursor-pointer" : ""}
            onMouseEnter={() => setHoveredElement(`center-${name}`)}
            onMouseLeave={() => setHoveredElement(null)}
            onClick={() => onCenterClick?.(name)}
          >
            {/* Center shape */}
            {name === "G" ? (
              <polygon
                points={`${pos.x},${pos.y - pos.ry} ${pos.x + pos.rx},${pos.y} ${pos.x},${pos.y + pos.ry} ${pos.x - pos.rx},${pos.y}`}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={sw}
                filter={filterVal}
                style={{ transition: "all 0.2s" }}
              />
            ) : name === "Heart" ? (
              <polygon
                points={`${pos.x},${pos.y - pos.ry} ${pos.x + pos.rx},${pos.y + pos.ry} ${pos.x - pos.rx},${pos.y + pos.ry}`}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={sw}
                filter={filterVal}
                style={{ transition: "all 0.2s" }}
              />
            ) : name === "Head" ? (
              <polygon
                points={`${pos.x},${pos.y - pos.ry} ${pos.x + pos.rx},${pos.y + pos.ry} ${pos.x - pos.rx},${pos.y + pos.ry}`}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={sw}
                filter={filterVal}
                style={{ transition: "all 0.2s" }}
              />
            ) : (
              <rect
                x={pos.x - pos.rx}
                y={pos.y - pos.ry}
                width={pos.rx * 2}
                height={pos.ry * 2}
                rx={6}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={sw}
                filter={filterVal}
                style={{ transition: "all 0.2s" }}
              />
            )}

            {/* Center label */}
            {showLabels && (
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fill={isDefined ? "white" : "oklch(0.55 0.02 280)"}
                fontSize="9"
                fontFamily="Inter, sans-serif"
                fontWeight={isDefined ? "600" : "400"}
                style={{ pointerEvents: "none" }}
              >
                {CENTER_DISPLAY[name]}
              </text>
            )}
          </g>
        );
      })}

      {/* Draw gate indicators */}
      {Object.entries(GATE_POSITIONS).map(([gateStr, pos]) => {
        const gate = parseInt(gateStr);
        const isActivated = activatedGateSet.has(gate);
        const isTransit = transitGateSet.has(gate);
        const color = getGateColor(gate);
        const stroke = getGateStroke(gate);
        const isHovered = hoveredElement === `gate-${gate}`;

        if (!isActivated && !isTransit) return null;

        return (
          <g
            key={gate}
            className={interactive ? "cursor-pointer" : ""}
            onMouseEnter={() => setHoveredElement(`gate-${gate}`)}
            onMouseLeave={() => setHoveredElement(null)}
            onClick={() => onGateClick?.(gate)}
          >
            {/* Outer glow ring on hover */}
            {isHovered && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={12}
                fill="none"
                stroke={stroke}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isHovered ? 9 : 7}
              fill={color}
              stroke={stroke}
              strokeWidth={1.2}
              filter={isTransit && !isActivated ? "url(#transitGlow)" : undefined}
              style={{ transition: "all 0.15s" }}
            />
            <text
              x={pos.x}
              y={pos.y + 3.5}
              textAnchor="middle"
              fill="white"
              fontSize="7.5"
              fontFamily="Inter, sans-serif"
              fontWeight="700"
              style={{ pointerEvents: "none" }}
            >
              {gate}
            </text>
          </g>
        );
      })}

      {/* Tooltip on hover */}
      {hoveredElement && hoveredElement.startsWith("gate-") && (() => {
        const gate = parseInt(hoveredElement.replace("gate-", ""));
        const pos = GATE_POSITIONS[gate];
        if (!pos) return null;
        const isPers = personalityGates.has(gate);
        const isDes = designGates.has(gate);
        const label = isPers && isDes ? "O+D" : isPers ? "Osobnost" : isDes ? "Design" : "Tranzit";
        return (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={pos.x - 28}
              y={pos.y - 24}
              width={56}
              height={16}
              rx={4}
              fill="oklch(0.15 0.02 280)"
              stroke="oklch(0.35 0.03 280)"
              strokeWidth={0.5}
              opacity={0.95}
            />
            <text
              x={pos.x}
              y={pos.y - 13}
              textAnchor="middle"
              fill="oklch(0.8 0.05 280)"
              fontSize="8"
              fontFamily="Inter, sans-serif"
            >
              Brána {gate} · {label}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
