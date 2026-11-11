import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAT_STORAGE_KEY, createChatApi } from '../src/services/chatApi.js';

function memoryStorage() {
  const entries = new Map();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}

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

test('aborted requests and unknown room IDs are handled explicitly', async () => {
  const api = createChatApi({ storage: memoryStorage() });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(api.getChatRooms({ signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(api.getChatRoom('does-not-exist'), /찾을 수 없/);
});
