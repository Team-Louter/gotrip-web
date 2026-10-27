import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';

const scrypt = promisify(scryptCallback);
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET;
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USERS_FILE = resolve(process.env.USERS_FILE || `${PROJECT_ROOT}/backend/data/users.json`);
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random secret of at least 32 characters.');
  process.exit(1);
}

async function loadUsers() {
  try { return JSON.parse(await readFile(USERS_FILE, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

async function saveUsers(users) {
  await mkdir(dirname(USERS_FILE), { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), { mode: 0o600 });
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function makeToken(user) {
  const base64url = (value) => Buffer.from(value).toString('base64url');
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ sub: user.id, loginId: user.loginId, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }));
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 16_384) throw Object.assign(new Error('요청 데이터가 너무 큽니다.'), { status: 413 });
  }
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('JSON 요청 형식이 올바르지 않습니다.'), { status: 400 }); }
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const isLocalViteOrigin = (() => {
    try {
      const parsed = new URL(origin);
      return parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
    } catch { return false; }
  })();
  if (origin && origin !== ALLOWED_ORIGIN && !isLocalViteOrigin) return json(res, 403, { message: '허용되지 않은 요청 출처입니다.' });
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && path === '/api/health') return json(res, 200, { status: 'ok' });
  if (req.method !== 'POST' || !['/api/auth/signup', '/api/auth/login'].includes(path)) return json(res, 404, { message: '요청한 API를 찾을 수 없습니다.' });

  try {
    const input = await readBody(req);
    if (path === '/api/auth/login') {
      const { loginId, password } = input;
      if (typeof loginId !== 'string' || typeof password !== 'string' || !loginId.trim() || !password) {
        return json(res, 400, { message: '아이디와 비밀번호를 입력해주세요.' });
      }
      const users = await loadUsers();
      const user = users.find((item) => item.loginId.toLowerCase() === loginId.trim().toLowerCase());
      if (!user) return json(res, 401, { message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      const [salt, savedHash] = user.passwordHash.split(':');
      const passwordHash = await scrypt(password, salt, 64);
      const savedHashBuffer = Buffer.from(savedHash, 'hex');
      if (passwordHash.length !== savedHashBuffer.length || !timingSafeEqual(passwordHash, savedHashBuffer)) {
        return json(res, 401, { message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }
      return json(res, 200, { token: makeToken(user) });
    }

    const { loginId, password, passwordConfirm, birthDate, email, nickname, termsAccepted } = input;
    if (![loginId, password, passwordConfirm, birthDate, email, nickname].every((value) => typeof value === 'string' && value.trim())) {
      return json(res, 400, { message: '모든 필수 정보를 입력해주세요.' });
    }
    if (!termsAccepted) return json(res, 400, { message: '필수 약관 동의가 필요합니다.' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/.test(password) || /(.)\1\1/i.test(password)) return json(res, 400, { message: '비밀번호 형식이 올바르지 않습니다.' });
    if (password !== passwordConfirm) return json(res, 400, { message: '비밀번호가 일치하지 않습니다.' });
    if (!/^\d{8}$/.test(birthDate) || !/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { message: '생년월일 또는 이메일 형식이 올바르지 않습니다.' });
    const birthYear = Number(birthDate.slice(0, 4));
    const birthMonth = Number(birthDate.slice(4, 6));
    const birthDay = Number(birthDate.slice(6, 8));
    const parsedBirthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
    if (parsedBirthDate.getUTCFullYear() !== birthYear || parsedBirthDate.getUTCMonth() !== birthMonth - 1 || parsedBirthDate.getUTCDate() !== birthDay) {
      return json(res, 400, { message: '실제 날짜를 YYYYMMDD 형식으로 입력해주세요.' });
    }

    const users = await loadUsers();
    if (users.some((user) => user.loginId.toLowerCase() === loginId.toLowerCase())) return json(res, 409, { message: '이미 사용 중인 아이디입니다.' });
    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return json(res, 409, { message: '이미 등록된 이메일입니다.' });
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)).toString('hex');
    const user = { id: randomBytes(16).toString('hex'), loginId: loginId.trim(), passwordHash: `${salt}:${hash}`, birthDate, email: email.trim(), nickname: nickname.trim(), marketingAccepted: Boolean(input.marketingAccepted), createdAt: new Date().toISOString() };
    users.push(user);
    await saveUsers(users);
    return json(res, 201, { token: makeToken(user) });
  } catch (error) {
    console.error('Signup request failed:', error.message);
    return json(res, error.status || 500, { message: error.status ? error.message : '회원가입 처리 중 서버 오류가 발생했습니다.' });
  }
});

server.listen(PORT, () => console.log(`GO TRIP auth API listening on http://localhost:${PORT}`));
