// Number and percentage formatting utilities

export function formatNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return Math.round(val).toLocaleString('vi-VN');
}

export function formatCompactNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(2) + ' tỷ';
  }
  if (abs >= 1_000_000) {
    return (val / 1_000_000).toFixed(1) + 'M';
  }
  if (abs >= 1_000) {
    return (val / 1_000).toFixed(0) + 'k';
  }
  return Math.round(val).toLocaleString('vi-VN');
}

export function formatPercent(val: number | undefined | null, showSign = true): string {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  const prefix = showSign && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(1)}%`;
}

export function formatDelta(val: number | undefined | null, compact = true): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const prefix = val > 0 ? '+' : '';
  return compact ? `${prefix}${formatCompactNumber(val)}` : `${prefix}${formatNumber(val)}`;
}
