type ProgressBarProps = {
  value: number;
};

export default function ProgressBar({ value }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div
      className="elegance-progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
    >
      <div className="elegance-progress-bar" style={{ width: `${v}%` }} />
    </div>
  );
}
