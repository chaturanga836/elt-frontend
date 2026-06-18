'use client';

/** Dark-neon mark: simple vector O (orchestration ring + nodes). */

const NEON_CYAN = '#00d4ff';
const NEON_ORANGE = '#ff8c00';
const TEXT = '#f0f6fc';

type DtOrchLogoProps = {
  height?: number;
  iconOnly?: boolean;
  /** Light backgrounds (e.g. legacy login card). */
  light?: boolean;
  className?: string;
};

function NeonDefs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-glow-cyan`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${id}-glow-orange`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={NEON_CYAN} />
        <stop offset="55%" stopColor={NEON_CYAN} />
        <stop offset="100%" stopColor={NEON_ORANGE} />
      </linearGradient>
    </defs>
  );
}

/** Letter O as a simple orchestration ring: circle + three nodes. */
function OrchMark({
  id,
  light,
  size = 48,
}: {
  id: string;
  light?: boolean;
  size?: number;
}) {
  const ring = light ? '#1677ff' : `url(#${id}-ring)`;
  const nodeA = light ? '#1677ff' : NEON_CYAN;
  const nodeB = light ? '#1677ff' : NEON_ORANGE;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.29;

  return (
    <g aria-hidden>
      <NeonDefs id={id} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={ring}
        strokeWidth={size * 0.052}
        filter={light ? undefined : `url(#${id}-glow-cyan)`}
      />
      <circle
        cx={cx}
        cy={cy - r}
        r={size * 0.065}
        fill={nodeA}
        filter={light ? undefined : `url(#${id}-glow-cyan)`}
      />
      <circle
        cx={cx + r * 0.866}
        cy={cy + r * 0.5}
        r={size * 0.055}
        fill={nodeB}
        filter={light ? undefined : `url(#${id}-glow-orange)`}
      />
      <circle
        cx={cx - r * 0.866}
        cy={cy + r * 0.5}
        r={size * 0.055}
        fill={nodeA}
        filter={light ? undefined : `url(#${id}-glow-cyan)`}
      />
    </g>
  );
}

export default function DtOrchLogo({
  height = 32,
  iconOnly = false,
  light = false,
  className,
}: DtOrchLogoProps) {
  const filterId = light ? 'dt-orch-light' : 'dt-orch-dark';
  const textColor = light ? '#141414' : TEXT;

  if (iconOnly) {
    return (
      <svg
        className={className}
        width={height}
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="DT Orch"
      >
        <OrchMark id={filterId} light={light} size={48} />
      </svg>
    );
  }

  const width = Math.round(height * 3.35);

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 167 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="DT Orch"
    >
      <OrchMark id={filterId} light={light} size={48} />
      <text
        x="56"
        y="31"
        fill={textColor}
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        DT Orch
      </text>
    </svg>
  );
}
