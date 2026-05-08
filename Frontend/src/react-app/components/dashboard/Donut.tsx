type DonutProps = {
  value: number;
  size?: number;
  colors?: {
    fill?: string;
    bg?: string;
  };
};

export default function Donut({ value, size = 160, colors }: DonutProps) {
  const v = Math.max(0, Math.min(100, value || 0));
  const fill = (colors && colors.fill) || "var(--primary)";
  const bg = (colors && colors.bg) || "#f0ecec";
  const ring = `conic-gradient(${fill} ${v * 3.6}deg, ${bg} 0)`;
  const s = { width: size, height: size, background: ring };
  return (
    <div className="elegance-donut" style={s}>
      <div className="center">
        <div className="value">{v}%</div>
        <div className="label">Used</div>
      </div>
    </div>
  );
}
