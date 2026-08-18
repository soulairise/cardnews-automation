import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, mutate } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** 로그아웃 — 세션만 지우고 작업 공간은 계정에 남긴다 */
export async function DELETE(req: NextRequest) {
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  if (sid) {
    mutate((s) => {
      const sessions = { ...s.sessions };
      delete sessions[sid];
      return { ...s, sessions };
    });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
