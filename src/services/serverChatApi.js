import { createApiClient } from '../api/client.js';
import { getLoginId, getMemberId, rememberMemberId } from '../api/session.js';
import { createMemberApi, matchesMember } from './memberApi.js';
import { createFriendshipApi } from './friendshipApi.js';
import { parseReplyContent } from '../data/chatMessages.js';

export const MESSAGE_PAGE_SIZE = 50;

function normalizeReactions(reactions, myReaction = null) {
  if (!Array.isArray(reactions)) return [];
  return reactions.filter((reaction) => typeof reaction?.emoji === 'string' && Number(reaction.count) > 0)
    .map((reaction) => ({ emoji: reaction.emoji, count: Number(reaction.count), mine: reaction.emoji === myReaction }));
}

export function mergeMessages(previous, incoming) {
  const messages = new Map(previous.map((message) => [message.id, message]));
  incoming.forEach((message) => messages.set(message.id, message));
  return [...messages.values()].sort((a, b) => {
    if (/^\d+$/.test(a.id) && /^\d+$/.test(b.id)) return BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0;
    return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
  });
}

export function applyUnreadCounts(messages, members) {
  if (!Array.isArray(members) || members.length === 0) return messages;
  return messages.map((message) => {
    if (!/^\d+$/.test(String(message.id)) || !/^\d+$/.test(String(message.senderId))) return message;
    const messageId = BigInt(message.id);
    const unreadCount = members.filter((member) => {
      if (String(member.memberId) === String(message.senderId)) return false;
      if (member.lastReadMessageId == null || member.lastReadMessageId === '') return true;
      if (!/^\d+$/.test(String(member.lastReadMessageId))) return false;
      return BigInt(member.lastReadMessageId) < messageId;
    }).length;
    return { ...message, unreadCount };
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
  return { ...room, id: String(room.id), source: 'server', members: [], membersKnown: false, messages: [], lastMessage: '' };
}

export function createServerChatApi({ baseUrl, fetchImpl, token, onUnauthorized, currentMemberId = getMemberId, onMemberIdentified = rememberMemberId } = {}) {
  const request = createApiClient({ baseUrl, fetchImpl, token, onUnauthorized });
  const members = createMemberApi({ baseUrl, fetchImpl, token, onUnauthorized, currentMemberId });
  const friendships = createFriendshipApi({ baseUrl, fetchImpl, token, onUnauthorized });
  const rooms = new Map();
  const roomProfileImages = new Map();
  const messageImages = new Map();
  let memberIdentityPromise;
  let memberIdentityChecked = false;

  async function identifyCurrentMember() {
    const existingId = currentMemberId();
    if (existingId != null) return String(existingId);
    const loginId = getLoginId();
    if (!loginId || memberIdentityChecked) return null;
    if (!memberIdentityPromise) {
      memberIdentityPromise = members.getMembers({ excludeSelf: false })
        .then((list) => {
          memberIdentityChecked = true;
          const self = list.find((member) => member.loginId === loginId);
          if (self?.id != null) {
            rememberMemberId(self.id);
            return String(self.id);
          }
          return null;
        })
        .catch(() => {
          memberIdentityChecked = true;
          return null;
        })
        .finally(() => { memberIdentityPromise = null; });
    }
    return memberIdentityPromise;
  }

  function otherMembers(members) {
    const list = Array.isArray(members) ? members : [];
    const currentId = currentMemberId();
    if (currentId == null || !list.some((member) => String(member.memberId) === String(currentId))) return list;
    return list.filter((member) => String(member.memberId) !== String(currentId));
  }

  function normalizeMessage(message, mine = false) {
    if (message?.id == null || message.senderId == null || typeof message.content !== 'string') throw new Error('메시지 응답 형식을 확인해 주세요.');
    const date = new Date(message.createdAt);
    const memberId = currentMemberId();
    const reply = parseReplyContent(message.content);
    return {
      ...message,
      unreadCount: Number.isSafeInteger(Number(message.unreadCount)) ? Math.max(0, Number(message.unreadCount)) : 0,
      content: message.type === 'IMAGE' ? '' : reply.content,
      replyPreview: reply.replyPreview,
      id: String(message.id), roomId: String(message.roomId), senderId: String(message.senderId),
      senderName: message.senderNickname || `회원 ${message.senderId}`,
      mine: mine || (memberId != null && String(message.senderId) === String(memberId)),
      time: Number.isNaN(date.valueOf()) ? '' : new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date),
      attachments: [], reactions: normalizeReactions(message.reactions, message.myReaction ?? null),
    };
  }

  async function getMessageImage(roomId, messageId, { signal } = {}) {
    const key = `${roomId}:${messageId}`;
    if (messageImages.has(key)) return messageImages.get(key);
    const pending = request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/image`, { signal, responseType: 'blob' })
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('채팅 사진을 불러오지 못했습니다.'));
        reader.readAsDataURL(blob);
      }))
      .catch((error) => { messageImages.delete(key); throw error; });
    messageImages.set(key, pending);
    const image = await pending;
    messageImages.set(key, image);
    return image;
  }

  async function hydrateMessage(message, { signal } = {}) {
    if (message.type !== 'IMAGE') return message;
    try {
      const url = await getMessageImage(message.roomId, message.id, { signal });
      return { ...message, attachments: [{ id: `image-${message.id}`, type: 'image', url, name: '채팅 이미지' }] };
    } catch (error) {
      if (signal?.aborted) throw error;
      return message;
    }
  }

  const api = {
    useMock: false,
    capabilities: { friends: true, attachments: true, replies: false, deletion: true, reactions: true },
    async getFriends({ query = '', signal } = {}) {
      const list = await friendships.getFriends({ signal });
      return list.map((friend) => ({
        id: friend.memberId,
        friendshipId: friend.friendshipId,
        name: friend.nickname || `회원 ${friend.memberId}`,
        nickname: friend.nickname,
        profileImageUrl: friend.profileImageUrl,
        loginId: '',
      })).filter((friend) => matchesMember(friend, query));
    },
    maxMessageLength: 2000,
    maxRoomNameLength: 100,
    async getChatRooms({ query = '', signal } = {}) {
      await identifyCurrentMember();
      const result = await request('/api/chat/rooms', { signal });
      if (!Array.isArray(result)) throw new Error('채팅방 목록 응답 형식을 확인해 주세요.');
      const list = await Promise.all(result.map(async (item) => {
        const room = normalizeRoom(item);
        const [imageResult, membersResult] = await Promise.allSettled([
          api.getChatRoomProfileImage(room.id, { signal }),
          api.getChatRoomMembers(room.id, { signal }),
        ]);
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        room.roomProfileImage = imageResult.status === 'fulfilled' ? imageResult.value || room.profileImageUrl || '' : room.profileImageUrl || '';
        if (membersResult.status === 'fulfilled' && membersResult.value.length > 0) {
          room.members = membersResult.value;
          room.otherMembers = otherMembers(membersResult.value);
          room.membersKnown = true;
          if (room.otherMembers.length === 1) room.counterpartProfileImageUrl = room.otherMembers[0].profileImageUrl || room.counterpartProfileImageUrl;
        }
        return room;
      }));
      list.forEach((room) => rooms.set(room.id, room));
      const search = query.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');
      return list.filter((room) => room.name.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '').includes(search));
    },
    async getMessages(roomId, { before, size = MESSAGE_PAGE_SIZE, signal } = {}) {
      await identifyCurrentMember();
      const params = new URLSearchParams({ size: String(size) });
      if (before != null) params.set('before', String(before));
      const result = await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages?${params}`, { signal });
      if (!Array.isArray(result)) throw new Error('메시지 목록 응답 형식을 확인해 주세요.');
      const messages = await Promise.all(result.map((message) => hydrateMessage(normalizeMessage(message), { signal })));
      return mergeMessages([], messages);
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
    async getChatRoomMembers(roomId, { signal } = {}) {
      const result = await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/members`, { signal });
      if (!Array.isArray(result)) throw new Error('채팅방 참여자 정보를 불러오지 못했습니다.');
      return result.filter((member) => member?.memberId != null).map((member) => ({
        ...member,
        memberId: String(member.memberId),
        lastReadMessageId: member.lastReadMessageId == null ? null : String(member.lastReadMessageId),
      }));
    },
    async markRead(roomId, lastReadMessageId, { signal } = {}) {
      const messageId = String(lastReadMessageId ?? '');
      if (!/^\d+$/.test(messageId) || !Number.isSafeInteger(Number(messageId))) {
        throw new Error('읽음 처리할 메시지를 확인해 주세요.');
      }
      return request(`/api/chat/rooms/${encodeURIComponent(roomId)}/read`, {
        method: 'PUT',
        body: { lastReadMessageId: Number(messageId) },
        signal,
      });
    },
    async getChatRoom(id, { signal } = {}) {
      if (!rooms.has(String(id))) await api.getChatRooms({ signal });
      const room = rooms.get(String(id));
      if (!room) throw new Error('채팅방을 찾을 수 없습니다.');
      const [messages, members] = await Promise.all([
        api.getMessages(id, { signal }),
        api.getChatRoomMembers(id, { signal }).catch(() => null),
      ]);
      const roomMembers = members ?? room.members;
      const messagesWithReadCounts = roomMembers?.length ? applyUnreadCounts(messages, roomMembers) : messages;
      const updatedRoom = {
        ...room,
        ...(members?.length ? { members, otherMembers: otherMembers(members), membersKnown: true } : {}),
        messages: messagesWithReadCounts,
        lastMessage: messagesWithReadCounts.at(-1)?.content ?? '',
        hasOlderMessages: messagesWithReadCounts.length === MESSAGE_PAGE_SIZE,
      };
      rooms.set(String(id), updatedRoom);
      return updatedRoom;
    },
    async createChatRoom({ name, memberIds }, { signal } = {}) {
      const title = name?.trim();
      if (!title || title.length > 100) throw new Error('방 이름은 1~100자로 입력해 주세요.');
      const ids = parseMemberIds((memberIds ?? []).join(','));
      const room = normalizeRoom(await request('/api/chat/rooms', { method: 'POST', body: { name: title, memberIds: ids }, signal }));
      rooms.set(room.id, room);
      return room;
    },
    async updateChatRoom(roomId, { name }, { signal } = {}) {
      const title = name?.trim();
      if (!title || title.length > 100) throw new Error('방 이름은 1~100자로 입력해 주세요.');
      const key = String(roomId);
      await request(`/api/chat/rooms/${encodeURIComponent(key)}`, { method: 'PATCH', body: { name: title }, signal });
      const updatedRoom = { ...(rooms.get(key) ?? { id: key }), name: title };
      rooms.set(key, updatedRoom);
      return updatedRoom;
    },
    async getChatRoomProfileImage(roomId, { signal } = {}) {
      const key = String(roomId);
      if (roomProfileImages.has(key)) return roomProfileImages.get(key);
      try {
        const blob = await request(`/api/chat/rooms/${encodeURIComponent(key)}/profile-image`, { signal, responseType: 'blob' });
        const image = blob?.size ? await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('채팅방 프로필 사진을 불러오지 못했습니다.'));
          reader.readAsDataURL(blob);
        }) : '';
        roomProfileImages.set(key, image);
        return image;
      } catch (error) {
        if (error.status === 404) {
          roomProfileImages.set(key, '');
          return '';
        }
        throw error;
      }
    },
    async updateChatRoomProfileImage(roomId, imageDataUrl, { signal } = {}) {
      const key = String(roomId);
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(String(imageDataUrl || ''));
      if (!match) throw new Error('채팅방 프로필 사진을 확인해 주세요.');
      const bytes = atob(match[2]);
      const binary = new Uint8Array(bytes.length);
      for (let index = 0; index < bytes.length; index += 1) binary[index] = bytes.charCodeAt(index);
      const file = new File([binary], 'chat-room-profile.jpg', { type: match[1] });
      const body = new FormData();
      body.append('file', file);
      await request(`/api/chat/rooms/${encodeURIComponent(key)}/profile-image`, { method: 'PUT', body, signal });
      roomProfileImages.set(key, imageDataUrl);
      return imageDataUrl;
    },
    async deleteChatRoomProfileImage(roomId, { signal } = {}) {
      const key = String(roomId);
      await request(`/api/chat/rooms/${encodeURIComponent(key)}/profile-image`, { method: 'DELETE', signal });
      roomProfileImages.set(key, '');
      return '';
    },
    async deleteChatRoom(roomId, { signal } = {}) {
      const key = String(roomId);
      await request(`/api/chat/rooms/${encodeURIComponent(key)}`, { method: 'DELETE', signal });
      rooms.delete(key);
    },
    async leaveChatRoom(roomId, { signal } = {}) {
      const key = String(roomId);
      await request(`/api/chat/rooms/${encodeURIComponent(key)}/members/me`, { method: 'DELETE', signal });
      rooms.delete(key);
    },
    async sendMessage(roomId, { content = '', attachments = [], replyToId = null }, { signal } = {}) {
      if (attachments.length) throw new Error('첨부 파일은 전송할 수 없습니다.');
      const text = content.trim();
      if (!text || text.length > 2000) throw new Error('메시지는 1~2,000자로 입력해 주세요.');
      const result = await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, { method: 'POST', body: { content: text }, signal });
      const message = normalizeMessage(result, true);
      onMemberIdentified(result.senderId);
      const currentRoom = rooms.get(String(roomId)) ?? { id: String(roomId), name: '채팅방', members: [], membersKnown: false, messages: [] };
      const sentMessage = applyUnreadCounts([message], currentRoom.members)[0];
      const updatedRoom = { ...currentRoom, messages: mergeMessages(currentRoom.messages ?? [], [sentMessage]), lastMessage: message.content };
      rooms.set(String(roomId), updatedRoom);
      return updatedRoom;
    },
    async sendImage(roomId, file, { signal } = {}) {
      if (!(file instanceof File) || !file.type.startsWith('image/')) throw new Error('이미지 파일을 확인해 주세요.');
      if (file.size > 1024 * 1024) throw new Error('이미지는 1MB 이하로 선택해 주세요.');
      const body = new FormData();
      body.append('file', file);
      const result = await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages/images`, { method: 'POST', body, signal });
      const message = await hydrateMessage(normalizeMessage(result, true), { signal });
      onMemberIdentified(result.senderId);
      const key = String(roomId);
      const currentRoom = rooms.get(key) ?? { id: key, name: '채팅방', members: [], membersKnown: false, messages: [] };
      const sentMessage = applyUnreadCounts([message], currentRoom.members)[0];
      const updatedRoom = { ...currentRoom, messages: mergeMessages(currentRoom.messages ?? [], [sentMessage]), lastMessage: '사진' };
      rooms.set(key, updatedRoom);
      return updatedRoom;
    },
    async setReaction(roomId, messageId, emoji, active, { signal } = {}) {
      if (typeof emoji !== 'string' || !emoji.trim() || emoji.length > 32 || /[\s\p{Cc}]/u.test(emoji)) {
        throw new Error('이모티콘을 다시 선택해 주세요.');
      }
      const path = `/api/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/reaction`;
      const response = await request(path, active
        ? { method: 'PUT', body: { emoji }, signal }
        : { method: 'DELETE', signal });
      let room = rooms.get(String(roomId));
      if (!room?.messages?.some((message) => message.id === String(messageId))) room = await api.getChatRoom(roomId, { signal });
      if (!Array.isArray(response?.reactions)) return api.getChatRoom(roomId, { signal });

      const myReaction = response.emoji ?? (active ? emoji : null);
      const updatedRoom = {
        ...room,
        messages: room.messages.map((message) => message.id === String(messageId)
          ? { ...message, reactions: normalizeReactions(response.reactions, myReaction) }
          : message),
      };
      rooms.set(String(roomId), updatedRoom);
      return updatedRoom;
    },
    async deleteMessage(roomId, messageId, { signal } = {}) {
      await request(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE', signal });
      const room = rooms.get(String(roomId)) ?? { id: String(roomId), name: '채팅방', members: [], membersKnown: false };
      const messages = await api.getMessages(roomId, { signal });
      const updatedRoom = { ...room, messages, lastMessage: messages.at(-1)?.content ?? '', hasOlderMessages: messages.length === MESSAGE_PAGE_SIZE };
      rooms.set(String(roomId), updatedRoom);
      return { ...updatedRoom, deletedMessageId: String(messageId) };
    },
  };
  return api;
}
