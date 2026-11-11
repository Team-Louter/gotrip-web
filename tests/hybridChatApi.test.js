import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatApi } from '../src/services/chatApi.js';
import { createHybridChatApi } from '../src/services/hybridChatApi.js';

function setup({ serverFailure = null } = {}) {
  const entries = new Map(), calls = [];
  let owner = null;
  const storage = { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  const remoteRoom = { id: '42', name: '서버 여행', members: [], messages: [], lastMessage: '' };
  const serverApi = {
    capabilities: { friends: true, attachments: false, replies: false, editing: false, reactions: false }, maxMessageLength: 2000, maxRoomNameLength: 100,
    async getChatRooms() { if (serverFailure) throw serverFailure; return [remoteRoom]; },
    async getFriends() { calls.push('remote-friends'); return Array.from({ length: 10 }, (_, index) => ({ id: String(8 + index), name: `실제 회원 ${index}`, loginId: index === 0 ? 'real' : `real${index}` })); },
    async getChatRoom() { calls.push('remote-detail'); return remoteRoom; },
    async createChatRoom(input) { calls.push(['remote-create', input]); return remoteRoom; },
    async sendMessage(id, payload) { calls.push(['remote-send', id, payload]); return { ...remoteRoom, messages: [{ id: '1', content: payload.content }] }; },
  };
  const factory = (account) => createChatApi({ storage, storageKey: `local:${account}`, seedRooms: [], roomIdPrefix: 'local-' });
  const makeApi = () => createHybridChatApi({ serverApi, createLocalApi: factory, account: () => owner });
  return { api: makeApi(), makeApi, calls, storage, setOwner: (value) => { owner = value; } };
}

test('all users from the server become local recipients without any server invitation', async () => {
  const { api, calls } = setup();
  const friends = await api.getFriends();
  assert.equal(friends.length, 10);
  const room = await api.createChatRoom({ name: '체험 여행', memberIds: friends.slice(0, 3).map((friend) => friend.id) });
  assert.match(room.id, /^local-/);
  assert.equal(room.source, 'local');
  assert.equal(room.members.length, 3);
  assert.equal(room.messages.length, 0);
  assert.equal(room.capabilities.attachments, true);
  assert.equal(room.maxMessageLength, 4000);
  assert.ok(calls.every((call) => call === 'remote-friends'));
  const list = await api.getRoomList();
  assert.deepEqual(list.rooms.map((item) => item.source), ['local', 'server']);
  assert.equal(list.serverError, null);
});

test('local text, photos, links, replies, edits, reactions and deletion persist across API reloads', async () => {
  const { api, makeApi, calls } = setup();
  const room = await api.createChatRoom({ name: '여행', memberIds: ['user:real'] });
  const first = await api.sendMessage(room.id, { content: '안녕!', clientId: 'once' });
  const originalId = first.messages[0].id;
  await api.sendMessage(room.id, { content: '안녕!', clientId: 'once' });
  await api.sendMessage(room.id, { attachments: [{ type: 'image', url: 'data:image/png;base64,aGVsbG8=', name: 'image.png', size: 5 }], replyToId: originalId });
  await api.sendMessage(room.id, { attachments: [{ type: 'link', url: 'https://example.com/trip' }] });
  await api.editMessage(room.id, originalId, '수정한 인사');
  await api.setReaction(room.id, originalId, '👍', true);
  let restored = await makeApi().getChatRoom(room.id);
  assert.equal(restored.messages.length, 3);
  assert.equal(restored.messages[0].content, '수정한 인사');
  assert.deepEqual(restored.messages[0].reactions, [{ emoji: '👍', count: 1, mine: true }]);
  assert.equal(restored.messages[1].replyToId, originalId);
  assert.equal(restored.messages[1].attachments[0].type, 'image');
  assert.equal(restored.messages[2].attachments[0].type, 'link');
  await api.deleteMessage(room.id, originalId);
  restored = await makeApi().getChatRoom(room.id);
  assert.equal(restored.messages[0].deleted, true);
  assert.equal(restored.messages[1].replyToId, originalId);
  assert.ok(calls.every((call) => call === 'remote-friends'));
});

test('server errors remain visible while explicit local rooms stay usable and account storage stays separate', async () => {
  const error = new Error('서버에 연결하지 못했습니다');
  const { api, setOwner } = setup({ serverFailure: error });
  const room = await api.createChatRoom({ name: '게스트 방', memberIds: ['user:real'] });
  assert.equal((await api.getRoomList()).serverError, error);
  setOwner('member:7');
  assert.equal((await api.getRoomList()).rooms.length, 0);
  await assert.rejects(api.getChatRoom(room.id), /찾을 수 없/);
  setOwner(null);
  assert.equal((await api.getChatRoom(room.id)).name, '게스트 방');
});

test('explicit server mode preserves real creation/text transport and per-room feature limits', async () => {
  const { api, calls } = setup();
  assert.equal((await api.getFriends({ source: 'server' }))[0].id, '8');
  const room = await api.createChatRoom({ name: '서버 여행', memberIds: ['8'], source: 'server' });
  assert.equal(room.source, 'server');
  assert.equal(room.capabilities.attachments, false);
  assert.equal(room.maxMessageLength, 2000);
  await api.sendMessage(room.id, { content: '실제 전송' });
  assert.deepEqual(calls, ['remote-friends', ['remote-create', { name: '서버 여행', memberIds: ['8'] }], ['remote-send', '42', { content: '실제 전송' }]]);
});

test('a failed local save preserves previous messages instead of silently posting to the server', async () => {
  const { api, storage, calls } = setup();
  const room = await api.createChatRoom({ name: '여행', memberIds: ['user:real'] });
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  await assert.rejects(api.sendMessage(room.id, { content: '저장 실패' }), /저장/);
  assert.deepEqual((await api.getChatRoom(room.id)).messages, []);
  assert.ok(calls.every((call) => call === 'remote-friends'));
});
