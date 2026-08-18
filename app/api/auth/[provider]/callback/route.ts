import { NextRequest, NextResponse } from 'next/server';
import { creds, exchangeAndFetchUser, isProvider } from '@/lib/auth';
import { SESSION_COOKIE, mutate, newSessionId, readState } from '@/lib/store';
import { EMPTY_WORKSPACE, GUEST_KEY } from '@/lib/types';

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

  const c = creds(readState(), provider);
  if (!c) return NextResponse.redirect(new URL(`/login?error=not_configured&provider=${provider}`, req.url));

  let user;
  try {
    user = await exchangeAndFetchUser(provider, code, c.clientId, c.clientSecret, url.origin, returnedState!);
  } catch (e) {
    const msg = encodeURIComponent((e as Error).message.slice(0, 120));
    return NextResponse.redirect(new URL(`/login?error=exchange_failed&detail=${msg}`, req.url));
  }

  const sid = newSessionId();
  mutate((s) => {
    const isNew = !s.workspaces[user.key];
    const guest = s.workspaces[GUEST_KEY];
    // 비로그인 상태에서 만들던 작업은 첫 로그인 때 그대로 넘겨준다
    const carried = isNew && guest ? guest : (s.workspaces[user.key] ?? structuredClone(EMPTY_WORKSPACE));
    const workspaces = { ...s.workspaces, [user.key]: carried };
    if (isNew && guest) delete workspaces[GUEST_KEY];

    return {
      ...s,
      users: { ...s.users, [user.key]: { ...(s.users[user.key] ?? user), ...user, joinedAt: s.users[user.key]?.joinedAt ?? user.joinedAt } },
      sessions: { ...s.sessions, [sid]: { key: user.key, createdAt: new Date().toISOString() } },
      workspaces,
    };
  });

  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.delete(`oauth_state_${provider}`);
  return res;
}
