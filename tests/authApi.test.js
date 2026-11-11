import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthApi } from '../src/services/authApi.js';
import { createApiClient } from '../src/api/client.js';

const signup = { loginId: 'test-user', password: 'Test1234!', passwordConfirm: 'Test1234!', birthDate: '20000101', email: 'test@example.test', nickname: '여행자', termsAccepted: true, marketingAccepted: false };

test('login preserves the live server HTTP 400 rejection reason without storing a token', async () => {
  for (const message of ['가입되지 않은 아이디입니다.', '비밀번호가 일치하지 않습니다.']) {
    const request = createApiClient({ fetchImpl: async () => new Response(message, { status: 400 }) });
    const api = createAuthApi({ request, storeToken: () => assert.fail('failed login must not save a token') });
    await assert.rejects(api.login({ loginId: 'unknown', password: 'wrong' }), error => error.status === 400 && error.message === message);
  }
});

test('signup normalizes member fields and blocks invalid saved drafts before sending', async () => {
  const requests = [];
  const api = createAuthApi({ request: async (_path, { body }) => { requests.push(body); return '완료'; } });
  await api.signUp({ ...signup, loginId: ' test-user ', email: ' test@example.test ', nickname: ' 여행자 ', birthDate: '2000-01-01' });
  assert.equal(requests[0].birthDate, '20000101');
  assert.equal(requests[0].email, signup.email);
  for (const fields of [{ passwordConfirm: undefined }, { password: 'short' }, { birthDate: '200001' }, { email: 'invalid' }]) {
    await assert.rejects(api.signUp({ ...signup, ...fields }));
  }
  assert.equal(requests.length, 1);
});

test('signup shows server field validation and plain text rejection messages for HTTP 400', async () => {
  for (const [body, expected] of [
    [JSON.stringify({ email: '이메일 형식이 올바르지 않습니다.', password: '비밀번호를 확인해주세요.' }), /이메일 형식.*\n비밀번호/],
    ['이미 사용 중인 아이디입니다.', /이미 사용 중인 아이디/],
  ]) {
    const request = createApiClient({ fetchImpl: async () => new Response(body, { status: 400 }) });
    await assert.rejects(createAuthApi({ request }).signUp(signup), expected);
  }
});

test('merged signup uses the live member contract and accepts a successful text response without a token', async () => {
  const requests = [];
  const request = createApiClient({ fetchImpl: async (url, options) => {
    requests.push({ url, ...options });
    return new Response('회원가입 완료', { status: 200 });
  } });
  const api = createAuthApi({ request, storeToken: () => assert.fail('signup must not log in automatically') });
  assert.equal(await api.signUp(signup), '회원가입 완료');
  assert.equal(requests[0].url, '/api/members/signup');
  assert.equal(requests[0].method, 'POST');
  const { termsAccepted: _terms, marketingAccepted: _marketing, ...memberFields } = signup;
  assert.deepEqual(JSON.parse(requests[0].body), memberFields);
  assert.equal(requests[0].headers.Authorization, undefined);
});

test('both login exports share one token store used by chat and memo', async () => {
  const requests = [];
  const tokens = [];
  const api = createAuthApi({ request: async (path, options) => {
    requests.push({ path, ...options });
    return { token: 'session-token' };
  }, storeToken: (token) => tokens.push(token) });
  assert.deepEqual(await api.login({ loginId: ' user ', password: ' secret ' }), { token: 'session-token' });
  await api.logIn(' second ', 'password');
  assert.deepEqual(tokens, ['session-token', 'session-token']);
  assert.deepEqual(requests[0], { path: '/api/members/login', method: 'POST', auth: false, body: { loginId: 'user', password: ' secret ' } });
  assert.equal(requests[1].body.loginId, 'second');
});

test('explicit local-auth mode preserves the incoming development server contract', async () => {
  const requests = [];
  const api = createAuthApi({ prefix: '/api/auth/', request: async (path, options) => {
    requests.push({ path, ...options });
    return { token: 'local-token' };
  }, storeToken: () => {} });
  await api.signUp(signup);
  await api.logIn('user', 'password');
  assert.equal(requests[0].path, '/api/auth/signup');
  assert.deepEqual(requests[0].body, signup);
  assert.equal(requests[1].path, '/api/auth/login');
});

test('failed login and malformed login responses never replace the session token', async () => {
  for (const result of [null, 'ok', {}, { token: '' }, { token: 7 }]) {
    const api = createAuthApi({ request: async () => result, storeToken: () => assert.fail('invalid login must not save a token') });
    await assert.rejects(api.login({ loginId: 'user', password: 'password' }), /토큰/);
  }
  const failed = createAuthApi({ request: async () => { throw new Error('invalid credentials'); }, storeToken: () => assert.fail('failed login must not save a token') });
  await assert.rejects(failed.logIn('user', 'password'), /invalid credentials/);
});
