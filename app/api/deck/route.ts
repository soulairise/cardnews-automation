import { NextRequest, NextResponse } from 'next/server';
import { currentKey, getWorkspace, isGuestKey, resolveGeminiKey, updateWorkspace } from '@/lib/store';
import { buildBackgrounds, buildCopy } from '@/lib/pipeline';
import { planFor } from '@/lib/freeplan';
import { Card, Deck } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { topic } = await req.json();
  const key = await currentKey();
  const [ws, gem] = await Promise.all([getWorkspace(key), resolveGeminiKey()]);
  const plan = planFor(key);

  if (!ws.brand) return NextResponse.json({ error: '브랜드를 먼저 등록하세요.' }, { status: 400 });
  if (!topic?.trim()) return NextResponse.json({ error: '홍보 내용을 입력하세요.' }, { status: 400 });

  if (ws.decks.length >= plan.maxDecks) {
    const guest = isGuestKey(key);
    return NextResponse.json(
      {
        error: guest
          ? `무료 체험은 ${plan.maxDecks}건까지입니다. 로그인하면 계속 만들 수 있습니다.`
          : `${plan.label}에서는 카드뉴스를 ${plan.maxDecks}건까지 만들 수 있습니다.`,
        needLogin: guest,
      },
      { status: 402 },
    );
  }

  try {
    const copy = await buildCopy(ws, gem, key, topic.trim());
    const cards: Card[] = copy.map((c, i) => ({
      id: `c${i}`,
      role: c.role,
      title: c.title,
      body: c.body,
      backgroundUrl: null,
    }));
    const backgrounds = await buildBackgrounds(ws, gem, cards);
    cards.forEach((c, i) => (c.backgroundUrl = backgrounds[i]));

    const deck: Deck = { id: `d${Date.now()}`, topic: topic.trim(), cards, createdAt: new Date().toISOString() };
    await updateWorkspace(key, (w) => ({ ...w, decks: [...w.decks, deck] }));
    return NextResponse.json({ ok: true, deck });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** 텍스트 인라인 수정 — 재생성 없이 저장한다 (하이브리드 렌더링의 핵심 이점) */
export async function PATCH(req: NextRequest) {
  const { deckId, cards } = (await req.json()) as { deckId: string; cards: Card[] };
  const key = await currentKey();
  await updateWorkspace(key, (w) => ({
    ...w,
    decks: w.decks.map((d) => (d.id === deckId ? { ...d, cards } : d)),
  }));
  return NextResponse.json({ ok: true });
}
