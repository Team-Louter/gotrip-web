import { API_BASE_URL, createApiClient } from '../api/client.js';
import { createMemoSummaryStore } from '../data/memoSummaryStore.js';

const environment = import.meta.env ?? {};
// /memo는 화면 주소와 겹치므로 개발에서는 별도 프록시 경로를 사용합니다.
const MEMO_BASE_URL = environment.DEV ? '/backend' : (API_BASE_URL || '/backend');

function memoId(value) {
  const id = String(value);
  if (!/^[1-9]\d*$/.test(id)) throw new Error('메모 ID를 확인해 주세요.');
  return id;
}

export function normalizeMemo(value) {
  if (value?.id == null || typeof value.title !== 'string' || typeof value.content !== 'string') {
    throw new Error('메모 응답 형식을 확인해 주세요.');
  }
  return { id: memoId(value.id), title: value.title, body: value.content, createdAt: value.createdAt, updatedAt: value.updatedAt, isNew: false, dirty: false };
}

function memoPayload({ title, body }) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('메모 제목을 입력해 주세요.');
  if (typeof body !== 'string' || body.trim().length < 5) throw new Error('메모 내용은 5자 이상 입력해 주세요.');
  return { title: title.trim(), content: body };
}

export function matchesMemo(memo, query) {
  const normalize = (value) => String(value).normalize('NFKC').toLocaleLowerCase();
  const text = normalize(`${memo.title} ${memo.body} ${memo.summary ?? ''}`);
  const flat = text.replace(/\s+/g, '');
  return normalize(query).split(/\s+/).filter(Boolean).every((word) => text.includes(word) || flat.includes(word));
}

export function createMemoApi(options = {}) {
  const { summaryStore = createMemoSummaryStore(), ...httpOptions } = options;
  const request = createApiClient({ baseUrl: MEMO_BASE_URL, ...httpOptions });
  const withSummary = (value) => { const memo = normalizeMemo(value); return { ...memo, summary: summaryStore.read(memo.id) }; };
  return {
    async getMemos({ signal } = {}) {
      const result = await request('/memo', { signal });
      if (!Array.isArray(result)) throw new Error('메모 목록 응답 형식을 확인해 주세요.');
      return result.map(withSummary);
    },
    async getMemo(id, { signal } = {}) {
      const result = withSummary(await request(`/memo/${memoId(id)}`, { signal }));
      if (result.id !== String(id)) throw new Error('요청한 메모와 응답이 다릅니다.');
      return result;
    },
    async createMemo(memo, { signal } = {}) {
      const body = memoPayload(memo);
      const id = await request('/memo/new', { method: 'POST', body, signal });
      // 생성은 ID 하나만 반환하고, 수정·삭제는 본문 없이 성공할 수 있습니다.
      if (!['number', 'string'].includes(typeof id)) throw new Error('메모 생성 응답 형식을 확인해 주세요.');
      return withSummary({ id: memoId(id), ...body });
    },
    async updateMemo(id, memo, { signal } = {}) {
      const body = memoPayload(memo);
      await request(`/memo/edit/${memoId(id)}`, { method: 'PUT', body, signal });
      return withSummary({ id, ...body });
    },
    async deleteMemo(id, { signal } = {}) {
      await request(`/memo/delete/${memoId(id)}`, { method: 'DELETE', signal });
      summaryStore.remove(id);
    },
    async saveSummary(id, value) { return summaryStore.save(memoId(id), value); },
  };
}

export const memoApi = createMemoApi();
