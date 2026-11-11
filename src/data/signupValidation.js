export function passwordTypeCount(value) {
  return [/[a-z]/, /[A-Z]/, /\d/, /[\W_]/].filter((pattern) => pattern.test(value)).length;
}

export function isValidSignupPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 20 && passwordTypeCount(value) >= 3 && !/(.)\1\1/.test(value);
}
