import { getAccountId, getLoginId } from '../api/session.js';

const STORAGE_PREFIX = 'gotrip.chat.read.v1';

export function getChatReadStorageKey() {
  const owner = getAccountId() || getLoginId() || 'guest';
  return `${STORAGE_PREFIX}:${encodeURIComponent(owner)}`;
}

function afterCursor(message, cursorId, cursorAt, messages) {
  const messageId = String(message.id);
  const comparableIds = /^\d+$/.test(messageId) && /^\d+$/.test(cursorId);
  if (comparableIds) return BigInt(messageId) > BigInt(cursorId);

  const cursorIndex = messages.findIndex((item) => String(item.id) === cursorId);
  if (cursorIndex >= 0) return messages.indexOf(message) > cursorIndex;

  const messageTime = Date.parse(message.createdAt ?? '');
  const cursorTime = Date.parse(cursorAt ?? '');
  return Number.isFinite(messageTime) && Number.isFinite(cursorTime) && messageTime > cursorTime;
}

export function createChatReadStore({ storageKey = getChatReadStorageKey(), storage } = {}) {
  function getStorage() {
    try { return storage ?? globalThis.localStorage ?? null; }
    catch { return null; }
  }

  function read() {
    try {
      const saved = JSON.parse(getStorage()?.getItem(storageKey) ?? '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
      return Object.fromEntries(Object.entries(saved).map(([roomId, value]) => [roomId, {
        cursorMessageId: value?.cursorMessageId == null ? null : String(value.cursorMessageId),
        cursorMessageAt: typeof value?.cursorMessageAt === 'string' ? value.cursorMessageAt : null,
        unreadCount: Number.isSafeInteger(value?.unreadCount) && value.unreadCount > 0 ? value.unreadCount : 0,
      }]));
    } catch { return {}; }
  }

  function write(next) {
    try { getStorage()?.setItem(storageKey, JSON.stringify(next)); }
    catch { /* 읽음 표시를 저장할 수 없는 환경에서도 현재 화면의 상태는 갱신합니다. */ }
    return next;
  }

  function markRead(roomId, latestMessage) {
    const key = String(roomId);
    const state = read();
    const previous = state[key] ?? { cursorMessageId: null, cursorMessageAt: null, unreadCount: 0 };
    const latestId = latestMessage?.id ?? previous.cursorMessageId;
    return write({
      ...state,
      [key]: {
        cursorMessageId: latestId == null ? null : String(latestId),
        cursorMessageAt: latestMessage?.createdAt ?? previous.cursorMessageAt,
        unreadCount: 0,
      },
    });
  }

  function observeMessages(roomId, messages, { active = false } = {}) {
    const key = String(roomId);
    const state = read();
    const previous = state[key];
    const latest = messages.at(-1);

    if (active) return markRead(roomId, latest);
    if (!latest) return state;
    if (!previous?.cursorMessageId) {
      return write({
        ...state,
        [key]: { cursorMessageId: String(latest.id), cursorMessageAt: latest.createdAt ?? null, unreadCount: 0 },
      });
    }

    const incoming = messages.filter((message) => afterCursor(
      message,
      previous.cursorMessageId,
      previous.cursorMessageAt,
      messages,
    ) && !message.mine && !message.deleted);
    return write({
      ...state,
      [key]: {
        cursorMessageId: String(latest.id),
        cursorMessageAt: latest.createdAt ?? previous.cursorMessageAt,
        unreadCount: previous.unreadCount + incoming.length,
      },
    });
  }

  return { read, markRead, observeMessages };
}
