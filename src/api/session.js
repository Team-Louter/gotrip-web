const TOKEN_KEY = 'gotrip.auth.token';
const MEMBER_KEY = 'gotrip.auth.memberId';
const ACCOUNT_KEY = 'gotrip.auth.accountId';

export function getToken() {
  return globalThis.sessionStorage?.getItem(TOKEN_KEY) ?? null;
}

export function clearSession() {
  globalThis.sessionStorage?.removeItem(TOKEN_KEY);
  globalThis.sessionStorage?.removeItem(MEMBER_KEY);
  globalThis.sessionStorage?.removeItem(ACCOUNT_KEY);
}

export function saveToken(token, loginId) {
  if (typeof token !== 'string' || !token.trim()) throw new Error('로그인 응답에 토큰이 없습니다.');
  clearSession();
  globalThis.sessionStorage.setItem(TOKEN_KEY, token);
  if (loginId) globalThis.sessionStorage.setItem(ACCOUNT_KEY, loginId);
}

export function getAccountId() {
  if (!getToken()) return null;
  try {
    const part = getToken().split('.')[1];
    const claims = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    const id = claims.memberId ?? claims.userId ?? claims.sub;
    if (typeof id === 'string' || typeof id === 'number') return `member:${id}`;
  } catch { /* 토큰에 회원 식별자가 없으면 로그인 때 확인한 아이디를 사용합니다. */ }
  const loginId = globalThis.sessionStorage?.getItem(ACCOUNT_KEY);
  return loginId ? `login:${loginId}` : null;
}

export function rememberMemberId(id) {
  if (id != null) globalThis.sessionStorage?.setItem(MEMBER_KEY, String(id));
}

export function getMemberId() {
  const saved = globalThis.sessionStorage?.getItem(MEMBER_KEY);
  if (saved) return saved;
  // JWT 정보는 내 말풍선 표시용입니다. 실제 접근 권한은 서버가 검증합니다.
  try {
    const part = getToken()?.split('.')[1];
    const claims = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    const id = claims.memberId ?? claims.userId ?? claims.sub;
    return /^\d+$/.test(String(id)) ? String(id) : null;
  } catch { return null; }
}
