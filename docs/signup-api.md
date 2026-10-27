# 회원가입 API

프로젝트의 기존 React/Vite 화면에 맞춘 실행 가능한 Node.js 인증 API입니다. 별도 패키지 설치 없이 Node 기본 모듈을 사용합니다.

## 실행

터미널 1에서 API 비밀 키를 설정하고 실행합니다. 비밀 키는 저장소에 커밋하지 마세요.

```sh
JWT_SECRET="$(openssl rand -hex 32)" npm run dev:auth
```

터미널 2에서는 Vite를 실행합니다.

```sh
npm run dev
```

프런트엔드는 `VITE_API_BASE_URL` 기본값 `http://localhost:8080`을 사용합니다. 다른 주소라면 프로젝트 루트 `.env`에 `VITE_API_BASE_URL=http://localhost:8080`을 설정하고 Vite를 재시작하세요. API는 `FRONTEND_ORIGIN` 환경변수로 CORS 허용 origin을 설정하며 기본값은 `http://localhost:5173`입니다.

사용자 파일은 `backend/data/users.json`에 생성되며 Git에서 제외됩니다. 이 파일 저장소는 개발용입니다. 여러 서버 인스턴스, 배포 환경에서는 트랜잭션과 동시성 제어가 가능한 DB로 교체해야 합니다.

## 가입 요청

`POST /api/auth/signup` (`application/json`)

```json
{
  "loginId": "postman_test",
  "password": "Test1234!",
  "passwordConfirm": "Test1234!",
  "birthDate": "20080101",
  "email": "postman_test@example.com",
  "nickname": "포스트맨테스트",
  "termsAccepted": true,
  "marketingAccepted": false
}
```

성공 시 HTTP 201과 `{ "token": "<JWT>" }`를 반환합니다. 아이디는 빈 값만 거부하며 별도의 문자 종류나 길이 제한을 두지 않습니다. 이메일 중복은 409, 비밀번호 등 유효성 오류는 400이며 `{ "message": "오류 안내" }` 형식입니다. 비밀번호는 서버에서 scrypt 해시로 저장합니다. 토큰 만료는 24시간입니다. 회원가입 완료 후에는 로그인 화면에서 다시 로그인해야 메인 화면으로 이동합니다.

## 로그인

`POST /api/auth/login` (`application/json`)

```json
{ "loginId": "postman_test", "password": "Test1234!" }
```

성공 시 HTTP 200과 `{ "token": "<JWT>" }`를 반환합니다. 아이디 또는 비밀번호가 틀리면 HTTP 401과 오류 메시지를 반환합니다. 회원가입과 로그인 모두 성공한 토큰은 `gotrip.auth.token` 키로 보관합니다.
