import { createApiClient } from '../api/client.js';
import { getMemberId, rememberMemberId } from '../api/session.js';

export const MESSAGE_PAGE_SIZE = 50;

export function mergeMessages(previous, incoming) {
  const messages = new Map(previous.map((message) => [message.id, message]));
  incoming.forEach((message) => messages.set(message.id, message));
  return [...messages.values()].sort((a, b) => {
    if (/^\d+$/.test(a.id) && /^\d+$/.test(b.id)) return BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0;
    return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
  });
}

export function parseMemberIds(value) {
  const ids = String(value).trim().split(/[\s,]+/).filter(Boolean);
  if (!ids.length) throw new Error('초대할 회원 ID를 한 명 이상 입력해 주세요.');
  const numbers = ids.map((id) => {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) throw new Error('회원 ID는 1 이상의 정수로 입력해 주세요.');
    return Number(id);
  });
  const unique = [...new Set(numbers)];
  if (unique.length > 99) throw new Error('한 번에 최대 99명까지 초대할 수 있어요.');
  return unique;
}

function normalizeRoom(room) {
  if (room?.id == null || typeof room.name !== 'string') throw new Error('채팅방 응답 형식을 확인해 주세요.');
  return { ...room, id: String(room.id), members: [], membersKnown: false, messages: [], lastMessage: '' };
}

export function createServerChatApi({ baseUrl, fetchImpl, token, onUnauthorized, currentMemberId = getMemberId, onMemberIdentified = rememberMemberId } = {}) {
  const request = createApiClient({ baseUrl, fetchImpl, token, onUnauthorized });
  const rooms = new Map();

  function normalizeMessage(message, mine = false) {
    if (message?.id == null || message.senderId == null || typeof message.content !== 'string') throw new Error('메시지 응답 형식을 확인해 주세요.');
    const date = new Date(message.createdAt);
    const memberId = currentMemberId();
    return {
      ...message,
      id: String(message.id), roomId: String(message.roomId), senderId: String(message.senderId),
      senderName: message.senderNickname || `회원 ${message.senderId}`,
      mine: mine || (memberId != null && String(message.senderId) === String(memberId)),
      time: Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date),
      attachments: [], reactions: [],
    };
  }

  const api = {
    useMock: false,
    capabilities: { friends: false, attachments: false, replies: false, editing: false, reactions: false },
    maxMessageLength: 2000,
    maxRoomNameLength: 100,
    async getChatRooms({ query = '', signal } = {}) {
      const result = await request('/api/chat/rooms', { signal });
      if (!Array.isArray(result)) throw new Error('채팅방 목록 응답 형식을 확인해 주세요.');
      const list = result.map(normalizeRoom);
      list.forEach((room) => rooms.set(room.id, room));
      const search = query.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');
      return list.filter((room) => room.name.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '').includes(search));
    },
    async getMessages(roomId, { before, size = MESSAGE_PAGE_SIZE, signal } = {}) {
      const params = new URLSearchParams({ size: String(size) });
      if (before != null) params.set('before', String(before));
      const result = await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages?${params}`, { signal });
      if (!Array.isArray(result)) throw new Error('메시지 목록 응답 형식을 확인해 주세요.');
      return mergeMessages([], result.map((message) => normalizeMessage(message)));
    },
    async getNewMessages(roomId, { after, signal } = {}) {
      let messages = await api.getMessages(roomId, { signal });
      let page = messages;
      // 탭을 오래 숨겨 두어 새 메시지가 50개를 넘은 경우에도 중간 대화를 채웁니다.
      while (after != null && page.length === MESSAGE_PAGE_SIZE && BigInt(page[0].id) > BigInt(after)) {
        const before = page[0].id;
        page = await api.getMessages(roomId, { before, signal });
        if (page.length && BigInt(page[0].id) >= BigInt(before)) throw new Error('이전 메시지를 불러오지 못했어요. 다시 시도해 주세요.');
        messages = mergeMessages(messages, page);
      }
      return messages;
    },
    async getChatRoom(id, { signal } = {}) {
      if (!rooms.has(String(id))) await api.getChatRooms({ signal });
      const room = rooms.get(String(id));
      if (!room) throw new Error('채팅방을 찾을 수 없습니다.');
      const messages = await api.getMessages(id, { signal });
      return { ...room, messages, lastMessage: messages.at(-1)?.content ?? '', hasOlderMessages: messages.length === MESSAGE_PAGE_SIZE };
    },
    async createChatRoom({ name, memberIds }, { signal } = {}) {
      const title = name?.trim();
      if (!title || title.length > 100) throw new Error('방 이름은 1~100자로 입력해 주세요.');
      const ids = parseMemberIds((memberIds ?? []).join(','));
      const room = normalizeRoom(await request('/api/chat/rooms', { method: 'POST', body: { name: title, memberIds: ids }, signal }));
      rooms.set(room.id, room);
      return room;
    },
    async sendMessage(roomId, { content = '', attachments = [], replyToId = null }, { signal } = {}) {
      if (attachments.length || replyToId != null) throw new Error('현재 서버는 텍스트 메시지만 지원합니다.');
      const text = content.trim();
      if (!text || text.length > 2000) throw new Error('메시지는 1~2,000자로 입력해 주세요.');
      const result = await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, { method: 'POST', body: { content: text }, signal });
      const message = normalizeMessage(result, true);
      onMemberIdentified(result.senderId);
      return { ...(rooms.get(String(roomId)) ?? { id: String(roomId), name: '채팅방', members: [], membersKnown: false }), messages: [message], lastMessage: message.content };
    },
  };
  return api;
}
