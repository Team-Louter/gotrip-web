# 프로젝트 지침

- 프로젝트는 JavaScript 기반 React를 사용합니다. 관련 파일은 기존 구조를 따르고, 이미지와 화면 파일은 각각 `images`, `files` 폴더에 둡니다.
- GitHub 관련 오류를 수정한 뒤 커밋하기 전에는 변경 내용을 먼저 설명하고, 커밋 여부와 커밋 메시지를 사용자에게 확인받아 검토한 다음 푸시합니다.
- 오류 수정은 사용자가 요청한 범위에 한정합니다. 추가 기능을 임의로 넣지 말고, 필요하다고 판단되면 먼저 제안하고 허락을 받은 뒤 구현합니다.
- 접근성과 사용 편의성을 중요하게 고려해 화면을 구현합니다.
- 개발자나 운영자만 이해할 내부 상태와 구현 정보를 제품 화면에 노출하지 않습니다. 예를 들어 API 연결 여부, 서버/브라우저 저장 방식, 디버깅 상태 같은 문구를 사용자 안내로 만들지 않습니다. 사용자에게 필요한 안내가 있다면 작업에 필요한 행동이나 결과를 쉬운 말로 전달합니다.

## 구조와 명령

- React 19, JavaScript, Vite 프로젝트입니다. `src/files`는 화면, `src/components`는 공통 component, `src/services`와 `src/api`는 API 연동, `tests`는 테스트, `docs`는 API 문서입니다.
- 개발: `npm run dev`. 로컬 인증 서버: `npm run dev:auth`.
- 검증: `npm test`, `npm run lint`, `npm run build`. build 미리보기: `npm run preview`.
- 기존 구현과 코드 관례를 재사용하고, 요청 범위만 변경합니다. 명시적 요청 없이 deploy나 외부 인프라를 변경하지 않습니다.
- 프로젝트 개발 규칙이 바뀌면 `AGENTS.md`를 갱신합니다. `CLAUDE.md`에는 프로젝트 지침을 중복하지 않습니다.

## Git 규칙

- 명시적 요청 없이 commit하거나 push하지 않습니다. 공유 이력 재작성과 force-push는 금지합니다.
- branch: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
- 모든 Git commit 메시지는 `prefix: description` 형식으로 짧고 구체적으로 작성합니다.
- 허용 prefix: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`, `ci`, `build`.
