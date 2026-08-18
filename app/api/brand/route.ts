import { NextRequest, NextResponse } from 'next/server';
import { currentKey, updateWorkspace } from '@/lib/store';
import { Brand } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Brand>;
  if (!body.name?.trim()) {
    return NextResponse.json({ error: '브랜드명을 입력하세요.' }, { status: 400 });
  }
  const brand: Brand = {
    name: body.name.trim(),
    colors: {
      primary: body.colors?.primary || '#2F6BFF',
      secondary: body.colors?.secondary || '#7AA2FF',
      bg: body.colors?.bg || '#FFFFFF',
      text: body.colors?.text || '#151719',
    },
    tone: body.tone?.trim() || '친근하고 신뢰감 있는 존댓말',
    audience: body.audience?.trim() || '20~40대 일반 대중',
    logoDataUrl: body.logoDataUrl,
    createdAt: new Date().toISOString(),
  };
  const key = await currentKey();
  // 브랜드를 바꾸면 기존 캐릭터 후보는 무효가 된다 (확정된 캐릭터는 유지)
  await updateWorkspace(key, (w) => ({ ...w, brand, candidates: [] }));
  return NextResponse.json({ ok: true, brand });
}
