# 서버 채팅 API 연결

현재 채팅 화면은 서버 채팅만 표시합니다. 체험/서버 모드 선택은 제거했으며, 기존 `local-…` 주소는 `/chat`으로 이동합니다. 이전 브라우저 저장 데이터는 삭제하지 않습니다.

## 실행과 사용

```dotenv
VITE_API_BASE_URL=https://api-gotrip.prot.kr
VITE_CHAT_USE_MOCK=false
```

`npm run dev`로 실행하고 로그인한 뒤 채팅 + 버튼을 누릅니다. 초대 목록은 `GET /api/friends`의 수락된 친구이며 기본 전체 선택합니다. 닉네임으로 검색하고 방 이름을 입력하면 실제 `POST /api/chat/rooms`를 호출합니다.

## 실제 회원 ID로 초대

채팅방 생성에는 서버가 반환한 실제 `id` 또는 `memberId`만 사용합니다. 이전 테스트용 1, 2, 3 순번 매핑은 기본 서버 채팅에서 제거했습니다. 회원 삭제 등으로 DB ID가 비연속적이면 순번과 실제 ID가 달라 404가 발생하거나 다른 회원을 초대할 수 있기 때문입니다.

`GET /api/friends`는 `friendshipId`, `memberId`, `nickname`, `createdAt`을 반환합니다. 초대에는 친구 관계 ID인 `friendshipId`가 아닌 실제 회원 ID인 `memberId`를 사용합니다. 친구가 없으면 빈 목록을 표시하고 방 생성을 막습니다. 잘못된 ID 응답은 오류로 처리하며 임의 ID를 만들거나 재시도하지 않습니다.

```json
{ "friendshipId": 5, "memberId": 17, "nickname": "여행자", "createdAt": "2026-11-16T12:00:00Z" }
```

실제 ID가 반환되면 프론트에서 해당 값으로 `POST /api/chat/rooms`를 호출합니다.

서버 요청 실패 시 입력과 선택을 유지하고 실제 서버 오류를 표시합니다. 체험방으로 자동 전환하거나 브라우저에 방을 만든 뒤 서버 성공처럼 표시하지 않습니다.

## API

| 기능 | 요청 | 응답 |
| --- | --- | --- |
| 로그인 | `POST /api/members/login` | `{ "token": "..." }` |
| 초대할 친구 | `GET /api/friends` | `FriendshipResponse[]` |
| 방 목록 | `GET /api/chat/rooms` | `ChatRoomResponse[]` |
| 방 생성 | `POST /api/chat/rooms` | `ChatRoomResponse` |
| 메시지 조회 | `GET /api/chat/rooms/{roomId}/messages?size=50&before={id}` | `ChatMessageResponse[]` |
| 참여자 읽음 위치 | `GET /api/chat/rooms/{roomId}/members` | `ChatRoomMemberResponse[]` |
| 메시지 전송 | `POST /api/chat/rooms/{roomId}/messages` | `ChatMessageResponse` |
| 읽음 처리 | `PUT /api/chat/rooms/{roomId}/read` body `{ "lastReadMessageId": 123 }` | `ChatReadResponse` |

대화방을 열거나 새 메시지를 확인하면 현재 화면의 마지막 메시지 ID로 읽음 처리 API를 호출합니다. 메시지 옆 숫자는 `GET /members`의 각 참여자 `lastReadMessageId`와 메시지 ID를 비교해 보낸 사람을 제외한 미확인 인원 수로 계산합니다. 참여자 목록은 대화가 열려 있는 동안 3초마다 새로 받아, 읽거나 답장한 사람이 생기면 숫자를 갱신하고 모두 읽으면 표시를 없앱니다. 멤버 조회에 실패해도 메시지 조회는 계속되고 메시지 응답의 `unreadCount`를 사용합니다.

로그인 토큰은 `sessionStorage`에 저장하고 인증 요청에 Bearer 헤더를 붙입니다. 401이면 토큰을 제거합니다. 개발 중 `/api`는 Vite가 프록시하며 배포에서는 서버의 CORS 허용 또는 웹 서버의 역방향 프록시가 필요합니다.

서버 방 이름은 1~100자, 텍스트 메시지는 1~2,000자입니다. 전송 본문은 `{ "content": "메시지" }`입니다. 최근 메시지를 3초마다 조회하고 ID로 병합하며 이전 메시지 페이징도 지원합니다. 실패 후 입력을 유지하고 자동 재전송하지 않습니다.

방 목록·생성 응답의 `counterpartProfileImageUrl`로 방 목록과 대화 상단 사진을 표시합니다. 본인을 제외한 최초 참여자의 현재 사진이며, 해당 참여자의 사진이 없거나 다른 참여자가 없으면 `null`입니다. 메시지 조회·전송 응답의 `senderProfileImageUrl`로 발신자 사진을 표시합니다. 사진이 없으면 기본 이미지를 사용하며 다른 참여자의 사진으로 대체하지 않습니다. 상대·발신자 사진을 표시하려면 `gotrip-server`의 두 이미지 응답 필드가 먼저 배포되어야 합니다. 기존 서버에서는 기본 이미지를 유지합니다.

사진·링크 첨부·반응·답장·수정·삭제는 서버 API에 없어 서버 화면에서는 제공하지 않습니다. 이전 브라우저 체험 구현은 코드와 저장소에 보관되어 있으나 기본 화면에서 사용하지 않습니다. 명시적으로 `VITE_CHAT_USE_MOCK=true`를 설정한 개발용 모드만 별도로 사용할 수 있습니다.

## 검증

`npm test`, `npm run build`로 확인합니다. 실제 ID 유지·ID 누락 시 순번 미생성·중복 방지, 숫자 memberIds 요청 본문, 서버 실패 시 로컬 전환 없음, 서버 텍스트 전송을 검증합니다. 브라우저 자동 검증은 모의 서버 응답으로 요청 경로와 본문을 확인하며 실제 계정 간 전달 성공을 의미하지 않습니다.
