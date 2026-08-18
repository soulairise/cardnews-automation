import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { buildAuthUrl, creds, isProvider } from '@/lib/auth';
import { readState } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (!isProvider(provider)) {
    return NextResponse.redirect(new URL('/login?error=unknown_provider', req.url));
  }

  const c = creds(readState(), provider);
  if (!c) {
    return NextResponse.redirect(new URL(`/login?error=not_configured&provider=${provider}`, req.url));
  }

  const origin = new URL(req.url).origin;
  const oauthState = crypto.randomBytes(16).toString('hex');

  const res = NextResponse.redirect(buildAuthUrl(provider, c.clientId, origin, oauthState));
  // CSRF 방어 — 콜백에서 대조한다
  res.cookies.set(`oauth_state_${provider}`, oauthState, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
