import { getAccountId } from '../api/session.js';

export function normalizeSummary(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function createMemoSummaryStore({ storage, account = getAccountId } = {}) {
  const browserStorage = () => storage ?? globalThis.localStorage;
  function key(id) {
    const owner = account();
    return owner ? `gotrip.memo.summary.v1:${encodeURIComponent(owner)}:${encodeURIComponent(id)}` : null;
  }
  return {
    read(id) {
      try { const name = key(id); return name ? browserStorage()?.getItem(name) ?? '' : ''; }
      catch { return ''; }
    },
    save(id, value) {
      const name = key(id);
      if (!name) throw new Error('한줄 요약을 저장하려면 다시 로그인해 주세요.');
      const summary = normalizeSummary(value);
      try {
        const target = browserStorage();
        if (!target) throw new Error('Storage unavailable');
        if (summary) target.setItem(name, summary);
        else target.removeItem(name);
      } catch { throw new Error('한줄 요약을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'); }
      return summary;
    },
    remove(id) {
      try { const name = key(id); if (name) browserStorage()?.removeItem(name); }
      catch { /* 서버에서 이미 삭제한 메모의 정리는 삭제 성공 여부를 바꾸지 않습니다. */ }
    },
  };
}
