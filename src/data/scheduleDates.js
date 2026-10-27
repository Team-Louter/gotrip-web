export const TRIP_DURATION = 5;

export function dateKey(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && dateKey(date) === value;
}

export function addDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function formatDate(value, options = { month: 'long', day: 'numeric', weekday: 'short' }) {
  return new Intl.DateTimeFormat('ko-KR', options).format(new Date(`${value}T12:00:00`));
}

export function schedulesOn(events, date) {
  return events.filter((event) => event.date === date).sort((a, b) => a.time.localeCompare(b.time));
}

export function calendarDates(month) {
  const first = `${month}-01`;
  const firstWeekday = new Date(`${first}T12:00:00`).getDay();
  const last = new Date(`${first}T12:00:00`);
  last.setMonth(last.getMonth() + 1, 0);
  const count = Math.ceil((firstWeekday + last.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => addDays(first, index - firstWeekday));
}

export function shiftMonth(month, offset) {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + offset);
  if (date.getFullYear() < 1 || date.getFullYear() > 9999) return month;
  return dateKey(date).slice(0, 7);
}
