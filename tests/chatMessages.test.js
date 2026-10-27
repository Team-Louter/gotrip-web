import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatApi } from '../src/services/chatApi.js';
import { httpUrl, normalizeAttachment, validateImages } from '../src/data/chatMessages.js';

function memoryStorage() {
  const entries = new Map();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}

test('messages, replies, and recent previews persist across room reloads', async () => {
  const storage = memoryStorage();
  const api = createChatApi({ storage });
  const room = await api.sendMessage('jeju', { content: '  좋아, 가 보자!  ', replyToId: 'jeju-1', clientId: 'send-once' });
  const message = room.messages.at(-1);
  assert.equal(message.content, '좋아, 가 보자!');
  assert.equal(message.replyToId, 'jeju-1');
  assert.equal(message.mine, true);
  assert.equal(room.lastMessage, '좋아, 가 보자!');
  const again = await api.sendMessage('jeju', { content: '좋아, 가 보자!', clientId: 'send-once' });
  assert.equal(again.messages.length, room.messages.length);
  assert.equal((await createChatApi({ storage }).getChatRoom('jeju')).messages.at(-1).id, message.id);
  await assert.rejects(api.sendMessage('jeju', { content: '답장', replyToId: 'not-there' }), /답장/);
  await assert.rejects(api.sendMessage('jeju', { content: '  ' }), /메시지/);
});

test('reactions toggle idempotently, and editing/deleting enforces message ownership', async () => {
  const api = createChatApi({ storage: memoryStorage() });
  const first = await api.setReaction('jeju', 'jeju-1', '👍', true);
  assert.deepEqual(first.messages[0].reactions, [{ emoji: '👍', count: 1, mine: true }]);
  const repeated = await api.setReaction('jeju', 'jeju-1', '👍', true);
  assert.equal(repeated.messages[0].reactions[0].count, 1);
  const removed = await api.setReaction('jeju', 'jeju-1', '👍', false);
  assert.deepEqual(removed.messages[0].reactions, []);
  await assert.rejects(api.editMessage('jeju', 'jeju-1', '다른 사람 수정'), /내 메시지/);
  await assert.rejects(api.deleteMessage('jeju', 'jeju-1'), /내 메시지/);
  const edited = await api.editMessage('jeju', 'jeju-2', '정말 기대된다');
  assert.equal(edited.messages[1].edited, true);
  const deleted = await api.deleteMessage('jeju', 'jeju-2');
  assert.equal(deleted.messages[1].deleted, true);
  assert.equal(deleted.messages[1].content, '');
  await assert.rejects(api.setReaction('jeju', 'jeju-2', '👍', true), /찾을 수/);
});

test('attachment-only messages support valid images and links while rejecting unsafe URLs', async () => {
  const api = createChatApi({ storage: memoryStorage() });
  const image = { type: 'image', url: 'data:image/png;base64,aGVsbG8=', name: '여행.png', size: 5 };
  const photoRoom = await api.sendMessage('jeju', { attachments: [image] });
  assert.equal(photoRoom.lastMessage, '사진');
  const room = await api.sendMessage('jeju', { attachments: [{ type: 'link', url: 'https://example.com/travel' }] });
  assert.equal(room.messages.at(-1).attachments[0].url, 'https://example.com/travel');
  assert.equal(room.lastMessage, '링크');
  assert.equal(httpUrl(' https://example.com '), 'https://example.com/');
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello']) {
    assert.throws(() => normalizeAttachment({ type: 'link', url }), /http/);
    assert.throws(() => normalizeAttachment({ type: 'image', url }), /http/);
  }
  assert.throws(() => validateImages([{ type: 'image/svg+xml', size: 20 }]), /이미지/);
  assert.throws(() => validateImages([{ type: 'image/png', size: 3 * 1024 * 1024 }]), /2MB/);
  assert.throws(() => validateImages(Array.from({ length: 4 }, () => ({ type: 'image/png', size: 1 }))), /3장/);
});

test('message persistence failures preserve previous messages', async () => {
  const storage = memoryStorage();
  const api = createChatApi({ storage });
  const before = await api.getChatRoom('jeju');
  storage.setItem = () => { throw new Error('Quota'); };
  await assert.rejects(api.sendMessage('jeju', { content: '저장 실패' }), /저장/);
  await assert.rejects(api.editMessage('jeju', 'jeju-2', '저장 실패'), /저장/);
  assert.deepEqual(await api.getChatRoom('jeju'), before);
});

test('HTTP message actions use documented endpoints and multipart uploads', async () => {
  const requests = [];
  const room = { id: 'room-1', name: '여행방', messages: [] };
  const api = createChatApi({ useMock: false, fetchImpl: async (url, options) => {
    requests.push({ url, ...options });
    return { ok: true, status: 200, json: async () => url.endsWith('/uploads') ? { attachments: [{ type: 'image', url: 'https://example.test/image.png', name: 'image.png' }] } : room };
  } });
  await api.sendMessage('room-1', { content: '안녕', clientId: 'unique' });
  await api.editMessage('room-1', 'm-1', '수정');
  await api.deleteMessage('room-1', 'm-1');
  await api.setReaction('room-1', 'm-1', '👍', true);
  await api.uploadImages([new File(['image'], 'image.png', { type: 'image/png' })]);
  assert.equal(requests[0].url, '/api/chat/rooms/room-1/messages');
  assert.equal(JSON.parse(requests[0].body).clientId, 'unique');
  assert.equal(requests[1].method, 'PATCH');
  assert.equal(requests[2].method, 'DELETE');
  assert.equal(requests[3].method, 'PUT');
  assert.deepEqual(JSON.parse(requests[3].body), { emoji: '👍', active: true });
  assert.equal(requests[4].url, '/api/chat/uploads');
  assert.ok(requests[4].body instanceof FormData);
  assert.equal(requests[4].headers['Content-Type'], undefined);
});
