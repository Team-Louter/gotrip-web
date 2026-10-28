import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoApi, matchesMemo } from '../src/services/memoApi.js';

const record = { id: 12, title: '제주 여행', content: '첫째 날 카페 방문\n주차 시간 확인하기', createdAt: '2026-10-27T12:00:00Z', updatedAt: '2026-10-27T12:00:00Z' };
const response = (body, status = 200) => new Response(body == null ? null : JSON.stringify(body), { status });
const apiWith = (fetchImpl, options = {}) => createMemoApi({ baseUrl: 'https://api.example.test/', token: () => 'memo-test-token', fetchImpl, ...options });

test('memo list and detail use Swagger paths, Bearer token and content-to-body mapping', async () => {
  const requests = [];
  const api = apiWith(async (url, options) => {
    requests.push({ url, ...options });
    return response(url.endsWith('/memo') ? [record] : record);
  });
  const controller = new AbortController();
  const list = await api.getMemos({ signal: controller.signal });
  assert.equal(list[0].id, '12');
  assert.equal(list[0].body, record.content);
  assert.equal(list[0].dirty, false);
  assert.equal(list[0].isNew, false);
  assert.equal(list[0].updatedAt, record.updatedAt);
  assert.equal((await api.getMemo('12')).title, '제주 여행');
  assert.equal(requests[0].url, 'https://api.example.test/memo');
  assert.equal(requests[1].url, 'https://api.example.test/memo/12');
  assert.equal(requests[0].headers.Authorization, 'Bearer memo-test-token');
  assert.equal(requests[0].signal, controller.signal);
  assert.equal(requests[0].body, undefined);
});

test('create consumes a numeric ID, update accepts empty 200 and delete accepts 204 without extra requests', async () => {
  const requests = [];
  const api = apiWith(async (url, options) => {
    requests.push({ url, ...options });
    return response(options.method === 'POST' ? 23 : null, options.method === 'DELETE' ? 204 : 200);
  });
  const created = await api.createMemo({ title: ' 새 여행 ', body: '  내용은 다섯 자 이상\n줄바꿈 유지  ', summary: 'not a server field' });
  assert.equal(created.id, '23');
  assert.equal(created.title, '새 여행');
  assert.equal(created.body, '  내용은 다섯 자 이상\n줄바꿈 유지  ');
  assert.equal(created.dirty, false);
  assert.deepEqual(JSON.parse(requests[0].body), { title: '새 여행', content: created.body });
  const updated = await api.updateMemo(created.id, { title: '변경 제목', body: '변경한 본문 내용' });
  assert.equal(updated.id, '23');
  assert.equal(updated.body, '변경한 본문 내용');
  await api.deleteMemo('23');
  assert.deepEqual(requests.map(({ url, method }) => [url, method]), [
    ['https://api.example.test/memo/new', 'POST'],
    ['https://api.example.test/memo/edit/23', 'PUT'],
    ['https://api.example.test/memo/delete/23', 'DELETE'],
  ]);
  assert.equal(requests[2].body, undefined);
});

test('memo validation rejects invalid titles, short content and invalid IDs before network calls', async () => {
  let requests = 0;
  const api = apiWith(async () => { requests++; return response(null); });
  await assert.rejects(api.createMemo({ title: ' ', body: '올바른 내용입니다' }), /제목/);
  for (const body of ['', '네글자임', '    ', ' ab ']) await assert.rejects(api.createMemo({ title: '여행', body }), /5자/);
  await assert.rejects(api.updateMemo('12', { title: '여행', body: '짧음' }), /5자/);
  for (const id of ['0', '-1', '12/3', 'abc', null, '1e2']) {
    await assert.rejects(api.getMemo(id), /메모 ID/);
    await assert.rejects(api.deleteMemo(id), /메모 ID/);
  }
  assert.equal(requests, 0);
  const exact = apiWith(async () => response(1));
  assert.equal((await exact.createMemo({ title: '여행', body: '다섯글자임' })).body, '다섯글자임');
});

test('empty lists, malformed responses and mismatched detail IDs are handled explicitly', async () => {
  assert.deepEqual(await apiWith(async () => response([])).getMemos(), []);
  for (const result of [{ memos: [] }, null, '<html>frontend route</html>', [{}]]) await assert.rejects(apiWith(async () => response(result)).getMemos(), /응답 형식/);
  await assert.rejects(apiWith(async () => response({ ...record, id: 99 })).getMemo('12'), /응답이 다릅니다/);
  for (const result of [null, {}, 0, -1, 'oops']) await assert.rejects(apiWith(async () => response(result)).createMemo({ title: '제목', body: '유효한 내용입니다' }), /응답 형식|메모 ID/);
});

test('authentication, server errors and cancellation use the shared client without dummy fallback', async () => {
  let cleared = 0;
  const expired = apiWith(async () => response({}, 401), { onUnauthorized: () => { cleared++; } });
  await assert.rejects(expired.getMemos(), { status: 401 });
  assert.equal(cleared, 1);
  await assert.rejects(apiWith(async () => response({}, 403)).getMemo('12'), /권한/);
  await assert.rejects(apiWith(async () => response({ message: '메모를 찾을 수 없습니다.' }, 404)).getMemo('12'), /찾을 수 없/);
  await assert.rejects(apiWith(async () => response({}, 500)).updateMemo('12', { title: '제목', body: '유효한 내용입니다' }), { status: 500 });
  await assert.rejects(apiWith(() => { throw new TypeError('offline'); }).deleteMemo('12'), /서버에 연결/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(apiWith(async (_url, { signal }) => { signal.throwIfAborted(); }).getMemos({ signal: controller.signal }), { name: 'AbortError' });
});

test('search includes title, body and independently saved summary without changing their contents', () => {
  const memo = { title: '제주 여행', body: '카페 앞 방문 기록\n주차 시간 확인', summary: '다음 여행 체크리스트' };
  assert.equal(matchesMemo(memo, '제주 주차'), true);
  assert.equal(matchesMemo(memo, '카페앞'), true);
  assert.equal(matchesMemo(memo, '제주 오사카'), false);
  assert.equal(matchesMemo(memo, '   '), true);
  assert.equal(matchesMemo(memo, '다음여행'), true);
  assert.equal(memo.summary, '다음 여행 체크리스트');
  assert.ok(memo.body.includes('\n'));
});
