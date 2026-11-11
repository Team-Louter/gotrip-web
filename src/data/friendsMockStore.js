import { getAccountId, getLoginId } from '../api/session.js';

const STORAGE_PREFIX = 'gotrip.friends.mock.v1';

export const mockFriendCandidates = [
  { id: 'mock-user-tsts1', loginId: 'tsts1', name: '테스트 친구 1', isMock: true },
  { id: 'mock-user-tsts2', loginId: 'tsts2', name: '테스트 친구 2', isMock: true },
  { id: 'mock-user-tsts3', loginId: 'tsts3', name: '테스트 친구 3', isMock: true },
];

function initialState() {
  return {
    friends: [1, 2, 3].map((number) => ({
      id: `mock-friend-${number}`,
      loginId: `mockfriend${number}`,
      name: `임시 친구 ${number}`,
      isMock: true,
    })),
    incomingRequests: [{
      id: 'mock-incoming-request-1',
      loginId: 'requester1',
      name: '요청 테스트 친구',
      isMock: true,
    }],
    sentRequests: [],
  };
}

export function getFriendsMockStorageKey() {
  const account = getAccountId() || getLoginId() || 'guest';
  return `${STORAGE_PREFIX}:${encodeURIComponent(account)}`;
}

export function createFriendsMockStore({ storageKey = getFriendsMockStorageKey(), storage } = {}) {
  function getStorage() {
    try { return storage ?? globalThis.localStorage ?? null; }
    catch { return null; }
  }

  function persist(state) {
    try { getStorage()?.setItem(storageKey, JSON.stringify(state)); }
    catch { /* 화면에서는 현재 세션의 변경 내용을 계속 보여줍니다. */ }
    return state;
  }

  function read() {
    try {
      const saved = JSON.parse(getStorage()?.getItem(storageKey) ?? 'null');
      if (saved && Array.isArray(saved.friends) && Array.isArray(saved.incomingRequests) && Array.isArray(saved.sentRequests)) return saved;
    } catch { /* 저장된 임시 친구 데이터가 없으면 기본 테스트 데이터를 준비합니다. */ }
    return persist(initialState());
  }

  return {
    read,
    removeFriend(loginId) {
      const state = read();
      const friend = state.friends.find((item) => item.loginId === loginId);
      if (!friend?.isMock) return state;
      return persist({ ...state, friends: state.friends.filter((item) => item.loginId !== loginId) });
    },
    sendRequest(member) {
      const state = read();
      if (!member?.isMock || state.friends.some((item) => item.loginId === member.loginId)
        || state.sentRequests.some((item) => item.loginId === member.loginId)) return state;
      const request = { id: `mock-sent-${member.loginId}`, loginId: member.loginId, name: member.name, isMock: true };
      return persist({ ...state, sentRequests: [...state.sentRequests, request] });
    },
    acceptRequest(id) {
      const state = read();
      const request = state.incomingRequests.find((item) => item.id === id);
      if (!request) return state;
      const friends = state.friends.some((item) => item.loginId === request.loginId)
        ? state.friends
        : [...state.friends, { ...request, id: `mock-friend-${request.loginId}`, isMock: true }];
      return persist({ ...state, friends, incomingRequests: state.incomingRequests.filter((item) => item.id !== id) });
    },
    rejectRequest(id) {
      const state = read();
      return persist({ ...state, incomingRequests: state.incomingRequests.filter((item) => item.id !== id) });
    },
    cancelSentRequest(id) {
      const state = read();
      return persist({ ...state, sentRequests: state.sentRequests.filter((item) => item.id !== id) });
    },
  };
}
