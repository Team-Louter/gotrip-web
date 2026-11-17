export function passwordTypeCount(value) {
  return [/[a-z]/, /[A-Z]/, /\d/, /[\W_]/].filter((pattern) => pattern.test(value)).length;
}

export function isValidSignupPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 20 && passwordTypeCount(value) >= 3 && !/(.)\1\1/.test(value);
}

export function isValidSignupBirthDate(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().replace(/[-/]/g, '');
  if (!/^\d{8}$/.test(normalized)) return false;
  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidSignupEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
