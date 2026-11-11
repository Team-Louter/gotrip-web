import { createApiClient } from '../api/client.js';

function normalizeFriendship(value) {
  const friendshipId = value?.friendshipId;
  const memberId = value?.memberId;
  if (!Number.isSafeInteger(Number(friendshipId)) || !Number.isSafeInteger(Number(memberId))) {
    throw new Error('친구 응답 형식을 확인해 주세요.');
  }
  return {
    friendshipId: String(friendshipId),
    memberId: String(memberId),
    nickname: typeof value.nickname === 'string' ? value.nickname : '',
    createdAt: value.createdAt ?? value.requestedAt ?? null,
  };
}

function normalizeList(result) {
  if (!Array.isArray(result)) throw new Error('친구 목록 응답 형식을 확인해 주세요.');
  return result.map(normalizeFriendship);
}

export function createFriendshipApi(options = {}) {
  const request = createApiClient(options);

  return {
    async getFriends({ signal } = {}) {
      return normalizeList(await request('/api/friends', { signal }));
    },
    async getReceivedRequests({ signal } = {}) {
      return normalizeList(await request('/api/friends/requests/received', { signal }));
    },
    async getSentRequests({ signal } = {}) {
      return normalizeList(await request('/api/friends/requests/sent', { signal }));
    },
    async sendFriendRequest(memberId, { signal } = {}) {
      const numericId = Number(memberId);
      if (!Number.isSafeInteger(numericId) || numericId <= 0) throw new Error('친구 회원 ID를 확인해 주세요.');
      return request('/api/friends/requests', { method: 'POST', body: { targetMemberId: numericId }, signal });
    },
    async acceptFriendRequest(friendshipId, { signal } = {}) {
      return request(`/api/friends/requests/${encodeURIComponent(friendshipId)}/accept`, { method: 'PATCH', signal });
    },
    async rejectFriendRequest(friendshipId, { signal } = {}) {
      return request(`/api/friends/requests/${encodeURIComponent(friendshipId)}/reject`, { method: 'DELETE', signal });
    },
    async deleteFriend(friendshipId, { signal } = {}) {
      return request(`/api/friends/${encodeURIComponent(friendshipId)}`, { method: 'DELETE', signal });
    },
    async cancelFriendRequest(friendshipId, { signal } = {}) {
      return request(`/api/friends/requests/${encodeURIComponent(friendshipId)}/cancel`, { method: 'DELETE', signal });
    },
  };
}

export const friendshipApi = createFriendshipApi();
