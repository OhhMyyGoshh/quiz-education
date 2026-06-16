import type { ChartPoint } from "../api/submissionApi";

interface Props {
  data: ChartPoint[];
  color?: string;
  height?: number;
}

export default function Sparkline({
  data,
  color = "hsl(var(--primary))",
  height = 48,
}: Props) {
  if (!data || data.length < 2)
    return (
      <div className="flex items-center justify-center h-12 text-xs text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );

  const W = 300;
  const H = height;
  const pad = 4;
  const vals = data.map((d) => d.count);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const area = `M${pts[0]} L${pts.join(" L")} L${pts[pts.length - 1].split(",")[0]},${H} L${pad},${H} Z`;
  const line = `M${pts[0]} L${pts.join(" L")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
