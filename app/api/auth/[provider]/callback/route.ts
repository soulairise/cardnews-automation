import { NextRequest, NextResponse } from 'next/server';
import { exchangeAndFetchUser, isProvider } from '@/lib/auth';
import {
  GUEST_COOKIE, SESSION_COOKIE, createSession, deleteWorkspace,
  getUser, getWorkspace, newId, providerCreds, setWorkspace, upsertUser,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  if (!isProvider(provider)) return NextResponse.redirect(new URL('/login?error=unknown_provider', req.url));
  if (!code) return NextResponse.redirect(new URL('/login?error=no_code', req.url));

  const expected = req.cookies.get(`oauth_state_${provider}`)?.value;
  if (!expected || expected !== returnedState) {
    return NextResponse.redirect(new URL('/login?error=state_mismatch', req.url));
  }

  const c = await providerCreds(provider);
  if (!c) return NextResponse.redirect(new URL(`/login?error=not_configured&provider=${provider}`, req.url));

  let user;
  try {
    user = await exchangeAndFetchUser(provider, code, c.clientId, c.clientSecret, url.origin, returnedState!);
  } catch (e) {
    const msg = encodeURIComponent((e as Error).message.slice(0, 120));
    return NextResponse.redirect(new URL(`/login?error=exchange_failed&detail=${msg}`, req.url));
  }

  const existing = await getUser(user.key);
  await upsertUser(user);

  // 비로그인 상태에서 만들던 작업은 첫 로그인 때 계정으로 그대로 넘겨준다
  if (!existing) {
    const guestId = req.cookies.get(GUEST_COOKIE)?.value;
    if (guestId) {
      const guestKey = `guest:${guestId}`;
      const guestWs = await getWorkspace(guestKey);
      if (guestWs.brand || guestWs.decks.length) {
        await setWorkspace(user.key, guestWs);
        await deleteWorkspace(guestKey);
      }
    }
  }

  const sid = newId();
  await createSession(sid, user.key);

  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set(SESSION_COOKIE, sid, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.delete(`oauth_state_${provider}`);
  return res;
}
