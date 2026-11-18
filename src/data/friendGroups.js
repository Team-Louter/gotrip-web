import { getAccountId, getLoginId } from '../api/session.js';

export function friendGroupsStorageKey() {
  return `gotrip.friendGroups.${getAccountId() ?? getLoginId() ?? 'account'}`;
}

export function readFriendGroups() {
  try {
    const groups = JSON.parse(localStorage.getItem(friendGroupsStorageKey()) || '[]');
    return Array.isArray(groups)
      ? groups.filter((group) => group && typeof group.name === 'string' && Array.isArray(group.friendIds))
      : [];
  } catch {
    return [];
  }
}
