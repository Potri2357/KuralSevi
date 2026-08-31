'use client';

import React, { useState, useRef, useId, useMemo } from 'react';

export interface DataPoint {
  value: number;
  label: string;
}

export interface MotionGraphProps {
  data: number[] | DataPoint[];
  accent?: 'chakra' | 'saffron' | 'green' | 'rose' | 'amber' | 'neutral';
  height?: number;
  className?: string;
  unit?: string;
  showHoverCard?: boolean;
}

const ACCENT_STYLES = {
  chakra: {
    stroke: '#0B3064',
    strokeGlow: 'rgba(11, 48, 100, 0.4)',
    gradientFrom: 'rgba(11, 48, 100, 0.24)',
    gradientTo: 'rgba(11, 48, 100, 0.0)',
    dot: '#0B3064',
    dotRing: 'rgba(11, 48, 100, 0.25)',
    tooltipBg: 'bg-[#0B3064] text-white',
    scanLine: 'stroke-[#0B3064]/40',
  },
  saffron: {
    stroke: '#E05A1B',
    strokeGlow: 'rgba(224, 90, 27, 0.4)',
    gradientFrom: 'rgba(224, 90, 27, 0.24)',
    gradientTo: 'rgba(224, 90, 27, 0.0)',
    dot: '#E05A1B',
    dotRing: 'rgba(224, 90, 27, 0.25)',
    tooltipBg: 'bg-[#C24810] text-white',
    scanLine: 'stroke-[#E05A1B]/40',
  },
  green: {
    stroke: '#0A783C',
    strokeGlow: 'rgba(10, 120, 60, 0.4)',
    gradientFrom: 'rgba(10, 120, 60, 0.24)',
    gradientTo: 'rgba(10, 120, 60, 0.0)',
    dot: '#0A783C',
    dotRing: 'rgba(10, 120, 60, 0.25)',
    tooltipBg: 'bg-[#0A783C] text-white',
    scanLine: 'stroke-[#0A783C]/40',
  },
  rose: {
    stroke: '#E11D48',
    strokeGlow: 'rgba(225, 29, 72, 0.4)',
    gradientFrom: 'rgba(225, 29, 72, 0.24)',
    gradientTo: 'rgba(225, 29, 72, 0.0)',
    dot: '#E11D48',
    dotRing: 'rgba(225, 29, 72, 0.25)',
    tooltipBg: 'bg-[#BE123C] text-white',
    scanLine: 'stroke-[#E11D48]/40',
  },
  amber: {
    stroke: '#D97706',
    strokeGlow: 'rgba(217, 119, 6, 0.4)',
    gradientFrom: 'rgba(217, 119, 6, 0.24)',
    gradientTo: 'rgba(217, 119, 6, 0.0)',
    dot: '#D97706',
    dotRing: 'rgba(217, 119, 6, 0.25)',
    tooltipBg: 'bg-[#B45309] text-white',
    scanLine: 'stroke-[#D97706]/40',
  },
  neutral: {
    stroke: '#475569',
    strokeGlow: 'rgba(71, 85, 105, 0.4)',
    gradientFrom: 'rgba(71, 85, 105, 0.20)',
    gradientTo: 'rgba(71, 85, 105, 0.0)',
    dot: '#475569',
    dotRing: 'rgba(71, 85, 105, 0.25)',
    tooltipBg: 'bg-[#334155] text-white',
    scanLine: 'stroke-[#475569]/40',
  },
};

/**
 * Calculates a smooth cubic bezier SVG path across normalized coordinate points.
 */
function buildCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const prev = points[i - 1] || current;
    const nextNext = points[i + 2] || next;

    // Catmull-Rom to Cubic Bezier control points
    const cp1x = current.x + (next.x - prev.x) / 6;
    const cp1y = current.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (nextNext.x - current.x) / 6;
    const cp2y = next.y - (nextNext.y - current.y) / 6;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
  }

  return d;
}

export function MotionGraph({
  data,
  accent = 'chakra',
  height = 54,
  className = '',
  unit = '',
  showHoverCard = true,
}: MotionGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphId = useId().replace(/:/g, '');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Normalize points format
  const pointsData: DataPoint[] = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        { value: 10, label: 'D-6' },
        { value: 15, label: 'D-5' },
        { value: 12, label: 'D-4' },
        { value: 18, label: 'D-3' },
        { value: 16, label: 'D-2' },
        { value: 20, label: 'D-1' },
        { value: 24, label: 'Today' },
      ];
    }
    return data.map((item, idx) => {
      if (typeof item === 'number') {
        const labels = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
        return {
          value: item,
          label: labels[idx] || `Pt ${idx + 1}`,
        };
      }
      return item;
    });
  }, [data]);

  const style = ACCENT_STYLES[accent] || ACCENT_STYLES.chakra;

  // ViewBox coordinate system
  const VIEW_WIDTH = 260;
  const VIEW_HEIGHT = height;
  const PADDING_TOP = 8;
  const PADDING_BOTTOM = 8;

  // Compute coordinate geometry
  const geometry = useMemo(() => {
    const values = pointsData.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const availableHeight = VIEW_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const coords = pointsData.map((pt, index) => {
      const x = (index / (pointsData.length - 1)) * VIEW_WIDTH;
      // Invert Y for SVG coordinates
      const y = PADDING_TOP + availableHeight - ((pt.value - minVal) / range) * availableHeight;
      return { x, y, data: pt };
    });

    const linePath = buildCurvedPath(coords);
    const lastCoord = coords[coords.length - 1];
    const firstCoord = coords[0];

    // Close path along bottom edge for gradient area fill
    const areaPath = `${linePath} L ${lastCoord.x},${VIEW_HEIGHT} L ${firstCoord.x},${VIEW_HEIGHT} Z`;

    return { coords, linePath, areaPath, lastCoord };
  }, [pointsData, VIEW_HEIGHT]);

  // Active point when hovering, or default to the latest point
  const activeCoord = hoverIndex !== null ? geometry.coords[hoverIndex] : geometry.lastCoord;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const clampedRatio = Math.max(0, Math.min(1, relativeX / rect.width));
    const targetIndex = Math.round(clampedRatio * (pointsData.length - 1));
    setHoverIndex(targetIndex);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full overflow-hidden select-none cursor-crosshair group/graph ${className}`}
      style={{ height }}
      aria-label="Interactive telemetry motion sparkline"
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-full block overflow-visible"
      >
        <defs>
          {/* Vertical Area Gradient Fill */}
          <linearGradient id={`area-grad-${graphId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={style.gradientFrom} />
            <stop offset="100%" stopColor={style.gradientTo} />
          </linearGradient>

          {/* Continuous Wave Shimmer traveling across the stroke */}
          <linearGradient id={`shimmer-stroke-${graphId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={style.stroke} stopOpacity="0.75" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95">
              <animate
                attributeName="offset"
                values="-0.2; 1.2"
                dur="2.8s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={style.stroke} stopOpacity="0.75" />
          </linearGradient>

          {/* Glow filter strictly inside SVG */}
          <filter id={`glow-${graphId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor={style.strokeGlow} />
          </filter>
        </defs>

        {/* Dynamic Area Fill with subtle pulse animation */}
        <path
          d={geometry.areaPath}
          fill={`url(#area-grad-${graphId})`}
          className="transition-all duration-300"
        />

        {/* Ambient background baseline curve */}
        <path
          d={geometry.linePath}
          fill="none"
          stroke={style.stroke}
          strokeWidth="1.5"
          strokeOpacity="0.28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Foreground animated shimmering telemetry path */}
        <path
          d={geometry.linePath}
          fill="none"
          stroke={`url(#shimmer-stroke-${graphId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${graphId})`}
        />

        {/* Interactive Scrubbing Guideline (Visible strictly within graph bounds) */}
        {hoverIndex !== null && (
          <line
            x1={activeCoord.x}
            y1={0}
            x2={activeCoord.x}
            y2={VIEW_HEIGHT}
            strokeWidth="1"
            strokeDasharray="2 2"
            className={`${style.scanLine} transition-all duration-75`}
          />
        )}

        {/* Live / Interactive Pulsing Dot */}
        <g transform={`translate(${activeCoord.x}, ${activeCoord.y})`}>
          {/* Animated radar sonar ripple */}
          <circle r="6" fill={style.dotRing} className="animate-ping opacity-60" />
          {/* Outer halo */}
          <circle r="4" fill="white" stroke={style.stroke} strokeWidth="2" />
          {/* Center core */}
          <circle r="2" fill={style.dot} />
        </g>
      </svg>

      {/* Internal Floating HUD Badge Tooltip (Positioned strictly inside graph) */}
      {showHoverCard && (
        <div
          className={`absolute top-1 pointer-events-none transition-all duration-150 transform -translate-x-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-xs z-10 ${style.tooltipBg}`}
          style={{
            // Keep tooltip safely within [16px, calc(100% - 16px)] of the container width
            left: `${Math.max(16, Math.min(84, (activeCoord.x / VIEW_WIDTH) * 100))}%`,
            opacity: hoverIndex !== null ? 1 : 0,
            transform: hoverIndex !== null ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, -4px) scale(0.95)',
          }}
        >
          <span className="opacity-80 font-normal">{activeCoord.data.label}:</span>
          <span>
            {activeCoord.data.value}
            {unit}
          </span>
        </div>
      )}
    </div>
  );
}

