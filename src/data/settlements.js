import { getAccountId, getLoginId } from '../api/session.js';

function storageKey() {
  return `gotrip.settlements.v1.${getAccountId() ?? getLoginId() ?? 'account'}`;
}

export function readSettlements() {
  const stored = JSON.parse(localStorage.getItem(storageKey()) || '{}');
  return {
    participantCount: /^\d+$/.test(stored.participantCount) && Number(stored.participantCount) >= 1 && Number(stored.participantCount) <= 10000
      ? String(stored.participantCount) : '2',
    selectedGroupId: typeof stored.selectedGroupId === 'string' ? stored.selectedGroupId : null,
    entries: stored.entries && typeof stored.entries === 'object' && !Array.isArray(stored.entries)
      ? stored.entries : {},
  };
}

export function savedExpenses(state, key) {
  const expenses = state.entries[key];
  let total = 0;
  return Array.isArray(expenses) ? expenses.filter((expense) => {
    if (!expense || typeof expense.id !== 'string' || typeof expense.name !== 'string'
      || !Number.isSafeInteger(expense.amount) || expense.amount <= 0
      || !Number.isSafeInteger(total + expense.amount)) return false;
    total += expense.amount;
    return true;
  }) : [];
}

export function saveSettlements(patch, key, expenses) {
  const current = readSettlements();
  const next = { ...current, ...patch };
  if (key) next.entries = { ...current.entries, [key]: expenses };
  localStorage.setItem(storageKey(), JSON.stringify(next));
  return next;
}
