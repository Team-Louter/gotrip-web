// Keep signup/login pointed at the auth server even when the developer has not
// created a local .env file from .env.example yet.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

async function readApiResponse(response, fallbackMessage) {
  const raw = await response.text();
  let body = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON server response */ }
  if (!response.ok) {
    throw new Error(body.message || body.error || `인증 서버 오류 (${response.status}). 백엔드 서버가 실행 중인지 확인해주세요.`);
  }
  if (!body.token) throw new Error(fallbackMessage);
  return body;
}

export async function signUp(payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 백엔드 실행 상태와 VITE_API_BASE_URL을 확인해주세요.');
  }

  return readApiResponse(response, '회원가입 응답에 토큰이 없습니다. 백엔드 API 응답을 확인해주세요.');
}

export async function logIn(loginId, password) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ loginId, password }),
    });
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 백엔드 실행 상태와 VITE_API_BASE_URL을 확인해주세요.');
  }
  return readApiResponse(response, '로그인 응답에 토큰이 없습니다. 백엔드 API 응답을 확인해주세요.');
}
