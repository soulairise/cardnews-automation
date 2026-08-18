import { NextRequest, NextResponse } from 'next/server';
import { getConfig, patchConfig, resolveGeminiKey } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = await resolveGeminiKey();
  const saved = (await getConfig()).apiKey;
  return NextResponse.json({
    hasKey: !!key,
    source: saved ? 'app' : key ? 'env' : null,
    masked: key ? `${key.slice(0, 4)}${'*'.repeat(Math.max(0, key.length - 8))}${key.slice(-4)}` : null,
  });
}

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();
  if (typeof apiKey !== 'string' || apiKey.trim().length < 20) {
    return NextResponse.json({ error: '키 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  await patchConfig({ apiKey: apiKey.trim() });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await patchConfig({ apiKey: undefined });
  return NextResponse.json({ ok: true });
}
