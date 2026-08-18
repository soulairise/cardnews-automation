import { NextRequest, NextResponse } from 'next/server';
import { isProvider } from '@/lib/auth';
import { getConfig, patchConfig, providerCreds } from '@/lib/store';
import { Provider } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ALL: Provider[] = ['google', 'naver', 'kakao'];

export async function GET() {
  const providers = await Promise.all(
    ALL.map(async (p) => ({ provider: p, configured: !!(await providerCreds(p)) })),
  );
  return NextResponse.json({ providers });
}

export async function POST(req: NextRequest) {
  const { provider, clientId, clientSecret } = await req.json();
  if (!isProvider(provider)) return NextResponse.json({ error: '알 수 없는 제공자' }, { status: 400 });
  if (!clientId?.trim() || !clientSecret?.trim()) {
    return NextResponse.json({ error: 'Client ID 와 Secret 을 모두 입력하세요.' }, { status: 400 });
  }
  const cfg = await getConfig();
  await patchConfig({
    oauth: { ...cfg.oauth, [provider]: { clientId: clientId.trim(), clientSecret: clientSecret.trim() } },
  });
  return NextResponse.json({ ok: true });
}
