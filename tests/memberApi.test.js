import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemberApi, mapTestMemberIds } from '../src/services/memberApi.js';
import { createServerChatApi } from '../src/services/serverChatApi.js';

test('friend list uses /api/members, excludes self and never invents numeric invitation IDs', async () => {
  const requests = [];
  const api = createMemberApi({ baseUrl: '', token: () => 'token', currentLoginId: () => 'me', currentMemberId: () => '1', fetchImpl: async (url, options) => {
    requests.push({ url, ...options });
    return new Response(JSON.stringify([{ loginId: 'me', nickname: '나' }, { loginId: 'minji', nickname: '김 민지' }, { loginId: 'other', nickname: '다른 친구', id: 3 }]));
  } });
  const list = await api.getMembers();
  assert.deepEqual(list.map((member) => member.id), [null, '3']);
  assert.equal(list[0].name, '김 민지');
  assert.equal((await api.getMembers({ query: '김민지' }))[0].loginId, 'minji');
  assert.equal((await api.getMembers({ query: 'MINJI' })).length, 1);
  assert.equal((await api.getMembers({ excludeSelf: false })).length, 3);
  assert.equal(requests[0].url, '/api/members');
  assert.equal(requests[0].headers.Authorization, 'Bearer token');
});

test('chat room friend selector uses the same real member list and supports empty/error responses', async () => {
  const api = createServerChatApi({ token: () => 'token', fetchImpl: async (url) => {
    assert.equal(url, '/api/members');
    return new Response(JSON.stringify([{ loginId: 'friend', nickname: '친구' }]));
  } });
  assert.equal((await api.getFriends())[0].id, null);
  assert.equal((await api.getFriends())[0].idIsTestMapping, undefined);
  const empty = createMemberApi({ token: () => 'token', fetchImpl: async () => new Response('[]') });
  assert.deepEqual(await empty.getMembers(), []);
  const malformed = createMemberApi({ token: () => 'token', fetchImpl: async () => new Response('[{}]') });
  await assert.rejects(malformed.getMembers(), /응답 형식/);
  const expired = createMemberApi({ token: () => 'token', onUnauthorized: () => {}, fetchImpl: async () => new Response(null, { status: 401 }) });
  await assert.rejects(expired.getMembers(), { status: 401 });
});

test('explicit server-test mapping uses 1, 2, 3 before filtering and preserves real IDs without collisions', () => {
  const mapped = mapTestMemberIds([{ id: null, loginId: 'a' }, { id: null, loginId: 'b' }, { id: null, loginId: 'c' }]);
  assert.deepEqual(mapped.map((member) => member.id), ['1', '2', '3']);
  const mixed = mapTestMemberIds([{ id: null, loginId: 'a' }, { id: '1', loginId: 'b' }]);
  assert.deepEqual(mixed.map((member) => member.id), ['2', '1']);
});

test('server invitation uses actual member IDs even when deleted accounts leave gaps', async () => {
  const requests = [];
  const api = createServerChatApi({ token: () => 'token', fetchImpl: async (url, options) => {
    requests.push({ url, ...options });
    return new Response(JSON.stringify(url === '/api/members'
      ? [{ memberId: 17, loginId: 'a', nickname: '사용자 A' }, { id: 42, loginId: 'b', nickname: '사용자 B' }]
      : { id: 3, name: '여행' }));
  } });
  const friends = await api.getFriends();
  assert.deepEqual(friends.map(member => member.id), ['17', '42']);
  await api.createChatRoom({ name: '여행', memberIds: friends.map(member => member.id) });
  assert.deepEqual(JSON.parse(requests[1].body).memberIds, [17, 42]);
});

test('public member list remains available before login without sending a fake token', async () => {
  const api = createMemberApi({ token: () => null, currentLoginId: () => null, currentMemberId: () => null, fetchImpl: async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify([{ loginId: 'friend', nickname: '친구' }]));
  } });
  assert.equal((await api.getMembers()).length, 1);
});
