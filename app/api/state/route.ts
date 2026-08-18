import { NextResponse } from 'next/server';
import { currentKey, getWorkspace, readState, resolveKey } from '@/lib/store';
import { planStatus } from '@/lib/freeplan';
import { GUEST_KEY } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = readState();
  const key = await currentKey();
  const ws = getWorkspace(s, key);
  const gem = resolveKey(s);

  return NextResponse.json({
    hasKey: !!gem,
    keySource: s.apiKey ? 'app' : gem ? 'env' : null,
    user: key === GUEST_KEY ? null : (s.users[key] ?? null),
    brand: ws.brand ?? null,
    character: ws.character ?? null,
    candidates: ws.candidates ?? [],
    decks: ws.decks,
    plan: planStatus(key, ws.characterSheetsUsed, ws.decks.length),
  });
}
