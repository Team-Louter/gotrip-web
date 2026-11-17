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

test('chat friend selector filters accepted friendships and preserves invitation member IDs', async () => {
  const requests = [];
  const controller = new AbortController();
  const api = createServerChatApi({ token: () => 'token', fetchImpl: async (url, options) => {
    requests.push({ url, ...options });
    return new Response(JSON.stringify([
      { friendshipId: 5, memberId: 17, nickname: '김 민지' },
      { friendshipId: 9, memberId: 42, nickname: '다른 친구' },
    ]));
  } });

  const friends = await api.getFriends({ query: '김민지', signal: controller.signal });

  assert.deepEqual(friends, [{ id: '17', friendshipId: '5', name: '김 민지', nickname: '김 민지', loginId: '' }]);
  assert.equal(requests[0].url, '/api/friends');
  assert.equal(requests[0].headers.Authorization, 'Bearer token');
  assert.equal(requests[0].signal, controller.signal);
});

test('chat friend selector returns no invitees when accepted friendships are empty', async () => {
  const api = createServerChatApi({ token: () => 'token', fetchImpl: async () => new Response('[]') });

  const friends = await api.getFriends();

  assert.deepEqual(friends, []);
});

test('chat friend selector rejects friendships without actual member IDs', async () => {
  const api = createServerChatApi({ token: () => 'token', fetchImpl: async () => new Response('[{"friendshipId":5,"nickname":"친구"}]') });

  await assert.rejects(api.getFriends(), /응답 형식/);
});

test('chat friend selector propagates expired authentication', async () => {
  let unauthorized = false;
  const api = createServerChatApi({ token: () => 'token', onUnauthorized: () => { unauthorized = true; }, fetchImpl: async () => new Response(null, { status: 401 }) });

  await assert.rejects(api.getFriends(), { status: 401 });

  assert.equal(unauthorized, true);
});

test('member list returns an empty result when no members exist', async () => {
  const empty = createMemberApi({ token: () => 'token', fetchImpl: async () => new Response('[]') });

  assert.deepEqual(await empty.getMembers(), []);
});

test('member list rejects malformed member responses', async () => {
  const malformed = createMemberApi({ token: () => 'token', fetchImpl: async () => new Response('[{}]') });

  await assert.rejects(malformed.getMembers(), /응답 형식/);
});

test('member list propagates expired authentication', async () => {
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
    return new Response(JSON.stringify(url === '/api/friends'
      ? [{ friendshipId: 5, memberId: 17, nickname: '사용자 A' }, { friendshipId: 9, memberId: 42, nickname: '사용자 B' }]
      : { id: 3, name: '여행' }));
  } });
  const friends = await api.getFriends();
  assert.deepEqual(friends.map(member => member.id), ['17', '42']);
  await api.createChatRoom({ name: '여행', memberIds: friends.map(member => member.id) });
  assert.equal(requests[0].url, '/api/friends');
  assert.equal(requests[1].url, '/api/chat/rooms');
  assert.deepEqual(JSON.parse(requests[1].body).memberIds, [17, 42]);
});

test('public member list remains available before login without sending a fake token', async () => {
  const api = createMemberApi({ token: () => null, currentLoginId: () => null, currentMemberId: () => null, fetchImpl: async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify([{ loginId: 'friend', nickname: '친구' }]));
  } });
  assert.equal((await api.getMembers()).length, 1);
});
