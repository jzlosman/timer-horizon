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

export function formatFactValue({ format, decimalPlaces }, value) {
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimalPlaces,
    notation: format === 'compact' ? 'compact' : 'standard',
  });
  const display = formatter.format(value);
  if (display.length <= FACT_VALUE_SLOT_CHARS) return display;

  return new Intl.NumberFormat('en-US', {
    compactDisplay: 'short',
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value);
}
