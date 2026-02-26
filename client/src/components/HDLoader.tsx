/**
 * Thematic Human Design loading animation.
 * Features a rotating Bodygraph mandala with 9 centers,
 * connecting channels, and pulsing sacred geometry.
 */

export default function HDLoader({ text = "Načítání..." }: { text?: string }) {
  const cx = 100, cy = 100;

  // Simplified center positions for the loader mandala
  const centers = [
    { x: cx, y: 30, label: "Hlava" },       // Head
    { x: cx, y: 52, label: "Ajna" },        // Ajna
    { x: cx, y: 76, label: "Hrdlo" },       // Throat
    { x: cx, y: 106, label: "G" },          // G
    { x: 72, y: 98, label: "Srdce" },       // Heart
    { x: cx, y: 136, label: "Sakrální" },   // Sacral
    { x: 130, y: 124, label: "Sol.P." },    // Solar Plexus
    { x: 70, y: 124, label: "Slezina" },    // Spleen
    { x: cx, y: 166, label: "Kořen" },      // Root
  ];

  // Channel connections (from, to indices)
  const channels = [
    [0, 1], [1, 2], [2, 3], [2, 4], [2, 6], [2, 7],
    [3, 4], [3, 5], [3, 7], [4, 7],
    [5, 6], [5, 7], [5, 8], [6, 8], [7, 8],
  ];

  // Outer mandala ring points (64 gates)
  const gateRingR = 92;
  const gatePoints = Array.from({ length: 64 }, (_, i) => {
    const angle = (i * 360 / 64 - 90) * Math.PI / 180;
    return { x: cx + gateRingR * Math.cos(angle), y: cy + gateRingR * Math.sin(angle) };
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <div className="relative" style={{ width: 240, height: 240 }}>
        <svg viewBox="0 0 200 200" width={240} height={240} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7B5EA7" />
              <stop offset="50%" stopColor="#C8A050" />
              <stop offset="100%" stopColor="#2D8B70" />
            </linearGradient>
            <filter id="loaderGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer rotating gate ring */}
          <g opacity={0.2}>
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="120s" repeatCount="indefinite" />
            {gatePoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={1.2} fill="#7B5EA7" opacity={0.6}>
                <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2 + (i % 8) * 0.5}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>

          {/* Middle rotating sacred geometry ring */}
          <g opacity={0.15}>
            <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="80s" repeatCount="indefinite" />
            {/* Hexagram */}
            <polygon
              points={Array.from({ length: 6 }, (_, i) => {
                const a = (i * 60 - 30) * Math.PI / 180;
                return `${cx + 75 * Math.cos(a)},${cy + 75 * Math.sin(a)}`;
              }).join(" ")}
              fill="none" stroke="#C8A050" strokeWidth="0.6"
            />
            <polygon
              points={Array.from({ length: 6 }, (_, i) => {
                const a = (i * 60) * Math.PI / 180;
                return `${cx + 75 * Math.cos(a)},${cy + 75 * Math.sin(a)}`;
              }).join(" ")}
              fill="none" stroke="#C8A050" strokeWidth="0.6"
            />
          </g>

          {/* Channels (connecting lines) */}
          {channels.map(([from, to], i) => (
            <line
              key={`ch${i}`}
              x1={centers[from].x} y1={centers[from].y}
              x2={centers[to].x} y2={centers[to].y}
              stroke="url(#loaderGrad)" strokeWidth="1.2" opacity={0.25}
            >
              <animate attributeName="opacity" values="0.1;0.4;0.1" dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
            </line>
          ))}

          {/* Centers */}
          {centers.map((c, i) => (
            <g key={i}>
              {/* Pulse ring */}
              <circle cx={c.x} cy={c.y} r={8} fill="none" stroke="#7B5EA7" strokeWidth="0.5" opacity={0.3}>
                <animate attributeName="r" values="8;12;8" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
              {/* Center dot */}
              <circle cx={c.x} cy={c.y} r={5} fill="none" stroke="url(#loaderGrad)" strokeWidth="1.5" opacity={0.6}>
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={c.x} cy={c.y} r={2} fill="#7B5EA7" opacity={0.5}>
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          {/* Central spinning element */}
          <g filter="url(#loaderGlow)">
            <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="8s" repeatCount="indefinite" />
            <circle cx={cx} cy={cy} r={18} fill="none" stroke="url(#loaderGrad)" strokeWidth="1.5" strokeDasharray="8 4" opacity={0.5} />
          </g>

          {/* Outer circle border */}
          <circle cx={cx} cy={cy} r={95} fill="none" stroke="#7B5EA7" strokeWidth="0.5" opacity={0.15}>
            <animate attributeName="r" values="93;97;93" dur="4s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-foreground/70 font-serif text-xl tracking-wide">{text}</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/50"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
