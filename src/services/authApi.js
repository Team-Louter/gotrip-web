import { apiRequest } from '../api/client.js';
import { saveToken } from '../api/session.js';

const environment = import.meta.env ?? {};
const AUTH_PREFIX = environment.VITE_AUTH_API_PREFIX || '/api/members';

export function createAuthApi({ request = apiRequest, prefix = AUTH_PREFIX, storeToken = saveToken } = {}) {
  const base = prefix.replace(/\/+$/, '');

  async function login({ loginId, password }) {
    const result = await request(`${base}/login`, {
      method: 'POST', auth: false, body: { loginId: loginId.trim(), password },
    });
    if (typeof result?.token !== 'string' || !result.token.trim()) throw new Error('로그인 응답에 토큰이 없습니다.');
    storeToken(result.token, loginId.trim());
    return result;
  }

  async function signUp(payload) {
    const { loginId, password, passwordConfirm, birthDate, email, nickname, termsAccepted, marketingAccepted } = payload;
    const body = { loginId, password, passwordConfirm, birthDate, email, nickname };
    // 저장소의 로컬 인증 서버는 약관 동의도 받고, 운영 서버는 Swagger의 회원 필드를 받습니다.
    if (base === '/api/auth') Object.assign(body, { termsAccepted, marketingAccepted });
    return request(`${base}/signup`, { method: 'POST', auth: false, body });
  }

  return { login, signUp, logIn: (loginId, password) => login({ loginId, password }) };
}

export const { login, logIn, signUp } = createAuthApi();
