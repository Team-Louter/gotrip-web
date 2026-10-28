# 채팅 API 연결

[백엔드 Swagger](https://api-gotrip.prot.kr/swagger-ui/index.html)와 `/v3/api-docs`에 맞춰 연결했습니다. 기본 모드는 실제 서버이며 더미 데이터로 자동 전환하지 않습니다.

## 실행

기존 `.env`의 다른 설정은 유지하고 다음 값을 사용합니다. 환경변수를 바꾸면 Vite를 재시작하세요.

```dotenv
VITE_API_BASE_URL=https://api-gotrip.prot.kr
VITE_CHAT_USE_MOCK=false
```

```sh
npm run dev
```

`/islogin`에서 기존 계정으로 로그인한 후 `/chat`을 여세요. 채팅에서 로그인 화면으로 이동하면 로그인 성공 후 원래 채팅 주소로 돌아옵니다. 회원가입 화면도 같은 운영 인증 서버에 연결되어 있으며 [회원가입 문서](signup-api.md)를 참고하세요.

개발 중 브라우저는 같은 origin의 `/api`로 요청하고 Vite가 위 서버로 프록시합니다. 백엔드의 CORS 사전 요청이 401을 반환하는 환경에서도 로컬 요청이 가능합니다. 인증이 필요 없는 로그인 요청을 제외하고 `Authorization: Bearer <token>`을 붙입니다. 토큰은 탭의 `sessionStorage`에 저장하며 401 응답 때 제거합니다. 비밀번호는 저장하지 않습니다.

## 연결한 API

| 기능 | 요청 | 서버 응답 |
| --- | --- | --- |
| 로그인 | `POST /api/members/login` | `{ "token": "..." }` |
| 방 목록 | `GET /api/chat/rooms` | `ChatRoomResponse[]` |
| 방 생성 | `POST /api/chat/rooms` | `ChatRoomResponse` |
| 메시지 조회 | `GET /api/chat/rooms/{roomId}/messages?size=50&before={messageId}` | `ChatMessageResponse[]` |
| 메시지 전송 | `POST /api/chat/rooms/{roomId}/messages` | `ChatMessageResponse` 한 개 |

```json
{ "loginId": "아이디", "password": "비밀번호" }
```

방 생성은 이름 1~100자와 상대방의 숫자 회원 ID 1~99개를 전송합니다. 친구 조회 API가 없어 모달에서 회원 ID를 쉼표나 공백으로 구분해 입력합니다. 중복 ID는 제거하며 본인은 서버에서 추가합니다.

```json
{ "name": "제주 여행", "memberIds": [2, 3] }
```

방 응답에는 `id`, `name`, `createdAt`만 있습니다. 별도의 방 상세 API를 요청하지 않고 방 목록의 정보와 메시지 조회 결과를 합칩니다. 참여자 수나 이름은 서버가 제공하지 않아 임의로 표시하지 않습니다. 목록 검색은 방 이름을 기준으로 프런트엔드에서 수행합니다.

메시지는 텍스트 1~2,000자입니다. 응답에 한 개의 메시지만 오므로 기존 대화를 유지한 채 ID를 기준으로 병합합니다.

```json
{ "content": "여기 같이 가자!" }
```

```json
{
  "id": 10,
  "roomId": 42,
  "senderId": 7,
  "senderNickname": "민지",
  "content": "여기 같이 가자!",
  "type": "TEXT",
  "createdAt": "2026-10-27T12:30:00Z"
}
```

- 선택한 방은 3초 간격으로 최근 메시지를 조회합니다. 숨겨진 탭에서는 조회를 건너뛰고 방 이동·화면 종료 때 요청과 타이머를 정리합니다. WebSocket 연결은 없습니다.
- 방 목록은 10초마다, 창으로 돌아올 때 다시 조회합니다. 한 번에 새 메시지가 50개를 넘었으면 추가 페이지를 조회해 누락된 중간 대화를 채웁니다.
- 메시지는 ID 순서로 정렬하고 중복을 제거합니다. 처음에는 최근 50개, 이후에는 가장 오래된 ID를 `before`로 전달해 이전 대화를 불러옵니다. 갱신이나 전송 시 이미 읽은 이전 대화를 유지합니다.
- 이전 대화를 보고 있을 때 새 메시지가 와도 스크롤을 강제로 아래로 이동하지 않습니다.
- 전송 실패 시 입력을 유지합니다. 서버가 `clientId`를 받지 않아 자동 재전송은 하지 않으며, 응답이 유실된 뒤 수동 재시도하면 중복이 생길 수 있습니다.
- 본인 말풍선은 JWT의 숫자 `memberId`, `userId`, `sub` 또는 전송 응답에서 확인한 `senderId`로 표시합니다. 토큰에 숫자 ID가 없는 경우 첫 전송 전에는 기존 메시지의 본인 여부를 구분할 수 없습니다. 서버의 권한 검증에는 이 정보를 사용하지 않습니다.
- 첨부·답장·수정·삭제·반응 API가 명세에 없어 실제 서버 모드에서는 관련 버튼을 숨깁니다. 메시지 복사는 사용할 수 있습니다.
- 친구 관계 생성, 회원 검색, 회원가입 연결은 별도 작업입니다.

## 배포

`npm run build` 결과물에서는 `VITE_API_BASE_URL`로 직접 요청합니다. 다른 origin이면 서버가 프런트엔드 origin, `Authorization`/`Content-Type` 헤더, `GET`/`POST`/`OPTIONS`를 허용해야 합니다. Vite 개발 프록시는 정적 배포에 포함되지 않습니다.

서버 CORS를 변경할 수 없다면 배포 웹 서버에서 `/api`를 `https://api-gotrip.prot.kr`로 역방향 프록시하고, 빌드할 때 `VITE_API_BASE_URL`을 빈 값으로 설정하세요. SPA 주소(`/chat/42` 등)는 `index.html`로 되돌리는 설정이 필요합니다.

## 더미 모드와 검증

UI 데모가 필요하면 `VITE_CHAT_USE_MOCK=true`로 설정합니다. 이때 기존 검색·친구 선택·전송·답장·수정·삭제·반응·첨부 기능은 브라우저의 `localStorage(gotrip.chat.rooms.v1)`에 보관되고 다른 사용자와 공유되지 않습니다. 실제 서버 데이터와 더미 데이터는 섞지 않습니다.

```sh
npm test
npm run build
```

실제 HTTP 연결은 `src/api/client.js`, 인증은 `src/api/session.js`와 `src/services/authApi.js`, 채팅 응답 변환·페이징은 `src/services/serverChatApi.js`, 더미 구현은 `src/services/chatApi.js`에 있습니다. 실제 계정이 없는 자동 검증에서는 Swagger 형태의 응답을 주입해 인증 헤더, 요청 본문, 정렬·병합, 오류와 페이지네이션을 확인합니다.
