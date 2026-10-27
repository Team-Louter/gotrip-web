# 채팅방 API 연결

기본 설정은 더미 모드입니다. 검색, 친구 선택, 방 생성·조회, 메시지 전송·답장·수정·삭제, 이모지 반응과 첨부가 동작하며 변경 내용은 이 브라우저의 localStorage(`gotrip.chat.rooms.v1`)에 보관됩니다. 다른 사용자나 기기와 공유되지는 않습니다.

실제 서버를 연결할 때 `.env`에 아래 값을 설정하고 Vite를 재시작하세요. 기존 `.env`의 다른 값은 유지하세요.

```dotenv
VITE_CHAT_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080
```

요청 코드는 `src/services/chatApi.js`에 모았습니다. 서버의 주소나 필드가 다르면 이 파일의 경로와 응답 변환 함수를 수정하면 됩니다. 더미 모드는 명시적으로 `false`로 설정할 때만 해제되며 실제 서버의 오류가 더미 데이터로 가려지지 않습니다.

## 엔드포인트

| 기능 | 요청 | 응답 |
| --- | --- | --- |
| 방 목록·검색 | `GET /api/chat/rooms?q=제주` | `Room[]` |
| 방 조회 | `GET /api/chat/rooms/:roomId` | `Room` |
| 방 생성 | `POST /api/chat/rooms` | 생성한 `Room` (201 권장) |
| 초대할 친구 조회 | `GET /api/friends` | `Friend[]` |

검색어 `q`는 방 이름·최근 메시지·참여자 이름을 대상으로 합니다. 빈 검색어는 전체 목록입니다. 현재 프런트엔드는 한 번에 전체 목록을 받는 형식이며 페이지네이션은 구현하지 않았습니다.

### 방 생성 요청

```json
{ "name": "제주 여행", "memberIds": ["friend-minji", "friend-seoyeon"] }
```

방 이름은 공백을 제거한 뒤 1~50자, 초대할 친구는 최소 한 명입니다. 본인은 서버의 로그인 세션에서 추가하며 `memberIds`에 포함하지 않습니다. 서버에서도 권한과 요청 내용을 검증해야 합니다.

### Room / Friend

```json
{
  "id": "room-123",
  "name": "제주 여행",
  "members": [{ "id": "friend-minji", "name": "김민지" }],
  "lastMessage": "한라봉 먹고오자",
  "messages": [
    { "id": "message-1", "content": "한라봉 먹고오자", "senderName": "김민지", "mine": false, "time": "16:47" }
  ]
}
```

`members`는 본인을 제외한 참여자 목록입니다. `messages`와 `lastMessage`가 없으면 빈 값으로 처리합니다. 친구 응답은 `[{ "id": "friend-minji", "name": "김민지" }]` 형태입니다. ID는 문자열 또는 숫자를 받아 문자열로 정규화합니다.

목록은 직접 배열 또는 `{ "data": [...] }`, `{ "rooms": [...] }`, `{ "data": { "rooms": [...] } }`를 받습니다. 상세·생성은 직접 객체 또는 `{ "data": Room }`, `{ "room": Room }`, `{ "data": { "room": Room } }`를 받습니다. 친구 목록도 `friends` 또는 `data` 래퍼를 받을 수 있습니다. 생성 응답은 전체 Room이어야 합니다.

실패 응답은 적절한 HTTP 상태와 `{ "message": "오류 안내" }`를 반환하세요. 목록·상세·친구 조회에는 취소 신호가 전달되어 검색 중 이전 요청이나 화면 이동 후 응답이 화면을 덮어쓰지 않습니다. 생성 중에는 중복 제출과 모달 닫기를 막습니다.

쿠키 세션을 위해 `credentials: include`로 요청합니다. 다른 origin의 서버는 프런트엔드 origin과 credentials를 허용하는 CORS 설정이 필요합니다. 현재 코드에는 토큰이나 로그인 정보를 하드코딩하지 않습니다.

## 화면 주소와 범위

- `/chat`: 목록과 검색, 기본 안내 화면
- `/chat/:roomId`: 목록과 선택한 방 조회
- `/chat-api`: `/chat`와 동일한 설정을 사용하는 호환 주소

메시지 전송과 첨부는 아래 REST API를 사용합니다. 다른 사용자의 메시지를 실시간 수신하는 WebSocket/SSE와 친구 관계 생성은 아직 연결하지 않았습니다. 더미 모드는 이 브라우저 안에서 동작합니다.


## 메시지와 첨부 API

| 기능 | 요청 | 응답 |
| --- | --- | --- |
| 메시지·답장 전송 | `POST /api/chat/rooms/:roomId/messages` | 갱신된 전체 `Room` |
| 내 메시지 수정 | `PATCH /api/chat/rooms/:roomId/messages/:messageId` | 갱신된 전체 `Room` |
| 내 메시지 삭제 | `DELETE /api/chat/rooms/:roomId/messages/:messageId` | 갱신된 전체 `Room` (200 JSON) |
| 반응 설정·취소 | `PUT /api/chat/rooms/:roomId/messages/:messageId/reactions` | 갱신된 전체 `Room` |
| 이미지 업로드 | `POST /api/chat/uploads` | `Attachment[]` 또는 `{ "attachments": [...] }` |

위의 메시지 변경 요청은 방 조회와 동일한 Room 형식을 반환합니다. 서버가 메시지 한 개만 반환한다면 `chatApi.js`에서 방을 재조회하거나 Room에 병합하도록 변환하세요.

전송 예시:

```json
{
  "clientId": "클라이언트가 생성한 UUID",
  "content": "여기 같이 가자!",
  "replyToId": "message-1",
  "attachments": [
    { "id": "upload-1", "type": "image", "url": "https://cdn.example.com/trip.jpg", "name": "trip.jpg", "size": 120000 },
    { "id": "link-1", "type": "link", "url": "https://example.com/travel" }
  ]
}
```

- 서버는 `(현재 사용자, roomId, clientId)` 기준으로 중복 전송을 방지해야 합니다. 실패 후 같은 입력을 재시도할 때 clientId가 유지됩니다.
- 이미지나 링크만으로도 전송할 수 있습니다. 텍스트는 4,000자까지이며, 답장이 아니면 `replyToId`는 null입니다.
- 수정 요청은 `{ "content": "수정할 내용" }`입니다. 첨부와 답장 관계는 유지합니다.
- 반응 요청은 `{ "emoji": "👍", "active": true }`이며 false로 취소합니다. 같은 요청을 반복해도 개수가 늘지 않도록 구현하세요.
- `messages[]`에는 `attachments`, `replyToId`, `edited`, `deleted`, `reactions: [{ "emoji": "👍", "count": 1, "mine": true }]`를 추가할 수 있습니다. 본인 여부는 서버의 인증 상태를 기준으로 반환하세요.
- 삭제는 메시지 ID와 답장 관계를 남기고 `deleted: true`, 빈 content/attachments/reactions를 반환합니다. 화면에는 삭제된 메시지 안내가 표시됩니다.
- 서버는 방 참여 권한, 원본 메시지 접근 권한, 수정·삭제 소유권을 검증해야 합니다.

이미지는 multipart/form-data의 `files` 필드로 업로드합니다. 브라우저가 boundary를 설정하므로 Content-Type을 직접 지정하지 않습니다. 업로드 결과는 type이 image인 Attachment 배열이며 URL은 http/https 절대 주소여야 합니다. 서버는 파일 내용·크기와 소유권을 검증하고 취소된 첨부의 보관 정책을 적용해야 합니다.

현재 이미지는 JPG/PNG/GIF/WebP 최대 3장, 합계 2MB까지 첨부할 수 있습니다. 링크는 http/https 주소 최대 3개이며 외부 미리보기 정보를 자동 수집하지 않습니다. 더미 모드의 이미지는 data URL로 저장합니다. 저장 공간이 부족하면 오류를 표시하며 전송 전 입력과 첨부를 유지합니다.
