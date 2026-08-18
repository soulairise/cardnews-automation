# 브랜드 카드뉴스 자동화

브랜드를 한 번 등록하고 캐릭터를 고정하면, 이후에는 홍보 문구만 넣어도 같은 톤·같은 캐릭터의
인스타그램 카드뉴스가 나온다. PRD v0.3 의 체험판 범위.

**서버가 없는 완전 정적 사이트다.** 브랜드·캐릭터·카드뉴스는 방문자의 브라우저(IndexedDB)에만
저장되고, Gemini 호출도 각자의 브라우저에서 자기 키로 직접 나간다. 수집하는 개인정보가 없다.

## 실행

```bash
npm run dev
```

## API 키

`/settings` 에서 Gemini API 키를 넣으면 실제 이미지 생성이 켜진다. 키가 없어도 전체 흐름은
플레이스홀더로 그대로 동작하므로, 키 없이 먼저 둘러볼 수 있다.

키는 <https://aistudio.google.com/apikey> 에서 발급한다. 이 브라우저의 localStorage 에만
저장되며 Google 외 어디로도 전송되지 않는다.

## 구조

- `components/CardCanvas.tsx` — 하이브리드 렌더러. 배경·캐릭터는 생성 이미지, 텍스트는 DOM 레이어.
  미리보기와 내보내기가 같은 노드라 WYSIWYG 가 구조적으로 보장되고, 텍스트를 고쳐도 이미지를
  재생성하지 않는다.
- `lib/pipeline.ts` — 생성 파이프라인. 키가 없으면 `lib/placeholder.ts` 로 자동 폴백.
- `lib/gemini.ts` — 브라우저에서 Gemini 를 직접 호출한다.
- `lib/local.ts` — IndexedDB 저장. 생성 이미지가 data URL 이라 localStorage 로는 용량이 부족하다.
- `lib/qc.ts` — 자동 품질검사(글자수 초과, WCAG 명도 대비).

캐릭터는 최초 1회 레퍼런스 시트로 고정한 뒤 매 생성에 참조로 주입한다. 매번 새로 만들면
일관성도 원가도 무너진다.

## 결과물 규격

1080×1350 (4:5) 5장. 인스타그램 캐러셀은 앱에서 20장까지 되지만 API 발행은 10장이 상한이라
그 안에서 설계했다.

## 모델

| 용도 | 모델 | 이유 |
|---|---|---|
| 캐릭터 시트 | `gemini-3-pro-image` | 브랜드당 1회성이라 고급 모델 허용 |
| 카드 배경 | `gemini-3.1-flash-image` | 매 건 발생하므로 표준 모델 |
| 카피 생성 | `gemini-3.7-flash` | |

## 배포

```bash
npm run deploy
```

GitHub Pages 로 나간다. `DEPLOY_TARGET=pages` 가 basePath 를 붙인다.

## 범위 밖

SNS 자동 발행, 로그인, 과금. 이들은 서버가 필요해서 체험판에서 뺐다.
서버 기반 버전(Supabase + 자체 OAuth)은 `server-version` 브랜치와 `server-v1` 태그에 있다.
