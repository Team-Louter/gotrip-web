import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

let server;
let skeletons;
let PageSkeleton;

before(async () => {
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  skeletons = await server.ssrLoadModule('/src/components/Skeleton.jsx');
  ({ default: PageSkeleton } = await server.ssrLoadModule('/src/components/PageSkeleton.jsx'));
});

after(async () => { await server?.close(); });

test('skeletons announce loading once and hide placeholder shapes from assistive technology', () => {
  const html = renderToStaticMarkup(createElement(skeletons.SkeletonList, { label: '친구 목록 로딩', count: 3 }));
  assert.match(html, /role="status" aria-label="친구 목록 로딩" aria-busy="true"/);
  assert.equal((html.match(/class="skeleton-sr-only"/g) || []).length, 1);
  assert.equal((html.match(/class="skeleton-row"/g) || []).length, 3);
  assert.equal((html.match(/class="skeleton-block /g) || []).length, (html.match(/class="skeleton-block [^"]*" aria-hidden="true"/g) || []).length);
  assert.doesNotMatch(html, /<(button|input|textarea|a)\b/);
});

test('memo, map and conversation placeholders render without data or browser APIs', () => {
  for (const name of ['SkeletonEditor', 'SkeletonMap', 'SkeletonConversation', 'SkeletonProfile']) {
    const html = renderToStaticMarkup(createElement(skeletons[name]));
    assert.match(html, /role="status"/);
    assert.match(html, /aria-busy="true"/);
    assert.doesNotMatch(html, /<(button|input|textarea|a)\b/);
  }
});

test('image placeholders retain native alternate text, responsive sources and reserved dimensions', () => {
  const html = renderToStaticMarkup(createElement(skeletons.SkeletonImage, {
    src: '/photo.jpg', srcSet: '/photo@2x.jpg 2x', sizes: '72px', alt: '프로필 사진', className: 'settings-profile-image', decoding: 'async',
  }));
  assert.match(html, /class="skeleton-image settings-profile-image" data-loading="true" aria-busy="true"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<img [^>]*alt="프로필 사진"/);
  assert.match(html, /srcSet="\/photo@2x.jpg 2x"/);
  assert.match(html, /sizes="72px"/);
  assert.match(html, /decoding="async"/);
});

test('all application pages have the matching route skeleton', () => {
  const routes = {
    '/login': 'skeleton-auth--login',
    '/registration': 'skeleton-auth--registration',
    '/registration/password': 'skeleton-auth--registration',
    '/registration/terms': 'skeleton-auth--registration',
    '/home': 'skeleton-home-page',
    '/friends': 'skeleton-friends-page',
    '/map': 'skeleton-map-page',
    '/places': 'skeleton-places-page',
    '/calendar': 'skeleton-calendar-page',
    '/chat': 'skeleton-chat-page',
    '/chat/rooms/1': 'skeleton-chat-page',
    '/memo': 'skeleton-memo-page',
    '/payment': 'skeleton-payment-page',
    '/settings': 'skeleton-settings-page',
  };
  for (const [route, className] of Object.entries(routes)) {
    const html = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [route] }, createElement(PageSkeleton)));
    assert.ok(html.includes(className), `${route}: missing ${className}`);
    assert.match(html, /role="status"/);
    assert.doesNotMatch(html, /<(button|input|textarea|a)\b/);
  }
});
