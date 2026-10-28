# 회원가입 API

## 운영 서버와 화면 연결

기본 설정은 기존 채팅·메모와 동일한 운영 서버입니다.

```dotenv
VITE_API_BASE_URL=https://api-gotrip.prot.kr
VITE_AUTH_API_PREFIX=/api/members
```

회원가입 화면은 `/api/members/signup`에 `loginId`, `password`, `passwordConfirm`, `birthDate`, `email`, `nickname`을 전송합니다. 성공 응답은 문자열이며 토큰이 없어도 가입 성공으로 처리합니다. 가입 완료 안내 후 로그인 화면으로 이동하고, `/api/members/login`에서 받은 토큰은 채팅·메모와 공통으로 `sessionStorage(gotrip.auth.token)`에 저장합니다. 로그인 이전 주소가 채팅 또는 메모이면 해당 화면으로 돌아갑니다.

## 저장소에 포함된 로컬 인증 서버

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

로컬 인증 서버를 사용하려면 프로젝트 루트 `.env`에서 다음 두 값을 함께 설정하고 Vite를 재시작하세요.

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_AUTH_API_PREFIX=/api/auth
```

이 서버는 회원가입·로그인 개발용이며 채팅·메모 API는 포함하지 않습니다. 운영 서버에서 쓸 계정은 기본 운영 설정에서 가입해야 합니다. API는 `FRONTEND_ORIGIN` 환경변수로 CORS 허용 origin을 설정하며 기본값은 `http://localhost:5173`입니다.

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

성공 시 HTTP 200과 `{ "token": "<JWT>" }`를 반환합니다. 아이디 또는 비밀번호가 틀리면 HTTP 401과 오류 메시지를 반환합니다. 프런트엔드는 로그인 성공한 토큰만 `sessionStorage`의 `gotrip.auth.token` 키로 보관합니다. 회원가입 성공 시 자동 로그인하지 않습니다.
