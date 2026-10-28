import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatApi, chatApi } from '../src/services/chatApi.js';
import { mergeMessages, parseMemberIds } from '../src/services/serverChatApi.js';
import { createApiClient } from '../src/api/client.js';
import { clearSession, getMemberId, getToken, rememberMemberId, saveToken } from '../src/api/session.js';

const reply = (body, status = 200) => new Response(body == null ? null : JSON.stringify(body), { status });
const room = { id: 42, name: '제주 여행', createdAt: '2026-10-27T12:00:00Z' };
const message = (id, senderId = 7) => ({ id, roomId: 42, senderId, senderNickname: '민지', content: `메시지 ${id}`, type: 'TEXT', createdAt: '2026-10-27T12:30:00Z' });
function serverApi(fetchImpl, options = {}) {
  return createChatApi({ useMock: false, token: () => 'test-token', currentMemberId: () => '7', onMemberIdentified: () => {}, fetchImpl, ...options });
}

test('default application uses real server; unsupported controls are unavailable', () => {
  assert.equal(chatApi.useMock, false);
  assert.equal(chatApi.maxMessageLength, 2000);
  assert.equal(chatApi.maxRoomNameLength, 100);
  assert.deepEqual(Object.values(chatApi.capabilities), [false, false, false, false, false]);
});

test('server room list uses Bearer auth, local search, and numeric member IDs on creation', async () => {
  const requests = [];
  const api = serverApi(async (url, options) => {
    requests.push({ url, ...options });
    return reply(options.method === 'POST' ? room : [room]);
  }, { baseUrl: 'https://api.example.test/' });
  const controller = new AbortController();
  assert.equal((await api.getChatRooms({ query: '제 주', signal: controller.signal }))[0].id, '42');
  assert.deepEqual(await api.getChatRooms({ query: '없는방' }), []);
  const created = await api.createChatRoom({ name: ' 제주 여행 ', memberIds: ['7', '8', '7'] });
  assert.equal(created.membersKnown, false);
  assert.equal(requests[0].url, 'https://api.example.test/api/chat/rooms');
  assert.equal(requests[0].signal, controller.signal);
  assert.equal(requests[0].headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(requests[2].body), { name: '제주 여행', memberIds: [7, 8] });
});

test('room detail joins room metadata and paginated messages without a nonexistent detail endpoint', async () => {
  const requests = [];
  const api = serverApi(async (url) => {
    requests.push(url);
    return reply(url === '/api/chat/rooms' ? [room] : [message(3, 9), message(2), message(1)]);
  });
  const detail = await api.getChatRoom('42');
  assert.deepEqual(detail.messages.map((item) => item.id), ['1', '2', '3']);
  assert.equal(detail.messages[0].mine, true);
  assert.equal(detail.messages[2].mine, false);
  assert.equal(detail.messages[0].senderName, '민지');
  assert.equal(detail.lastMessage, '메시지 3');
  assert.equal(detail.hasOlderMessages, false);
  assert.deepEqual(requests, ['/api/chat/rooms', '/api/chat/rooms/42/messages?size=50']);
  await api.getMessages('42', { before: '1' });
  assert.equal(requests.at(-1), '/api/chat/rooms/42/messages?size=50&before=1');
  await assert.rejects(api.getChatRoom('1000'), /찾을 수 없/);
});

test('full message page exposes older history and empty history is supported', async () => {
  const api = serverApi(async (url) => reply(url === '/api/chat/rooms' ? [room] : url.includes('before=') ? [] : Array.from({ length: 50 }, (_, index) => message(50 - index))));
  const detail = await api.getChatRoom('42');
  assert.equal(detail.hasOlderMessages, true);
  assert.equal(detail.messages[0].id, '1');
  assert.deepEqual(await api.getMessages('42', { before: '1' }), []);
});

test('polling catches up across multiple pages after a tab has been hidden', async () => {
  const requests = [];
  const data = Array.from({ length: 160 }, (_, index) => message(index + 1));
  const api = serverApi(async (url) => {
    requests.push(url);
    const before = Number(new URL(url, 'https://api.example.test').searchParams.get('before')) || Infinity;
    return reply(data.filter((item) => item.id < before).slice(-50).reverse());
  });
  const recent = await api.getNewMessages('42', { after: '10' });
  assert.equal(recent.at(-1).id, '160');
  assert.equal(recent[0].id, '1');
  assert.equal(recent.length, 160);
  assert.equal(requests.length, 4);
  assert.equal(requests.at(-1), '/api/chat/rooms/42/messages?size=50&before=11');
  const brokenCursor = serverApi(async () => reply(data.slice(-50).reverse()));
  await assert.rejects(brokenCursor.getNewMessages('42', { after: '10' }), /이전 메시지/);
});

test('send posts only content, consumes single-message response, and learns sender ID', async () => {
  const requests = [];
  let identified;
  const api = serverApi(async (url, options) => {
    requests.push({ url, ...options });
    return reply(options.method === 'POST' ? message(10) : [room]);
  }, { onMemberIdentified: (id) => { identified = id; } });
  await api.getChatRooms();
  const sent = await api.sendMessage('42', { content: ' 안녕 ', clientId: 'ignored' });
  assert.equal(sent.id, '42');
  assert.equal(sent.name, '제주 여행');
  assert.equal(sent.messages[0].mine, true);
  assert.equal(identified, 7);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].url, '/api/chat/rooms/42/messages');
  assert.deepEqual(JSON.parse(requests[1].body), { content: '안녕' });
  await assert.rejects(api.sendMessage('42', { content: ' ' }), /1~2,000/);
  await assert.rejects(api.sendMessage('42', { content: '가'.repeat(2001) }), /1~2,000/);
  await assert.rejects(api.sendMessage('42', { content: '답장', replyToId: '1' }), /텍스트/);
  await assert.rejects(api.sendMessage('42', { attachments: [{ type: 'image' }] }), /텍스트/);
  assert.equal(requests.length, 2);
});

test('pagination and send/poll races preserve history, remove duplicates, and sort numeric IDs', () => {
  const merged = mergeMessages([{ id: '10', content: 'sent' }, { id: '2', content: 'old' }], [{ id: '9' }, { id: '10', content: 'confirmed' }]);
  assert.deepEqual(merged.map((item) => item.id), ['2', '9', '10']);
  assert.equal(merged.at(-1).content, 'confirmed');
  assert.deepEqual(mergeMessages([{ id: '9007199254740993' }], [{ id: '9007199254740992' }]).map((item) => item.id), ['9007199254740992', '9007199254740993']);
});

test('member IDs and room names reject invalid payloads before contacting server', async () => {
  const api = serverApi(() => { throw new Error('should not fetch'); });
  assert.deepEqual(parseMemberIds('2, 3 2\n4'), [2, 3, 4]);
  for (const value of ['', '0', '-1', '1.2', 'abc', '1e2', '9007199254740992', Array.from({ length: 100 }, (_, i) => i + 1).join(',')]) assert.throws(() => parseMemberIds(value));
  await assert.rejects(api.createChatRoom({ name: ' ', memberIds: [2] }), /방 이름/);
  await assert.rejects(api.createChatRoom({ name: '가'.repeat(101), memberIds: [2] }), /방 이름/);
  await assert.rejects(api.createChatRoom({ name: '여행', memberIds: [] }), /회원 ID/);
});

test('missing auth, expired auth, forbidden rooms, invalid JSON and malformed responses remain visible', async () => {
  let cleared = 0;
  const expired = serverApi(async () => reply({ error: 'Unauthorized' }, 401), { onUnauthorized: () => { cleared++; } });
  await assert.rejects(expired.getChatRooms(), { status: 401 });
  assert.equal(cleared, 1);
  const missing = serverApi(() => { throw new Error('should not fetch'); }, { token: () => null });
  await assert.rejects(missing.getChatRooms(), /로그인 후/);
  await assert.rejects(serverApi(async () => reply({}, 403)).getChatRooms(), /권한/);
  await assert.rejects(serverApi(async () => reply({ wrong: true })).getChatRooms(), /응답 형식/);
  await assert.rejects(serverApi(async () => new Response('<html>oops</html>')).getChatRooms(), /응답 형식/);
  await assert.rejects(serverApi(async () => reply([{}])).getMessages('42'), /응답 형식/);
  await assert.rejects(serverApi(async () => { throw new TypeError('network'); }).getChatRooms(), /서버에 연결/);
});

test('login is unauthenticated, maps invalid credentials, and supports empty successful responses', async () => {
  let options;
  const request = createApiClient({ token: () => null, fetchImpl: async (_url, value) => { options = value; return reply({ token: 'returned-token' }); } });
  assert.deepEqual(await request('/api/members/login', { auth: false, method: 'POST', body: { loginId: 'test', password: 'test' } }), { token: 'returned-token' });
  assert.equal(options.headers.Authorization, undefined);
  assert.equal(options.headers['Content-Type'], 'application/json');
  const invalid = createApiClient({ fetchImpl: async () => reply({}, 401) });
  await assert.rejects(invalid('/api/members/login', { auth: false }), /아이디와 비밀번호/);
  assert.equal(await createApiClient({ token: () => 'token', fetchImpl: async () => reply(null, 204) })('/api/test'), null);
});

test('aborted requests propagate without being turned into network errors', async () => {
  const controller = new AbortController();
  controller.abort();
  const api = serverApi(async (_url, { signal }) => { signal.throwIfAborted(); });
  await assert.rejects(api.getChatRooms({ signal: controller.signal }), { name: 'AbortError' });
});

test('session stores only the token and learned member ID and clears both on logout/expiry', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const entries = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (key) => entries.get(key), setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) } });
  try {
    const payload = btoa(JSON.stringify({ sub: '7' }));
    saveToken(`header.${payload}.signature`);
    assert.equal(getMemberId(), '7');
    rememberMemberId(8);
    assert.equal(getMemberId(), '8');
    saveToken('opaque-token');
    assert.equal(getMemberId(), null);
    assert.equal(getToken(), 'opaque-token');
    assert.throws(() => saveToken(''), /토큰/);
    clearSession();
    assert.equal(getToken(), null);
    assert.equal(getMemberId(), null);
  } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else delete globalThis.sessionStorage;
  }
});
