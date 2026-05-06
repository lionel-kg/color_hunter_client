import type { ColorPalette } from "../types/api";

// index 0 = 0°, chaque segment = 30°
const SEGMENTS: { hex: string; palette: ColorPalette }[] = [
  { hex: "#FF3B3B", palette: "PRIMARY"   }, // 0°   rouge
  { hex: "#FF7A00", palette: "TERTIARY"  }, // 30°  orange
  { hex: "#FFD600", palette: "PRIMARY"   }, // 60°  jaune
  { hex: "#7ED321", palette: "TERTIARY"  }, // 90°  jaune-vert
  { hex: "#2ECC71", palette: "SECONDARY" }, // 120° vert
  { hex: "#00C9A7", palette: "TERTIARY"  }, // 150° vert-cyan
  { hex: "#0088FF", palette: "PRIMARY"   }, // 180° bleu
  { hex: "#3A5BDB", palette: "TERTIARY"  }, // 210° bleu-violet
  { hex: "#7B61FF", palette: "SECONDARY" }, // 240° violet
  { hex: "#A855F7", palette: "TERTIARY"  }, // 270° violet-magenta
  { hex: "#E040FB", palette: "SECONDARY" }, // 300° magenta
  { hex: "#FF2D78", palette: "TERTIARY"  }, // 330° rose-rouge
];

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
    : max === g ? ((b - r) / d + 2) / 6
    :             ((r - g) / d + 4) / 6;
  return h * 360;
}

interface Props {
  size?: number;
  hex?: string;
  label?: string;
  degree?: number;
  spinning?: boolean;
  colorPalettes?: ColorPalette[];
}

export function ColorWheel({
  size = 220,
  hex = "#C99B7E",
  label = "Terracotta",
  degree,
  spinning = false,
  colorPalettes = ["PRIMARY", "SECONDARY", "TERTIARY"],
}: Props) {
  const r = size / 2;
  const ring = Math.round(size * 0.118);
  const hue = degree !== undefined ? degree : hexToHue(hex);
  const markerR = r - ring / 2;
  const rad = ((hue - 90) * Math.PI) / 180;
  const mx = r + markerR * Math.cos(rad);
  const my = r + markerR * Math.sin(rad);

  const segs = SEGMENTS.map((seg, i) => {
    const a0 = ((i * 30 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * 30 - 90) * Math.PI) / 180;
    const x0 = r + r * Math.cos(a0), y0 = r + r * Math.sin(a0);
    const x1 = r + r * Math.cos(a1), y1 = r + r * Math.sin(a1);
    const ix0 = r + (r - ring) * Math.cos(a0), iy0 = r + (r - ring) * Math.sin(a0);
    const ix1 = r + (r - ring) * Math.cos(a1), iy1 = r + (r - ring) * Math.sin(a1);
    const visible = colorPalettes.includes(seg.palette);
    return (
      <path
        key={i}
        d={`M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} L ${ix1} ${iy1} A ${r - ring} ${r - ring} 0 0 0 ${ix0} ${iy0} Z`}
        fill={visible ? seg.hex : "var(--ch-cream-2)"}
        style={{ transition: "fill 0.2s ease" }}
      />
    );
  });

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={spinning ? { animation: "ch-spin 1.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards" } : undefined}
      >
        {segs}
        <circle cx={r} cy={r} r={r - ring} fill="var(--ch-paper)" />
        {!spinning && (
          <>
            <circle cx={mx} cy={my} r={Math.round(size * 0.064) + 2} fill="var(--ch-ivory)" stroke="var(--ch-ink)" strokeWidth="1.5" />
            <circle cx={mx} cy={my} r={Math.round(size * 0.064) - 2} fill={hex} />
          </>
        )}
      </svg>
      {label && !spinning && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div className="ch-eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>{hex}</div>
          <div className="ch-serif" style={{ fontSize: 22, lineHeight: 1 }}>{label}</div>
        </div>
      )}
    </div>
  );
}
