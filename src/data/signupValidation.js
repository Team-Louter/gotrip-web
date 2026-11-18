export function passwordTypeCount(value) {
  return [/[a-z]/, /[A-Z]/, /\d/, /[\W_]/].filter((pattern) => pattern.test(value)).length;
}

export function signupPasswordRules(value) {
  const password = typeof value === 'string' ? value : '';
  return [
    { label: '8자 이상, 20자 이하', valid: password.length >= 8 && password.length <= 20 },
    { label: '대문자·소문자·숫자·특수문자 중 3종 이상', valid: passwordTypeCount(password) >= 3 },
    { label: '3자 이상 동일 문자/숫자 연속 사용 금지', valid: !/(.)\1\1/.test(password) },
  ];
}

export function signupPasswordError(value) {
  return signupPasswordRules(value).filter((rule) => !rule.valid).map((rule) => rule.label).join('\n');
}

export function isValidSignupPassword(value) {
  return signupPasswordRules(value).every((rule) => rule.valid);
}

export function signupBirthDateError(value) {
  const invalidDate = '실제 날짜를 YYYYMMDD 형식으로 입력해주세요.';
  if (typeof value !== 'string') return invalidDate;
  const normalized = value.trim().replace(/[-/]/g, '');
  if (!/^\d{8}$/.test(normalized)) return invalidDate;
  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return invalidDate;
  }
  const today = new Date();
  const todayStart = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return date.getTime() >= todayStart ? '알맞은 수를 넣어주세요' : '';
}

export function isValidSignupBirthDate(value) {
  return !signupBirthDateError(value);
}

export function isValidSignupEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
