const PERIOD_SECONDS = {
  second: 1,
  minute: 60,
  hour: 3_600,
  day: 86_400,
  year: 31_557_600,
};

const plural = (count, label) => `${count} ${label}${count === 1 ? '' : 's'}`;

export function formatDuration(totalSeconds) {
  let remaining = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(remaining / 86_400);
  remaining -= days * 86_400;
  const hours = Math.floor(remaining / 3_600);
  remaining -= hours * 3_600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining - minutes * 60;

  if (days) return `${plural(days, 'day')}, ${plural(hours, 'hour')}`;
  if (hours) return `${plural(hours, 'hour')}, ${plural(minutes, 'minute')}`;
  if (minutes) return `${plural(minutes, 'minute')}, ${plural(seconds, 'second')}`;
  return plural(seconds, 'second');
}

export function valueForElapsed({ rate, period }, elapsedSeconds) {
  const periodSeconds = PERIOD_SECONDS[period];
  if (!periodSeconds) throw new Error(`Unknown fact period: ${period}`);
  return rate * (Math.max(0, elapsedSeconds) / periodSeconds);
}

export function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
}

export function chooseFact(facts, activeIds, random = Math.random) {
  const available = facts.filter(({ id }) => !activeIds.has(id));
  if (available.length === 0) return null;
  return available[Math.min(available.length - 1, Math.floor(random() * available.length))];
}
