import { mockFriends, mockRooms } from '../data/chatFixtures.js';
import { MAX_IMAGE_COUNT, MAX_IMAGE_BYTES, REACTION_EMOJIS, messagePreview, normalizeAttachment, validateImages } from '../data/chatMessages.js';

export const CHAT_STORAGE_KEY = 'gotrip.chat.rooms.v1';
const environment = import.meta.env ?? {};

export function matchesRoom(room, query = '') {
  const normalize = (value) => String(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');
  const haystack = [room.name, room.lastMessage, ...room.members.map((member) => member.name)].join(' ');
  return normalize(haystack).includes(normalize(query));
}

function normalizeRoom(value) {
  if (!value || value.id == null || typeof value.name !== 'string' || !value.name.trim()) {
    throw new Error('채팅방 응답 형식을 확인해 주세요.');
  }
  return {
    ...value,
    id: String(value.id),
    members: Array.isArray(value.members) ? value.members : [],
    messages: Array.isArray(value.messages) ? value.messages.map((message) => ({ ...message, id: String(message.id), content: message.content ?? '', attachments: (message.attachments ?? []).map(normalizeAttachment), reactions: message.reactions ?? [] })) : [],
    lastMessage: typeof value.lastMessage === 'string' ? value.lastMessage : '',
  };
}

function roomData(response) {
  return normalizeRoom(response?.data?.room ?? response?.data ?? response?.room ?? response);
}

export function createChatApi({ useMock = true, baseUrl = '', fetchImpl = globalThis.fetch, storage } = {}) {
  let localRooms;
  const browserStorage = () => storage ?? globalThis.localStorage;
  const copy = (value) => JSON.parse(JSON.stringify(value));

  function readRooms() {
    if (!localRooms) {
      try {
        const saved = JSON.parse(browserStorage()?.getItem(CHAT_STORAGE_KEY) ?? 'null');
        localRooms = Array.isArray(saved) ? saved.map(normalizeRoom) : copy(mockRooms);
      } catch { localRooms = copy(mockRooms); }
    }
    return localRooms;
  }

  function commitRooms(next) {
    try { browserStorage()?.setItem(CHAT_STORAGE_KEY, JSON.stringify(next)); } catch {
      throw new Error('변경 내용을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');
    }
    localRooms = next;
  }

  function updateRoom(id, transform) {
    const rooms = readRooms();
    const current = rooms.find((room) => room.id === id);
    if (!current) throw new Error('채팅방을 찾을 수 없습니다.');
    const nextRoom = normalizeRoom(transform(copy(current)));
    commitRooms(rooms.map((room) => room.id === id ? nextRoom : room));
    return copy(nextRoom);
  }

  function updateMessage(roomId, messageId, transform) {
    return updateRoom(roomId, (room) => {
      const message = room.messages.find((item) => item.id === messageId);
      if (!message || message.deleted) throw new Error('메시지를 찾을 수 없습니다.');
      room.messages = room.messages.map((item) => item.id === messageId ? transform(item) : item);
      room.lastMessage = messagePreview(room.messages.at(-1));
      return room;
    });
  }

  async function request(path, { signal, method = 'GET', body } = {}) {
    const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
    const response = await fetchImpl(`${baseUrl.replace(/\/+$/, '')}${path}`, {
      method, signal, credentials: 'include',
      headers: { Accept: 'application/json', ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
    });
    let result;
    try { result = await response.json(); } catch {
      throw new Error(`채팅 API 응답을 확인해 주세요. (${response.status})`);
    }
    if (!response.ok) throw new Error(result?.message || `채팅 요청에 실패했습니다. (${response.status})`);
    return result;
  }

  return {
    useMock,
    async getChatRooms({ query = '', signal } = {}) {
      signal?.throwIfAborted();
      if (useMock) return copy(readRooms().filter((room) => matchesRoom(room, query)));
      const params = new URLSearchParams(query.trim() ? { q: query.trim() } : {});
      const result = await request(`/api/chat/rooms${params.size ? `?${params}` : ''}`, { signal });
      const rooms = result?.data?.rooms ?? result?.data ?? result?.rooms ?? result;
      if (!Array.isArray(rooms)) throw new Error('채팅방 목록 응답 형식을 확인해 주세요.');
      return rooms.map(normalizeRoom).filter((room) => matchesRoom(room, query));
    },
    async getChatRoom(id, { signal } = {}) {
      signal?.throwIfAborted();
      if (!useMock) return roomData(await request(`/api/chat/rooms/${encodeURIComponent(id)}`, { signal }));
      const room = readRooms().find((item) => item.id === id);
      if (!room) throw new Error('채팅방을 찾을 수 없습니다.');
      return copy(room);
    },
    async getFriends({ signal } = {}) {
      signal?.throwIfAborted();
      if (useMock) return copy(mockFriends);
      const result = await request('/api/friends', { signal });
      const friends = result?.data?.friends ?? result?.data ?? result?.friends ?? result;
      if (!Array.isArray(friends) || friends.some((friend) => friend.id == null || typeof friend.name !== 'string')) {
        throw new Error('친구 목록 응답 형식을 확인해 주세요.');
      }
      return friends.map((friend) => ({ ...friend, id: String(friend.id) }));
    },
    async uploadImages(files, { signal } = {}) {
      validateImages(files);
      signal?.throwIfAborted();
      if (useMock) return Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try { resolve(normalizeAttachment({ id: crypto.randomUUID(), type: 'image', url: reader.result, name: file.name, size: file.size })); }
          catch { reject(new Error('이미지를 읽지 못했어요. 다시 선택해 주세요.')); }
        };
        reader.onerror = () => reject(new Error('이미지를 읽지 못했어요. 다시 선택해 주세요.'));
        reader.readAsDataURL(file);
      })));
      const body = new FormData();
      files.forEach((file) => body.append('files', file));
      const result = await request('/api/chat/uploads', { method: 'POST', body, signal });
      const attachments = result?.data?.attachments ?? result?.data ?? result?.attachments ?? result;
      if (!Array.isArray(attachments) || attachments.length !== files.length || attachments.some((item) => item.type !== 'image')) throw new Error('이미지 업로드 응답 형식을 확인해 주세요.');
      return attachments.map((item, index) => normalizeAttachment({ ...item, size: files[index].size }));
    },
    async sendMessage(roomId, { content = '', attachments = [], replyToId = null, clientId = crypto.randomUUID() }, { signal } = {}) {
      const text = content.trim();
      if (!text && !attachments.length) throw new Error('메시지 또는 첨부를 입력해 주세요.');
      if (text.length > 4000) throw new Error('메시지는 4,000자 이내로 입력해 주세요.');
      const normalized = attachments.map(normalizeAttachment);
      if (normalized.filter((item) => item.type === 'image').length > MAX_IMAGE_COUNT || normalized.filter((item) => item.type === 'link').length > 3) throw new Error('이미지와 링크는 각각 최대 3개까지 첨부할 수 있어요.');
      if (normalized.reduce((total, item) => total + (item.size || 0), 0) > MAX_IMAGE_BYTES) throw new Error('첨부 이미지의 전체 크기는 2MB 이하여야 해요.');
      signal?.throwIfAborted();
      if (!useMock) return roomData(await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, { method: 'POST', body: { content: text, attachments: normalized, replyToId, clientId }, signal }));
      return updateRoom(roomId, (room) => {
        if (room.messages.some((message) => message.clientId === clientId)) return room;
        if (replyToId && !room.messages.some((message) => message.id === replyToId && !message.deleted)) throw new Error('답장할 메시지를 찾을 수 없습니다.');
        const message = { id: crypto.randomUUID(), clientId, content: text, attachments: normalized, replyToId, senderName: '나', mine: true, time: new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()), reactions: [] };
        room.messages.push(message);
        room.lastMessage = messagePreview(message);
        return room;
      });
    },
    async editMessage(roomId, messageId, content) {
      if (!content.trim() || content.trim().length > 4000) throw new Error('메시지는 1~4,000자로 입력해 주세요.');
      if (!useMock) return roomData(await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`, { method: 'PATCH', body: { content: content.trim() } }));
      return updateMessage(roomId, messageId, (message) => {
        if (!message.mine) throw new Error('내 메시지만 수정할 수 있어요.');
        return { ...message, content: content.trim(), edited: true };
      });
    },
    async deleteMessage(roomId, messageId) {
      if (!useMock) return roomData(await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' }));
      return updateMessage(roomId, messageId, (message) => {
        if (!message.mine) throw new Error('내 메시지만 삭제할 수 있어요.');
        return { ...message, content: '', attachments: [], reactions: [], deleted: true };
      });
    },
    async setReaction(roomId, messageId, emoji, active) {
      if (!REACTION_EMOJIS.includes(emoji)) throw new Error('이모지를 다시 선택해 주세요.');
      if (!useMock) return roomData(await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/reactions`, { method: 'PUT', body: { emoji, active } }));
      return updateMessage(roomId, messageId, (message) => {
        const reactions = message.reactions ?? [];
        const old = reactions.find((reaction) => reaction.emoji === emoji);
        const count = Math.max(0, (old?.count ?? 0) + (active ? 1 : 0) - (old?.mine ? 1 : 0));
        return { ...message, reactions: [...reactions.filter((reaction) => reaction.emoji !== emoji), ...(count ? [{ emoji, count, mine: active }] : [])] };
      });
    },
    async createChatRoom({ name, memberIds }, { signal } = {}) {
      const title = name?.trim();
      const ids = [...new Set(memberIds ?? [])];
      if (!title || title.length > 50) throw new Error('방 이름은 1~50자로 입력해 주세요.');
      if (!ids.length) throw new Error('함께할 친구를 한 명 이상 선택해 주세요.');
      signal?.throwIfAborted();
      if (!useMock) return roomData(await request('/api/chat/rooms', { method: 'POST', body: { name: title, memberIds: ids }, signal }));
      const members = ids.map((id) => mockFriends.find((friend) => friend.id === id));
      if (members.some((member) => !member)) throw new Error('친구 목록을 다시 확인해 주세요.');
      const room = { id: crypto.randomUUID(), name: title, members, lastMessage: '', messages: [], createdAt: new Date().toISOString() };
      const next = [room, ...readRooms()];
      commitRooms(next);
      return copy(room);
    },
  };
}

export const chatApi = createChatApi({
  useMock: environment.VITE_CHAT_USE_MOCK !== 'false',
  baseUrl: environment.VITE_API_BASE_URL ?? '',
});
