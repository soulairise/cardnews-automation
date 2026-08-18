import { NextResponse } from 'next/server';
import { currentKey, getUser, getWorkspace, isGuestKey, resolveGeminiKey, usingDb } from '@/lib/store';
import { planStatus } from '@/lib/freeplan';

export const dynamic = 'force-dynamic';

export async function GET() {
  const key = await currentKey();
  const [ws, gem, user] = await Promise.all([
    getWorkspace(key),
    resolveGeminiKey(),
    isGuestKey(key) ? Promise.resolve(null) : getUser(key),
  ]);

  return NextResponse.json({
    hasKey: !!gem,
    storage: usingDb ? 'supabase' : 'file',
    user,
    brand: ws.brand ?? null,
    character: ws.character ?? null,
    candidates: ws.candidates ?? [],
    decks: ws.decks,
    plan: planStatus(key, ws.characterSheetsUsed, ws.decks.length),
  });
}
