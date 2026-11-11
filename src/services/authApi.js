import { apiRequest, createApiClient } from '../api/client.js';
import { saveToken } from '../api/session.js';
import { isValidSignupPassword } from '../data/signupValidation.js';

const environment = import.meta.env ?? {};
const localAuthBaseUrl = 'http://localhost:8080';
const usesLocalAuth = environment.VITE_API_BASE_URL?.replace(/\/+$/, '') === localAuthBaseUrl;
const AUTH_PREFIX = environment.VITE_AUTH_API_PREFIX || (usesLocalAuth ? '/api/auth' : '/api/members');

export function createAuthApi({ request = apiRequest, prefix, storeToken = saveToken } = {}) {
  const authPrefix = prefix ?? AUTH_PREFIX;
  const base = authPrefix.replace(/\/+$/, '');
  const splitLocalSignupLogin = prefix == null && !environment.VITE_AUTH_API_PREFIX && usesLocalAuth;
  const loginBaseUrl = environment.VITE_LOGIN_API_BASE_URL
    || (splitLocalSignupLogin ? 'https://api-gotrip.prot.kr' : '');
  const loginRequest = loginBaseUrl && request === apiRequest
    ? createApiClient({ baseUrl: loginBaseUrl.replace(/\/+$/, '') })
    : request;
  const loginPath = loginBaseUrl ? '/api/members/login' : `${base}/login`;

  async function login({ loginId, password }) {
    const result = await loginRequest(loginPath, {
      method: 'POST', auth: false, body: { loginId: loginId.trim(), password },
    });
    if (typeof result?.token !== 'string' || !result.token.trim()) throw new Error('로그인 응답에 토큰이 없습니다.');
    storeToken(result.token, loginId.trim());
    return result;
  }

  async function signUp(payload) {
    const { loginId, password, passwordConfirm, birthDate, email, nickname, termsAccepted, marketingAccepted } = payload;
    const body = {
      loginId: loginId?.trim(), password, passwordConfirm,
      birthDate: birthDate?.trim().replace(/[-/]/g, ''),
      email: email?.trim(), nickname: nickname?.trim(),
    };
    if (!body.loginId || !body.nickname) throw new Error('아이디와 닉네임을 입력해주세요.');
    if (!isValidSignupPassword(password)) throw new Error('비밀번호는 8~20자이며 대문자·소문자·숫자·특수문자 중 3종 이상 포함하고 같은 문자를 3번 연속 사용할 수 없습니다.');
    if (password !== passwordConfirm) throw new Error('비밀번호가 동일하지 않습니다. 회원 정보를 다시 확인해주세요.');
    if (!/^\d{8}$/.test(body.birthDate || '')) throw new Error('생년월일을 YYYYMMDD 형식으로 입력해주세요.');
    if (!/^\S+@\S+\.\S+$/.test(body.email || '')) throw new Error('올바른 이메일 주소를 입력해주세요.');
    // 로컬 인증 서버는 약관 동의 필드를 받고, 운영 Swagger는 회원 필드만 받습니다.
    if (base === '/api/auth') Object.assign(body, { termsAccepted, marketingAccepted });
    return request(`${base}/signup`, { method: 'POST', auth: false, body });
  }

  return { login, signUp, logIn: (loginId, password) => login({ loginId, password }) };
}

export const { login, logIn, signUp } = createAuthApi();
