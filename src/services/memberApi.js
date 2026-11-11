import { createApiClient } from '../api/client.js';
import { getLoginId, getMemberId, getToken } from '../api/session.js';

export function normalizeMember(value) {
  if (typeof value?.loginId !== 'string' || !value.loginId.trim() || typeof value.nickname !== 'string') throw new Error('친구 목록 응답 형식을 확인해 주세요.');
  const rawId = value.memberId ?? value.id;
  const memberId = /^[1-9]\d*$/.test(String(rawId)) && Number.isSafeInteger(Number(rawId)) ? String(rawId) : null;
  return { id: memberId, loginId: value.loginId, name: value.nickname || value.loginId };
}

export function matchesMember(member, query = '') {
  const normalize = (value) => String(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');
  return normalize(`${member.name} ${member.loginId ?? ''}`).includes(normalize(query));
}

// 사용자가 요청한 서버 연결 테스트용 순번입니다. 실제 서버 회원 ID가 있으면 그대로 사용합니다.
export function mapTestMemberIds(members) {
  const used = new Set(members.filter((member) => member.id != null).map((member) => String(member.id)));
  return members.map((member, index) => {
    if (member.id != null) return member;
    let id = index + 1;
    while (used.has(String(id))) id++;
    used.add(String(id));
    return { ...member, id: String(id), idIsTestMapping: true };
  });
}

export function createMemberApi({ currentLoginId = getLoginId, currentMemberId = getMemberId, ...options } = {}) {
  const request = createApiClient(options);
  return {
    async getMembers({ query = '', excludeSelf = true, signal } = {}) {
      const result = await request('/api/members', { signal, auth: Boolean((options.token ?? getToken)()) });
      if (!Array.isArray(result)) throw new Error('친구 목록 응답 형식을 확인해 주세요.');
      const ownLoginId = currentLoginId();
      const ownMemberId = currentMemberId();
      const unique = new Map();
      result.map(normalizeMember).forEach((member) => unique.set(member.loginId, member));
      return [...unique.values()].filter((member) => (!excludeSelf || !((ownLoginId && member.loginId === ownLoginId) || (ownMemberId && member.id === String(ownMemberId)))) && matchesMember(member, query));
    },
  };
}

export const memberApi = createMemberApi();
