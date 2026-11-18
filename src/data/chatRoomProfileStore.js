import { getAccountId, getLoginId } from '../api/session.js';

const STORAGE_PREFIX = 'gotrip.chat.room-profile.v1';

function storageKey(roomId) {
  const owner = getAccountId() || getLoginId() || 'guest';
  return `${STORAGE_PREFIX}:${encodeURIComponent(owner)}:${encodeURIComponent(String(roomId))}`;
}

export function getChatRoomProfileImage(roomId) {
  if (roomId == null) return '';
  try { return globalThis.localStorage?.getItem(storageKey(roomId)) || ''; }
  catch { return ''; }
}

export function setChatRoomProfileImage(roomId, image) {
  if (roomId == null) return false;
  try {
    const key = storageKey(roomId);
    if (image) globalThis.localStorage?.setItem(key, image);
    else globalThis.localStorage?.removeItem(key);
    return true;
  } catch { return false; }
}
