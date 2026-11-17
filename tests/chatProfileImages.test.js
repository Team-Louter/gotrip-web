import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { createServerChatApi } from '../src/services/serverChatApi.js';

let vite;
let profileApi;
let ChatHome;

before(async () => {
  vite = await createServer({ configFile: false, envFile: false, esbuild: { jsx: 'automatic' },
    server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'silent' });
  profileApi = await vite.ssrLoadModule('/src/services/profileApi.js');
  ChatHome = (await vite.ssrLoadModule('/src/files/chatHome.jsx')).default;
});

after(async () => { await vite?.close(); });

test('chat renders counterpart and sender photos from normalized backend responses', async () => {
  const imageUrl = '/api/profile-images/00000000-0000-0000-0000-000000000017.png';
  const api = createServerChatApi({ token: () => 'token', currentMemberId: () => '7', fetchImpl: async (url) =>
    new Response(JSON.stringify(url === '/api/chat/rooms'
      ? [{ id: 42, name: '여행', counterpartProfileImageUrl: imageUrl }]
      : [{ id: 1, roomId: 42, senderId: 17, senderNickname: '친구', senderProfileImageUrl: imageUrl,
        content: '여행 가자', createdAt: '2026-11-16T12:00:00Z' }])) });

  const room = await api.getChatRoom('42');
  const html = renderToStaticMarkup(createElement(ChatHome, { room, onRoomUpdated() {} }));

  assert.deepEqual([...html.matchAll(/<img class="(room-profile|msg-profile)" src="([^"]+)"/g)]
    .map(([, name, src]) => [name, src]), [['room-profile', imageUrl], ['msg-profile', imageUrl]]);
});

test('room without a counterpart photo never borrows another group members photo', () => {
  const room = { counterpartProfileImageUrl: null, messages: [
    { mine: false, senderProfileImageUrl: '/api/profile-images/00000000-0000-0000-0000-000000000042.png' },
  ] };

  const image = profileApi.chatCounterpartProfileImage(room);

  assert.equal(image, profileApi.DEFAULT_PROFILE_IMAGE);
});
