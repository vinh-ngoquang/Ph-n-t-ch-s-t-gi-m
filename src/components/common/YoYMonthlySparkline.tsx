import React, { useState } from 'react';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';

export interface YoYMonthlyPoint {
  monthNum: number;
  monthLabel: string; // e.g. "T1", "T2", ... "T8"
  val2026: number;
  val2025: number;
}

interface YoYMonthlySparklineProps {
  data: YoYMonthlyPoint[];
  width?: number;
  height?: number;
  isPercent?: boolean;
  unit?: string;
}

export const YoYMonthlySparkline: React.FC<YoYMonthlySparklineProps> = ({
  data,
  width = 150,
  height = 36,
  isPercent = false,
  unit = 'PV',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <span className="text-slate-300 text-xs">-</span>;
  }

  // Calculate scales
  const padX = 8;
  const padY = 5;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  // Find min and max across all values
  const allVals: number[] = [];
  data.forEach((d) => {
    allVals.push(d.val2026 || 0);
    allVals.push(d.val2025 || 0);
  });

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const minVal = Math.max(0, rawMin - (rawMax - rawMin) * 0.05);
  const maxVal = rawMax === minVal ? maxValOrOne(rawMax) : rawMax + (rawMax - rawMin) * 0.08;

  function maxValOrOne(v: number) {
    return v === 0 ? 1 : v * 1.1;
  }

  const getX = (idx: number) => {
    if (data.length <= 1) return padX + innerW / 2;
    return padX + (idx / (data.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    const normalized = (val - minVal) / range;
    return padY + (1 - normalized) * innerH;
  };

  // Generate path for 2025 (Reference line)
  const path2025 = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.val2025).toFixed(1)}`)
    .join(' ');

  // Compute summary count of winning months
  const gainMonths = data.filter((d) => d.val2026 >= d.val2025).length;
  const dropMonths = data.length - gainMonths;

  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="relative inline-flex items-center group/spark">
      <svg
        width={width}
        height={height}
        className="overflow-visible select-none cursor-pointer"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Background baseline reference line */}
        <line
          x1={padX}
          y1={height - 2}
          x2={width - padX}
          y2={height - 2}
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* 2025 Line: Slate dashed reference line */}
        <path
          d={path2025}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="3 2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2025 subtle month dots */}
        {data.map((d, i) => (
          <circle
            key={`25-${i}`}
            cx={getX(i)}
            cy={getY(d.val2025)}
            r={hoveredIdx === i ? 2.5 : 1.5}
            fill="#94a3b8"
          />
        ))}

        {/* Vertical diff indicator lines when hovered */}
        {hoveredIdx !== null && (
          <line
            x1={getX(hoveredIdx)}
            y1={getY(data[hoveredIdx].val2025)}
            x2={getX(hoveredIdx)}
            y2={getY(data[hoveredIdx].val2026)}
            stroke={data[hoveredIdx].val2026 >= data[hoveredIdx].val2025 ? '#10b981' : '#f43f5e'}
            strokeWidth="1.5"
            strokeDasharray="2 1"
          />
        )}

        {/* 2026 Line Segments: colored per month performance */}
        {data.map((d, i) => {
          if (i === 0) return null;
          const prev = data[i - 1];
          const x1 = getX(i - 1);
          const y1 = getY(prev.val2026);
          const x2 = getX(i);
          const y2 = getY(d.val2026);
          const isBetter = d.val2026 >= d.val2025;
          const strokeColor = isBetter ? '#10b981' : '#f43f5e';

          return (
            <line
              key={`seg-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          );
        })}

        {/* 2026 Month Points / Dots: Green if >= 2025, Red if < 2025 */}
        {data.map((d, i) => {
          const isBetter = d.val2026 >= d.val2025;
          const dotColor = isBetter ? '#10b981' : '#f43f5e';
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={`dot-${i}`}
              onMouseEnter={() => setHoveredIdx(i)}
              className="cursor-pointer"
            >
              {/* Invisible larger hit area for smooth hover */}
              <circle cx={getX(i)} cy={getY(d.val2026)} r={8} fill="transparent" />

              {/* Outer ring on hover */}
              {isHovered && (
                <circle
                  cx={getX(i)}
                  cy={getY(d.val2026)}
                  r={5}
                  fill="none"
                  stroke={dotColor}
                  strokeWidth="1.5"
                  opacity={0.5}
                />
              )}

              {/* Main dot */}
              <circle
                cx={getX(i)}
                cy={getY(d.val2026)}
                r={isHovered ? 3.5 : 2.5}
                fill={dotColor}
                stroke="#ffffff"
                strokeWidth={1}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Interactive Tooltip */}
      {hoveredItem && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl border border-slate-700/80 -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap min-w-[120px] transition-all"
        >
          <div className="font-bold border-b border-slate-700/70 pb-0.5 mb-1 flex items-center justify-between gap-2">
            <span>Tháng {hoveredItem.monthNum}</span>
            <span
              className={`px-1 py-0.2 rounded text-[9px] font-extrabold ${
                hoveredItem.val2026 >= hoveredItem.val2025
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {hoveredItem.val2026 >= hoveredItem.val2025 ? '▲ Tăng YoY' : '▼ Giảm YoY'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[9.5px]">
            <span className="text-slate-400">2026:</span>
            <span
              className={`text-right font-bold ${
                hoveredItem.val2026 >= hoveredItem.val2025 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPercent ? `${hoveredItem.val2026.toFixed(1)}%` : formatNumber(hoveredItem.val2026)}
            </span>

            <span className="text-slate-400">2025:</span>
            <span className="text-right text-slate-300">
              {isPercent ? `${hoveredItem.val2025.toFixed(1)}%` : formatNumber(hoveredItem.val2025)}
            </span>

            <span className="text-slate-400">Lệch:</span>
            <span
              className={`text-right font-bold ${
                hoveredItem.val2026 >= hoveredItem.val2025 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPercent
                ? `${hoveredItem.val2026 - hoveredItem.val2025 >= 0 ? '+' : ''}${(
                    hoveredItem.val2026 - hoveredItem.val2025
                  ).toFixed(1)}%`
                : formatDelta(hoveredItem.val2026 - hoveredItem.val2025)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
