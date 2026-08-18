import { NextRequest, NextResponse } from 'next/server';
import { creds, isProvider } from '@/lib/auth';
import { mutate, readState } from '@/lib/store';
import { Provider } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ALL: Provider[] = ['google', 'naver', 'kakao'];

export async function GET() {
  const s = readState();
  return NextResponse.json({
    providers: ALL.map((p) => ({ provider: p, configured: !!creds(s, p) })),
  });
}

export async function POST(req: NextRequest) {
  const { provider, clientId, clientSecret } = await req.json();
  if (!isProvider(provider)) return NextResponse.json({ error: '알 수 없는 제공자' }, { status: 400 });
  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.json({ error: 'Client ID 와 Secret 을 모두 입력하세요.' }, { status: 400 });
  }
  mutate((s) => ({
    ...s,
    oauth: { ...s.oauth, [provider]: { clientId: clientId.trim(), clientSecret: clientSecret.trim() } },
  }));
  return NextResponse.json({ ok: true });
}
