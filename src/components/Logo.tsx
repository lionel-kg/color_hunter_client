interface Props {
  size?: number;
  color?: string;
}

export function Logo({ size = 18, color = 'currentColor' }: Props) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="9" r="6" fill="currentColor" opacity="0.85" />
        <circle cx="15" cy="15" r="6" fill="currentColor" opacity="0.5" />
      </svg>
      <span className="ch-serif" style={{ fontSize: size + 2, lineHeight: 1, letterSpacing: '-0.02em' }}>
        Color Hunt
      </span>
    </span>
  );
}
