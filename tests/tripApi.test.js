import test from 'node:test';
import assert from 'node:assert/strict';
import { createTripApi } from '../src/services/tripApi.js';
import { createPlaceStore } from '../src/data/placeStore.js';

test('calendar registration posts hour/minute/content only and keeps the selected date local', async () => {
  const requests = [];
  const api = createTripApi({ baseUrl: '', token: () => 'token', fetchImpl: async (url, options) => {
    requests.push({ url, ...options }); return new Response(JSON.stringify({ id: 9 }));
  } });
  const event = await api.addSchedule({ date: '2026-10-28', time: '09:05', content: ' 카페에서 점심 먹기 ' });
  assert.equal(event.serverId, '9');
  assert.equal(event.serverSynced, true);
  assert.equal(event.date, '2026-10-28');
  assert.deepEqual(JSON.parse(requests[0].body), { hour: 9, minute: 5, content: '카페에서 점심 먹기' });
  assert.equal(requests[0].url, '/calendar');
  assert.equal(requests[0].headers.Authorization, 'Bearer token');
  for (const patch of [{ content: '짧음' }, { time: '24:00' }, { date: '2026-02-30' }]) await assert.rejects(api.addSchedule({ date: '2026-10-28', time: '09:05', content: '올바른 일정 내용', ...patch }));
  assert.equal(requests.length, 1);
});

test('place creation consumes text or explicit IDs without extracting IDs from success messages', async () => {
  const requests = [];
  let result = '주소가 저장되었습니다';
  const api = createTripApi({ baseUrl: '', token: () => 'token', fetchImpl: async (url, options) => {
    requests.push({ url, ...options }); return new Response(typeof result === 'string' ? result : JSON.stringify(result));
  } });
  const place = await api.addPlace(' 서울시 종로구 ');
  assert.equal(place.serverId, null);
  assert.equal(place.address, '서울시 종로구');
  assert.deepEqual(JSON.parse(requests[0].body), { address: '서울시 종로구' });
  assert.equal(requests[0].url, '/schedule/map/new');
  result = '42';
  assert.equal((await api.addPlace('서울시 종로구')).serverId, '42');
  result = '42번지가 저장되었습니다';
  assert.equal((await api.addPlace('서울시 종로구')).serverId, null);
  await api.deletePlace('42');
  assert.equal(requests.at(-1).url, '/schedule/map/42');
  assert.equal(requests.at(-1).method, 'DELETE');
  for (const id of ['', '0', '-1', '1/2', '1e2', 9007199254740992]) await assert.rejects(api.deletePlace(id), /장소 ID/);
  await assert.rejects(api.addPlace(' '), /주소/);
});

test('trip errors and aborts propagate without claiming server success', async () => {
  const failure = createTripApi({ token: () => 'token', fetchImpl: async () => new Response(JSON.stringify({ message: '등록 실패' }), { status: 500 }) });
  await assert.rejects(failure.addSchedule({ date: '2026-10-28', time: '09:00', content: '올바른 일정 내용' }), /등록 실패/);
  await assert.rejects(failure.addPlace('서울시'), /등록 실패/);
  const controller = new AbortController(); controller.abort();
  const cancelled = createTripApi({ token: () => 'token', fetchImpl: async (_url, { signal }) => { signal.throwIfAborted(); } });
  await assert.rejects(cancelled.deletePlace('12', { signal: controller.signal }), { name: 'AbortError' });
});

test('place receipts persist per account and storage failure does not pretend to undo a server mutation', () => {
  const entries = new Map();
  const storage = { getItem: (key) => entries.get(key), setItem: (key, value) => entries.set(key, value) };
  let owner = 'one';
  const store = createPlaceStore({ storage, account: () => owner });
  const records = [{ id: 'receipt-1', address: '서울시', serverId: null }];
  assert.equal(store.save(records), true);
  assert.deepEqual(createPlaceStore({ storage, account: () => owner }).read(), records);
  owner = 'two'; assert.deepEqual(store.read(), []);
  owner = 'one'; storage.setItem = () => { throw new Error('Quota'); };
  assert.equal(store.save([]), false);
  assert.deepEqual(store.read(), records);
});
