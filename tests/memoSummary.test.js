import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoSummaryStore, normalizeSummary } from '../src/data/memoSummaryStore.js';
import { createMemoApi } from '../src/services/memoApi.js';
import { getAccountId, saveToken, clearSession } from '../src/api/session.js';

function memoryStorage() {
  const entries = new Map();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: (key) => entries.delete(key) };
}

test('separate summaries survive reload, stay isolated by account and can be cleared', () => {
  const storage = memoryStorage();
  let owner = 'member:7';
  const options = { storage, account: () => owner };
  const store = createMemoSummaryStore(options);
  assert.equal(store.read('12'), '');
  assert.equal(store.save('12', ' 따로 작성한\n한줄 요약 '), '따로 작성한 한줄 요약');
  assert.equal(createMemoSummaryStore(options).read('12'), '따로 작성한 한줄 요약');
  owner = 'member:8';
  assert.equal(store.read('12'), '');
  store.save('12', '다른 계정의 요약');
  owner = 'member:7';
  assert.equal(store.read('12'), '따로 작성한 한줄 요약');
  store.save('12', '  ');
  assert.equal(store.read('12'), '');
  owner = 'member:8';
  assert.equal(store.read('12'), '다른 계정의 요약');
});

test('failed local saves preserve the previously saved summary; unauthenticated saves are rejected', () => {
  const storage = memoryStorage();
  const store = createMemoSummaryStore({ storage, account: () => 'member:7' });
  store.save('12', '기존 요약');
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => store.save('12', '다른 요약'), /저장하지 못/);
  assert.equal(store.read('12'), '기존 요약');
  const anonymous = createMemoSummaryStore({ storage, account: () => null });
  assert.throws(() => anonymous.save('12', '요약'), /다시 로그인/);
  assert.equal(anonymous.read('12'), '');
  assert.equal(normalizeSummary('별도\n요약'), '별도 요약');
});

test('saving a summary never sends or changes memo content; body edits keep the saved summary', async () => {
  const summaryStore = createMemoSummaryStore({ storage: memoryStorage(), account: () => 'member:7' });
  const requests = [];
  const record = { id: 12, title: '여행', content: '서버에 저장한 본문' };
  let failDelete = true;
  const api = createMemoApi({ baseUrl: '', summaryStore, token: () => 'token', fetchImpl: async (url, options) => {
    requests.push({ url, ...options });
    if (options.method === 'DELETE') return new Response(null, { status: failDelete ? 500 : 204 });
    return new Response(options.method === 'PUT' ? null : JSON.stringify(url === '/memo' ? [record] : record), { status: 200 });
  } });
  const initial = await api.getMemos();
  assert.equal(initial[0].summary, '');
  await api.saveSummary('12', '사용자가 작성한 요약');
  assert.equal(requests.length, 1);
  assert.equal((await api.getMemo('12')).summary, '사용자가 작성한 요약');
  const changed = await api.updateMemo('12', { title: '다른 제목', body: '변경한 본문입니다' });
  assert.equal(changed.summary, '사용자가 작성한 요약');
  assert.deepEqual(JSON.parse(requests.at(-1).body), { title: '다른 제목', content: '변경한 본문입니다' });
  await assert.rejects(api.deleteMemo('12'));
  assert.equal(summaryStore.read('12'), '사용자가 작성한 요약');
  failDelete = false;
  await api.deleteMemo('12');
  assert.equal(summaryStore.read('12'), '');
});

test('account identity supports existing JWT sessions and opaque-token logins without storing the token in summary keys', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: memoryStorage() });
  try {
    saveToken(`header.${btoa(JSON.stringify({ sub: '7' }))}.signature`);
    assert.equal(getAccountId(), 'member:7');
    saveToken('opaque-token', 'test-user');
    assert.equal(getAccountId(), 'login:test-user');
    clearSession();
    assert.equal(getAccountId(), null);
  } finally {
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else delete globalThis.sessionStorage;
  }
});
