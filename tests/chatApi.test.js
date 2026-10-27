import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAT_STORAGE_KEY, createChatApi } from '../src/services/chatApi.js';

function memoryStorage() {
  const entries = new Map();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test('mock search matches room names, messages, and members', async () => {
  const api = createChatApi({ storage: memoryStorage() });
  assert.deepEqual((await api.getChatRooms({ query: '제 주' })).map((room) => room.id), ['jeju']);
  assert.deepEqual((await api.getChatRooms({ query: '라멘' })).map((room) => room.id), ['osaka']);
  assert.ok((await api.getChatRooms({ query: '김민지' })).some((room) => room.id === 'jeju'));
  assert.deepEqual(await api.getChatRooms({ query: '없는방이름' }), []);
});

test('mock room creation persists selected friends and can be queried after reload', async () => {
  const storage = memoryStorage();
  const api = createChatApi({ storage });
  const created = await api.createChatRoom({ name: '  가을 제주 여행  ', memberIds: ['friend-minji', 'friend-seoyeon', 'friend-minji'] });
  assert.equal(created.name, '가을 제주 여행');
  assert.deepEqual(created.members.map((friend) => friend.id), ['friend-minji', 'friend-seoyeon']);
  assert.equal(JSON.parse(storage.getItem(CHAT_STORAGE_KEY))[0].id, created.id);
  const reloaded = createChatApi({ storage });
  assert.equal((await reloaded.getChatRoom(created.id)).name, '가을 제주 여행');
  assert.equal((await reloaded.getChatRooms({ query: '가을' })).length, 1);
});

test('invalid create requests and storage errors never add rooms', async () => {
  const storage = memoryStorage();
  const api = createChatApi({ storage });
  const initialCount = (await api.getChatRooms()).length;
  await assert.rejects(api.createChatRoom({ name: '  ', memberIds: ['friend-minji'] }), /방 이름/);
  await assert.rejects(api.createChatRoom({ name: '여행', memberIds: [] }), /친구/);
  await assert.rejects(api.createChatRoom({ name: '여행', memberIds: ['unknown'] }), /친구 목록/);
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  await assert.rejects(api.createChatRoom({ name: '여행', memberIds: ['friend-minji'] }), /저장/);
  assert.equal((await api.getChatRooms()).length, initialCount);
});

test('HTTP adapters send search, detail, create payload, and friends requests', async () => {
  const requests = [];
  const controller = new AbortController();
  const api = createChatApi({ useMock: false, baseUrl: 'https://api.example.test/', fetchImpl: async (url, options) => {
    requests.push({ url, ...options });
    if (url.endsWith('/api/friends')) return reply({ data: { friends: [{ id: 7, name: '김민지' }] } });
    if (options.method === 'POST') return reply({ data: { room: { id: 42, name: '제주 여행', members: [{ id: '7', name: '김민지' }] } } }, 201);
    if (url.includes('/api/chat/rooms/')) return reply({ data: { id: 42, name: '제주 여행' } });
    return reply({ data: { rooms: [{ id: 42, name: '제주 여행', members: [] }] } });
  } });
  assert.equal((await api.getChatRooms({ query: '제주', signal: controller.signal }))[0].id, '42');
  assert.equal((await api.getChatRoom('42/a')).id, '42');
  assert.equal((await api.createChatRoom({ name: ' 제주 여행 ', memberIds: ['7'] })).id, '42');
  assert.equal((await api.getFriends())[0].id, '7');
  assert.equal(requests[0].url, 'https://api.example.test/api/chat/rooms?q=%EC%A0%9C%EC%A3%BC');
  assert.equal(requests[0].signal, controller.signal);
  assert.equal(requests[1].url, 'https://api.example.test/api/chat/rooms/42%2Fa');
  assert.equal(requests[2].method, 'POST');
  assert.deepEqual(JSON.parse(requests[2].body), { name: '제주 여행', memberIds: ['7'] });
  assert.equal(requests[2].headers['Content-Type'], 'application/json');
  assert.ok(requests.every((request) => request.credentials === 'include'));
});

test('HTTP failures stay visible without falling back to dummy rooms', async () => {
  const api = createChatApi({ useMock: false, fetchImpl: async () => reply({ message: '로그인이 필요합니다.' }, 401) });
  await assert.rejects(api.getChatRooms(), /로그인이 필요/);
  await assert.rejects(api.createChatRoom({ name: '여행', memberIds: ['7'] }), /로그인이 필요/);
  const malformed = createChatApi({ useMock: false, fetchImpl: async () => reply({ wrong: true }) });
  await assert.rejects(malformed.getChatRooms(), /응답 형식/);
});

test('aborted requests and unknown room IDs are handled explicitly', async () => {
  const api = createChatApi({ storage: memoryStorage() });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(api.getChatRooms({ signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(api.getChatRoom('does-not-exist'), /찾을 수 없/);
});
