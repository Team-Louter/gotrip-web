import { clearSession, getToken } from './session.js';

const environment = import.meta.env ?? {};
// 개발 중에는 Vite 프록시로 요청해 백엔드의 CORS 설정에 의존하지 않습니다.
export const API_BASE_URL = environment.DEV ? '' : (environment.VITE_API_BASE_URL ?? '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function createApiClient({ baseUrl = API_BASE_URL, fetchImpl = globalThis.fetch, token = getToken, onUnauthorized = clearSession } = {}) {
  return async function request(path, { auth = true, body, headers, ...options } = {}) {
    const accessToken = auth ? token() : null;
    if (auth && !accessToken) throw new ApiError('로그인 후 이용해 주세요.', 401);
    let response;
    try {
      response = await fetchImpl(`${baseUrl.replace(/\/+$/, '')}${path}`, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...(body != null ? { 'Content-Type': 'application/json' } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...headers,
        },
        ...(body != null ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (error.name === 'AbortError' || options.signal?.aborted) throw error;
      throw new ApiError('서버에 연결하지 못했어요. 네트워크 연결을 확인하고 다시 시도해 주세요.', 0);
    }
    const text = await response.text();
    let result;
    try { result = text ? JSON.parse(text) : null; } catch { result = text; }
    if (!response.ok) {
      if (response.status === 401 && auth) onUnauthorized();
      const message = response.status === 401
        ? (auth ? '로그인이 만료되었어요. 다시 로그인해 주세요.' : '아이디와 비밀번호를 확인해 주세요.')
        : response.status === 403 ? '요청한 항목에 접근할 권한이 없습니다.'
          : result?.message || result?.detail || `요청에 실패했어요. (${response.status})`;
      throw new ApiError(message, response.status);
    }
    return result;
  };
}

export const apiRequest = createApiClient();
