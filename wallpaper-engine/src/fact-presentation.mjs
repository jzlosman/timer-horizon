export const FACT_VALUE_SLOT_CHARS = 6;

export function valueSlotWidth() {
  return FACT_VALUE_SLOT_CHARS;
}

export function factExplainer({ label }) {
  return label;
}

export function factUnit({ unit }) {
  return unit;
}

export function valueUpdateInterval(seed) {
  return 3_000 + Math.floor(seed * 2_000);
}

export function formatFactValue({ decimalPlaces }, value) {
  const magnitude = Math.abs(value);
  if (magnitude >= 1e15) return value.toExponential(2).replace('e+', 'e');

  const compact = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']].find(([threshold]) => magnitude >= threshold);
  if (compact) {
    const [threshold, suffix] = compact;
    const scaled = value / threshold;
    const maximumFractionDigits = Math.abs(scaled) < 10 ? 2 : Math.abs(scaled) < 100 ? 1 : 0;
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(scaled)} ${suffix}`;
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Math.min(decimalPlaces, 2),
  }).format(value);
}
