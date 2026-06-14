export function formatValue(value, indicatorKey) {
  if (value === null || value === undefined) return 'N/A';

  if (indicatorKey === 'gdp') {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (Math.abs(value) >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`;
    if (Math.abs(value) >= 1e6)  return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  }

  if (indicatorKey === 'population') {
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
  }

  return `${value.toFixed(1)}%`;
}

export function formatAxisTick(value, indicatorKey) {
  if (indicatorKey === 'gdp') {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(0)}T`;
    if (Math.abs(value) >= 1e9)  return `$${(value / 1e9).toFixed(0)}B`;
    if (Math.abs(value) >= 1e6)  return `$${(value / 1e6).toFixed(0)}M`;
    return `$${value}`;
  }
  if (indicatorKey === 'population') {
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
    return `${(value / 1e3).toFixed(0)}K`;
  }
  return `${value.toFixed(1)}%`;
}
