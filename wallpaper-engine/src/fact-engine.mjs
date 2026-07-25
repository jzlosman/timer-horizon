const PERIOD_SECONDS = {
  second: 1,
  minute: 60,
  hour: 3_600,
  day: 86_400,
  year: 31_557_600,
};

const durationPart = (value, unit) => ({ value, unit: `${unit}${value === 1 ? '' : 's'}` });

export function formatDurationParts(totalSeconds) {
  let remaining = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(remaining / 86_400);
  remaining -= days * 86_400;
  const hours = Math.floor(remaining / 3_600);
  remaining -= hours * 3_600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining - minutes * 60;

  if (days) return [durationPart(days, 'day'), durationPart(hours, 'hour')];
  if (hours) return [durationPart(hours, 'hour'), durationPart(minutes, 'minute')];
  if (minutes) return [durationPart(minutes, 'minute'), durationPart(seconds, 'second')];
  return [durationPart(seconds, 'second')];
}

export function formatDuration(totalSeconds) {
  return formatDurationParts(totalSeconds).map(({ value, unit }) => `${value} ${unit}`).join(', ');
}

function addCalendarMonths(date, months) {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const finalDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, finalDay));
  return next;
}

export function formatCalendarDurationParts(startedAt, now = Date.now()) {
  const start = new Date(startedAt);
  const end = new Date(Math.max(start.getTime(), new Date(now).getTime()));
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (addCalendarMonths(start, months) > end) months -= 1;
  months = Math.max(0, months);

  let cursor = addCalendarMonths(start, months);
  let days = Math.floor((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())) / 86_400_000);
  cursor.setDate(cursor.getDate() + days);
  if (cursor > end) {
    days -= 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  let remaining = Math.floor((end - cursor) / 1_000);
  const hours = Math.floor(remaining / 3_600);
  remaining -= hours * 3_600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining - minutes * 60;
  const parts = [
    [Math.floor(months / 12), 'year'],
    [months % 12, 'month'],
    [days, 'day'],
    [hours, 'hour'],
    [minutes, 'minute'],
    [seconds, 'second'],
  ].filter(([value]) => value);

  return (parts.length ? parts : [[0, 'second']]).slice(0, 2).map(([value, unit]) => durationPart(value, unit));
}

export function formatCalendarDuration(startedAt, now = Date.now()) {
  return formatCalendarDurationParts(startedAt, now).map(({ value, unit }) => `${value} ${unit}`).join(', ');
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
