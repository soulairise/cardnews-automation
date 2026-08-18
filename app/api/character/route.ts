import { NextRequest, NextResponse } from 'next/server';
import { currentKey, getWorkspace, isGuestKey, resolveGeminiKey, updateWorkspace } from '@/lib/store';
import { buildCandidates, buildSheet } from '@/lib/pipeline';
import { planFor } from '@/lib/freeplan';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { action, candidateId } = await req.json();
  const key = await currentKey();
  const [ws, gem] = await Promise.all([getWorkspace(key), resolveGeminiKey()]);
  const plan = planFor(key);

  if (!ws.brand) return NextResponse.json({ error: '브랜드를 먼저 등록하세요.' }, { status: 400 });

  try {
    if (action === 'candidates') {
      const candidates = await buildCandidates(ws, gem);
      await updateWorkspace(key, (w) => ({ ...w, candidates }));
      return NextResponse.json({ ok: true, candidates });
    }

    if (action === 'lock') {
      if (ws.characterSheetsUsed >= plan.maxCharacterSheets) {
        return NextResponse.json(
          {
            error: `${plan.label}에서는 캐릭터 시트를 ${plan.maxCharacterSheets}회만 만들 수 있습니다.`,
            needLogin: isGuestKey(key),
          },
          { status: 402 },
        );
      }
      const candidate = ws.candidates?.find((c) => c.id === candidateId);
      if (!candidate) return NextResponse.json({ error: '선택한 후보를 찾을 수 없습니다.' }, { status: 400 });

      const sheet = await buildSheet(ws, gem, candidate);
      const character = {
        id: candidate.id,
        description: candidate.description,
        mainImageUrl: candidate.imageUrl,
        sheet,
        lockedAt: new Date().toISOString(),
      };
      await updateWorkspace(key, (w) => ({ ...w, character, characterSheetsUsed: w.characterSheetsUsed + 1 }));
      return NextResponse.json({ ok: true, character });
    }

    return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
