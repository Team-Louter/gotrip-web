const DRAFT_KEY = 'gotrip.signup.draft.v1';

export function readSignupDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
  } catch {
    return {};
  }
}

export function updateSignupDraft(values) {
  const next = { ...readSignupDraft(), ...values };
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  return next;
}

export function clearSignupDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
