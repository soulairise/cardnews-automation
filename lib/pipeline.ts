import { Brand, Card, CharacterCandidate, Workspace } from './types';
import { ImageRef, MODELS, genImage, genJSON } from './gemini';
import { placeholderBackground, placeholderCharacter } from './placeholder';
import { loadImageBytes, saveImage } from './store';
import { planFor } from './freeplan';
import { LIMITS } from './qc';

/** 하이브리드 렌더링의 전제: 생성 이미지에는 글자가 절대 들어가면 안 된다. */
const NO_TEXT = 'Absolutely no text, no letters, no words, no numbers, no logos, no watermarks anywhere in the image.';

/** PRD 6장 — 극단적 각도·조명 변화에서 일관성이 무너지므로 템플릿 단계에서 범위를 묶는다. */
const CONSISTENCY_LOCK =
  'Consistent soft even daylight studio lighting, front-facing three-quarter view, same art style, same character proportions and same outfit as the reference.';

const STYLE_DIRECTIONS = [
  { key: 'friendly', hint: '둥글고 친근한 형태, 부드러운 곡선', en: 'rounded friendly flat vector mascot, soft shapes, warm and approachable' },
  { key: 'crisp', hint: '단정하고 신뢰감 있는 형태, 절제된 선', en: 'clean minimal flat illustration, precise geometry, professional and trustworthy' },
  { key: 'playful', hint: '활발하고 경쾌한 형태, 과장된 표정', en: 'playful energetic cartoon mascot, expressive face, dynamic pose' },
];

const SHEET_VIEWS = [
  { label: '정면', en: 'exact front view, neutral confident expression' },
  { label: '측면', en: 'side profile view, same neutral expression' },
  { label: '미소', en: 'front view, warm smiling expression, waving one hand' },
];

function characterPrompt(brand: Brand, direction: string) {
  return [
    `A single original brand mascot character for "${brand.name}".`,
    `Brand tone: ${brand.tone}. Target audience: ${brand.audience}.`,
    `Style: ${direction}.`,
    `Dominant colors ${brand.colors.primary} and ${brand.colors.secondary}, plain flat background.`,
    'Full upper body, centered, generous margin around the character.',
    NO_TEXT,
  ].join(' ');
}

function backgroundPrompt(brand: Brand, card: Card, hasCharacter: boolean) {
  const composition =
    card.role === 'cover'
      ? 'The character is on the right side, the left half stays visually calm and uncluttered for a text overlay.'
      : card.role === 'cta'
        ? 'The character is centered and small, wide calm space above and below for text.'
        : 'The character is small in the lower right corner, the upper two thirds stay calm and uncluttered for a text overlay.';
  return [
    hasCharacter
      ? `Illustration featuring the exact same character as the reference image. ${CONSISTENCY_LOCK}`
      : `Abstract brand illustration for "${brand.name}".`,
    `Scene context: ${card.title || card.body || brand.name}.`,
    `Brand palette ${brand.colors.primary}, ${brand.colors.secondary}, background ${brand.colors.bg}.`,
    composition,
    'Vertical 4:5 composition. Flat vector illustration style, no photographic realism.',
    NO_TEXT,
  ].join(' ');
}

async function refFrom(url: string): Promise<ImageRef | null> {
  const bytes = await loadImageBytes(url);
  return bytes ? { mimeType: 'image/png', base64: bytes.toString('base64') } : null;
}

export async function buildCandidates(ws: Workspace, key: string | null): Promise<CharacterCandidate[]> {
  const brand = ws.brand!;

  return Promise.all(
    STYLE_DIRECTIONS.map(async (dir, i) => {
      const description = `${brand.name} 캐릭터 — ${dir.hint}`;
      if (!key) {
        return {
          id: dir.key,
          description,
          imageUrl: placeholderCharacter({ primary: brand.colors.primary, secondary: brand.colors.secondary, seed: i, label: dir.hint }),
        };
      }
      const buf = await genImage(key, { prompt: characterPrompt(brand, dir.en), model: MODELS.characterSheet });
      return { id: dir.key, description, imageUrl: await saveImage(buf, `char-${dir.key}`) };
    }),
  );
}

export async function buildSheet(ws: Workspace, key: string | null, candidate: CharacterCandidate) {
  const brand = ws.brand!;
  const ref = await refFrom(candidate.imageUrl);

  const sheet = await Promise.all(
    SHEET_VIEWS.map(async (view, i) => {
      if (!key || !ref) {
        return {
          label: view.label,
          imageUrl: placeholderCharacter({ primary: brand.colors.primary, secondary: brand.colors.secondary, seed: i, label: view.label }),
        };
      }
      const buf = await genImage(key, {
        model: MODELS.characterSheet,
        prompt: `Redraw the exact same character from the reference image: ${view.en}. ${CONSISTENCY_LOCK} Plain flat background. ${NO_TEXT}`,
        refs: [ref],
      });
      return { label: view.label, imageUrl: await saveImage(buf, `sheet-${i}`) };
    }),
  );

  return sheet;
}

type CopyOut = { role: Card['role']; title: string; body: string }[];

export async function buildCopy(ws: Workspace, key: string | null, workspaceKey: string, topic: string): Promise<CopyOut> {
  const brand = ws.brand!;
  const n = planFor(workspaceKey).cardsPerDeck;

  if (!key) {
    // 키 없이도 흐름이 끊기지 않도록 하는 결정적 폴백 (실제 카피 품질은 키 연결 후)
    const sentences = topic.split(/[.\n·]/).map((s) => s.trim()).filter(Boolean);
    const out: CopyOut = [{ role: 'cover', title: (sentences[0] || topic).slice(0, LIMITS.coverTitle), body: brand.name }];
    for (let i = 1; i < n - 1; i++) {
      out.push({
        role: 'body',
        title: `포인트 ${i}`,
        body: (sentences[i] || topic).slice(0, LIMITS.body),
      });
    }
    out.push({ role: 'cta', title: '자세히 보기', body: `${brand.name} 계정에서 확인하세요` });
    return out;
  }

  const prompt = `너는 "${brand.name}"의 SNS 홍보 담당자다.
브랜드 톤앤매너: ${brand.tone}
타겟 독자: ${brand.audience}

아래 홍보 내용을 인스타그램 카드뉴스 ${n}장으로 나눠 써라.
홍보 내용: """${topic}"""

규칙:
- 1번은 role "cover": 스크롤을 멈추게 하는 후킹 제목. title은 ${LIMITS.coverTitle}자 이내.
- 2~${n - 1}번은 role "body": title은 ${LIMITS.bodyTitle}자 이내, body는 ${LIMITS.body}자 이내.
- ${n}번은 role "cta": 행동을 유도하는 마무리.
- 브랜드 톤앤매너를 문체에 반영할 것. 이모지는 쓰지 말 것.
- 글자수 제한을 반드시 지킬 것. 넘으면 카드에서 잘린다.

JSON 배열만 출력해라. 형식: [{"role":"cover","title":"...","body":"..."}]`;

  const raw = await genJSON<CopyOut>(key, prompt);
  return raw.slice(0, n).map((c) => ({
    role: c.role ?? 'body',
    title: String(c.title ?? '').slice(0, LIMITS.bodyTitle + 10),
    body: String(c.body ?? '').slice(0, LIMITS.body + 20),
  }));
}

export async function buildBackgrounds(ws: Workspace, key: string | null, cards: Card[]): Promise<(string | null)[]> {
  const brand = ws.brand!;
  const charRef = ws.character ? await refFrom(ws.character.mainImageUrl) : null;

  return Promise.all(
    cards.map(async (card, i) => {
      if (!key) {
        return placeholderBackground({ primary: brand.colors.primary, secondary: brand.colors.secondary, seed: i });
      }
      try {
        const buf = await genImage(key, {
          model: MODELS.cardBackground,
          prompt: backgroundPrompt(brand, card, !!charRef),
          refs: charRef ? [charRef] : undefined,
        });
        return await saveImage(buf, `bg-${i}`);
      } catch {
        // 한 장이 실패해도 덱 전체를 버리지 않는다 (PRD F11 재시도의 전신)
        return placeholderBackground({ primary: brand.colors.primary, secondary: brand.colors.secondary, seed: i });
      }
    }),
  );
}
