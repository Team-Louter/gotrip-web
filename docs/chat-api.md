# 서버 채팅 API 연결

현재 채팅 화면은 서버 채팅만 표시합니다. 체험/서버 모드 선택은 제거했으며, 기존 `local-…` 주소는 `/chat`으로 이동합니다. 이전 브라우저 저장 데이터는 삭제하지 않습니다.

## 실행과 사용

```dotenv
VITE_API_BASE_URL=https://api-gotrip.prot.kr
VITE_CHAT_USE_MOCK=false
```

`npm run dev`로 실행하고 로그인한 뒤 채팅 + 버튼을 누릅니다. 받는 사람은 `GET /api/members`의 전체 사용자이며 본인도 포함하고 기본 전체 선택합니다. 방 이름을 입력하면 실제 `POST /api/chat/rooms`를 호출합니다.

## 실제 회원 ID로 초대

채팅방 생성에는 서버가 반환한 실제 `id` 또는 `memberId`만 사용합니다. 이전 테스트용 1, 2, 3 순번 매핑은 기본 서버 채팅에서 제거했습니다. 회원 삭제 등으로 DB ID가 비연속적이면 순번과 실제 ID가 달라 404가 발생하거나 다른 회원을 초대할 수 있기 때문입니다.

현재 운영 `GET /api/members`와 Swagger의 `MemberResponseDto`에는 `loginId`, `nickname`만 있습니다. 백엔드가 이 응답에 DB의 실제 `memberId`를 포함해야 초대와 방 생성이 가능합니다. ID가 없는 사용자는 선택할 수 없고, 모두 ID가 없으면 방 생성을 막고 이유를 안내합니다. 임의 ID 재시도는 하지 않습니다.

```json
{ "memberId": 17, "loginId": "traveler", "nickname": "여행자" }
```

실제 ID가 반환되면 프론트에서 해당 값으로 `POST /api/chat/rooms`를 호출합니다.

서버 요청 실패 시 입력과 선택을 유지하고 실제 서버 오류를 표시합니다. 체험방으로 자동 전환하거나 브라우저에 방을 만든 뒤 서버 성공처럼 표시하지 않습니다.

## API

| 기능 | 요청 | 응답 |
| --- | --- | --- |
| 로그인 | `POST /api/members/login` | `{ "token": "..." }` |
| 전체 사용자 | `GET /api/members` | `MemberResponseDto[]` |
| 방 목록 | `GET /api/chat/rooms` | `ChatRoomResponse[]` |
| 방 생성 | `POST /api/chat/rooms` | `ChatRoomResponse` |
| 메시지 조회 | `GET /api/chat/rooms/{roomId}/messages?size=50&before={id}` | `ChatMessageResponse[]` |
| 메시지 전송 | `POST /api/chat/rooms/{roomId}/messages` | `ChatMessageResponse` |

로그인 토큰은 `sessionStorage`에 저장하고 인증 요청에 Bearer 헤더를 붙입니다. 401이면 토큰을 제거합니다. 개발 중 `/api`는 Vite가 프록시하며 배포에서는 서버의 CORS 허용 또는 웹 서버의 역방향 프록시가 필요합니다.

서버 방 이름은 1~100자, 텍스트 메시지는 1~2,000자입니다. 전송 본문은 `{ "content": "메시지" }`입니다. 최근 메시지를 3초마다 조회하고 ID로 병합하며 이전 메시지 페이징도 지원합니다. 실패 후 입력을 유지하고 자동 재전송하지 않습니다.

사진·링크 첨부·반응·답장·수정·삭제는 서버 API에 없어 서버 화면에서는 제공하지 않습니다. 이전 브라우저 체험 구현은 코드와 저장소에 보관되어 있으나 기본 화면에서 사용하지 않습니다. 명시적으로 `VITE_CHAT_USE_MOCK=true`를 설정한 개발용 모드만 별도로 사용할 수 있습니다.

## 검증

`npm test`, `npm run build`로 확인합니다. 실제 ID 유지·ID 누락 시 순번 미생성·중복 방지, 숫자 memberIds 요청 본문, 서버 실패 시 로컬 전환 없음, 서버 텍스트 전송을 검증합니다. 브라우저 자동 검증은 모의 서버 응답으로 요청 경로와 본문을 확인하며 실제 계정 간 전달 성공을 의미하지 않습니다.
