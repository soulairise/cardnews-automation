# 브랜드 카드뉴스 자동화 — Free 플랜 MVP

PRD v0.3의 Free 체험 범위를 구현한 로컬 웹앱. 브랜드 등록 → 캐릭터 고정 → 카드뉴스 생성 → 텍스트 수정 → PNG 다운로드까지 동작한다. SNS 발행은 범위 밖(유료 플랜).

## 실행

```bash
npm run dev
```

http://localhost:3000

## 설정 (둘 다 앱 `/settings` 화면에서 입력 가능)

| 항목 | 없을 때 동작 | 발급처 |
|---|---|---|
| Gemini API 키 | 플레이스홀더 모드 — 흐름은 전부 동작, 이미지만 그라데이션 대체 | https://aistudio.google.com/apikey |
| Google/네이버/카카오 OAuth | 해당 버튼이 "설정 필요"로 비활성 | 각 개발자 콘솔 |

Redirect URI는 `/settings` 화면에 그대로 복사할 수 있게 표시된다.
`.env.local` 로 넣으려면 `.env.local.example` 참고 (파일 수정 후 서버 재시작 필요, 앱 화면 입력은 재시작 불필요).

## 사용 한도

| | 캐릭터 시트 | 카드뉴스 | 발행 |
|---|---|---|---|
| 비로그인 | 1회 | 1건 | ✕ |
| 로그인 (Free) | 1회 | 3건 | ✕ |

한도를 넘기면 로그인 화면으로 유도된다. 비로그인 상태에서 만든 브랜드·캐릭터·카드뉴스는 **첫 로그인 때 계정으로 그대로 이관**된다.

## 구조

- `lib/pipeline.ts` — 생성 파이프라인. 키가 없으면 `lib/placeholder.ts` 로 자동 폴백
- `components/CardCanvas.tsx` — 하이브리드 렌더러. 배경·캐릭터는 생성 이미지, 텍스트는 DOM 레이어
  - 미리보기와 내보내기가 같은 노드라 WYSIWYG가 구조적으로 보장된다
  - 텍스트 수정 시 이미지를 재생성하지 않는다
- `lib/qc.ts` — 자동 품질검사(글자수 초과, WCAG 명도 대비)
- `lib/auth.ts` — Google/네이버/카카오 OAuth. 이 앱 전용 회원 저장소이며 다른 앱과 공유하지 않는다
- `lib/store.ts` — `.data/state.json` 파일 저장. 사용자별 작업공간은 `${provider}:${id}` 키로 분리

## 모델

| 용도 | 모델 | 이유 |
|---|---|---|
| 캐릭터 시트 | `gemini-3-pro-image` | 브랜드당 1회성이라 고급 모델 허용 |
| 카드 배경 | `gemini-3.1-flash-image` | 매 건 발생하므로 표준 모델 |
| 카피 생성 | `gemini-3.7-flash` | |

## 데이터 · 배포

저장소는 환경변수로 자동 전환된다.

| 환경 | 저장 위치 |
|---|---|
| 로컬 (기본) | `.data/state.json` + `public/generated/` |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` 설정 시 | Supabase Postgres + Storage |

**배포는 Supabase 설정이 필수다.** Vercel 같은 서버리스는 요청이 끝나면 파일이 사라져 파일 저장이 유지되지 않는다.

### 배포 순서

1. Supabase 프로젝트 생성 (리전: Northeast Asia — Seoul)
2. SQL Editor 에 `supabase-schema.sql` 붙여넣고 실행
3. Vercel 에 이 저장소를 연결하고 환경변수 등록
   - `SUPABASE_URL` — 프로젝트 URL
   - `SUPABASE_SERVICE_ROLE_KEY` — service_role 키 (**공개 금지**, 서버에서만 쓴다)
   - `GEMINI_API_KEY` — 선택. 없으면 플레이스홀더 모드
4. 배포 후 각 소셜 제공자에 Redirect URI 등록
   - `https://<배포도메인>/api/auth/google/callback`
   - `https://<배포도메인>/api/auth/naver/callback`
   - `https://<배포도메인>/api/auth/kakao/callback`

소셜 로그인은 Supabase Auth 를 쓰지 않는다. 이 앱이 직접 OAuth 를 처리하고 회원을
`app_users` 에 저장하므로, 다른 서비스의 회원과 섞이지 않는다.

`.data/`, `public/generated/`, `.env*` 는 gitignore 대상.
