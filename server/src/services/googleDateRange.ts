export type DateRange = { startDate: string; endDate: string };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(value: unknown, field: 'startDate' | 'endDate'): Date {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`Invalid ${field}: expected YYYY-MM-DD`);
  }
  const [, year, month, day] = DATE_PATTERN.exec(value)!;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) {
    throw new Error(`Invalid ${field}: date does not exist`);
  }
  return date;
}

export function validateGoogleDateRange(range: DateRange): DateRange {
  const start = parseDate(range.startDate, 'startDate');
  const end = parseDate(range.endDate, 'endDate');
  if (start > end) throw new Error('Invalid date range: startDate must not be after endDate');
  return range;
}

export function resolveGoogleDateRange(query: { startDate?: unknown; endDate?: unknown; days?: unknown }): DateRange {
  const hasStart = query.startDate !== undefined;
  const hasEnd = query.endDate !== undefined;

  if (hasStart || hasEnd) {
    if (!hasStart) throw new Error('Invalid startDate: value is required when endDate is supplied');
    if (!hasEnd) throw new Error('Invalid endDate: value is required when startDate is supplied');
    const startDate = String(query.startDate);
    const endDate = String(query.endDate);
    validateGoogleDateRange({ startDate, endDate });
    return { startDate, endDate };
  }

  const rawDays = query.days === undefined || query.days === '' ? 28 : Number(query.days);
  if (!Number.isInteger(rawDays) || rawDays < 1 || rawDays > 90) {
    throw new Error('Invalid days: expected an integer from 1 to 90');
  }
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - rawDays + 1);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}