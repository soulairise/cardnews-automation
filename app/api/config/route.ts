import { NextRequest, NextResponse } from 'next/server';
import { mutate, readState, resolveKey } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = readState();
  const key = resolveKey(s);
  return NextResponse.json({
    hasKey: !!key,
    source: s.apiKey ? 'app' : key ? 'env' : null,
    masked: key ? `${key.slice(0, 4)}${'*'.repeat(Math.max(0, key.length - 8))}${key.slice(-4)}` : null,
  });
}

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();
  if (typeof apiKey !== 'string' || apiKey.trim().length < 20) {
    return NextResponse.json({ error: '키 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  mutate((s) => ({ ...s, apiKey: apiKey.trim() }));
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  mutate((s) => ({ ...s, apiKey: undefined }));
  return NextResponse.json({ ok: true });
}
