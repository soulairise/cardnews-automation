'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brand, Character, CharacterCandidate } from '@/lib/types';
import { getApiKey, loadWorkspace, updateWorkspace } from '@/lib/local';
import { buildCandidates, buildSheet } from '@/lib/pipeline';
import { FREE_PLAN } from '@/lib/freeplan';

export default function CharacterPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [candidates, setCandidates] = useState<CharacterCandidate[]>([]);
  const [sheetsUsed, setSheetsUsed] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<'' | 'candidates' | 'lock'>('');
  const [err, setErr] = useState('');
  const hasKey = typeof window !== 'undefined' && !!getApiKey();

  useEffect(() => {
    loadWorkspace().then((w) => {
      setBrand(w.brand ?? null);
      setCharacter(w.character ?? null);
      setCandidates(w.candidates ?? []);
      setSheetsUsed(w.characterSheetsUsed);
      setReady(true);
    });
  }, []);

  async function makeCandidates() {
    if (!brand) return;
    setBusy('candidates');
    setErr('');
    try {
      const next = await buildCandidates(brand, getApiKey());
      await updateWorkspace((w) => ({ ...w, candidates: next }));
      setCandidates(next);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy('');
  }

  async function lock() {
    if (!brand || !picked) return;
    if (sheetsUsed >= FREE_PLAN.maxCharacterSheets) {
      return setErr(`체험판에서는 캐릭터 시트를 ${FREE_PLAN.maxCharacterSheets}회만 만들 수 있습니다.`);
    }
    const candidate = candidates.find((c) => c.id === picked);
    if (!candidate) return;

    setBusy('lock');
    setErr('');
    try {
      const sheet = await buildSheet(brand, getApiKey(), candidate);
      const next: Character = {
        id: candidate.id,
        description: candidate.description,
        mainImageUrl: candidate.imageUrl,
        sheet,
        lockedAt: new Date().toISOString(),
      };
      await updateWorkspace((w) => ({ ...w, character: next, characterSheetsUsed: w.characterSheetsUsed + 1 }));
      router.push('/create');
    } catch (e) {
      setErr((e as Error).message);
      setBusy('');
    }
  }

  if (!ready) return <p className="text-sm text-[var(--muted)]">불러오는 중…</p>;

  if (!brand) {
    return (
      <div className="panel">
        <p className="text-sm">브랜드를 먼저 등록해야 캐릭터를 만들 수 있습니다.</p>
        <Link href="/brand" className="btn-primary mt-4 inline-block">① 브랜드 등록하러 가기</Link>
      </div>
    );
  }

  if (character) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">② 캐릭터 — 확정됨</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            이 레퍼런스 시트가 앞으로 모든 카드 생성에 참조로 들어갑니다. 매번 새로 만들지 않기 때문에
            회차가 달라져도 같은 캐릭터가 나옵니다.
          </p>
        </header>
        <section className="panel">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <figure className="space-y-2">
              <img src={character.mainImageUrl} alt="" className="aspect-square w-full rounded-xl border border-[var(--line)] object-cover" />
              <figcaption className="text-center text-xs font-semibold">대표</figcaption>
            </figure>
            {character.sheet.map((v) => (
              <figure key={v.label} className="space-y-2">
                <img src={v.imageUrl} alt="" className="aspect-square w-full rounded-xl border border-[var(--line)] object-cover" />
                <figcaption className="text-center text-xs text-[var(--muted)]">{v.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>
        <Link href="/create" className="btn-primary inline-block">③ 카드뉴스 만들기 →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">② 캐릭터 생성</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          브랜드 정보를 바탕으로 후보를 만들고, 하나를 고르면 레퍼런스 시트로 고정합니다.
        </p>
      </header>

      {!hasKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          API 키가 없어 <b>플레이스홀더 캐릭터</b>가 나옵니다. 흐름 확인용이며,{' '}
          <Link href="/settings" className="font-semibold text-[var(--accent)] underline">설정</Link>에서 키를 넣으면 실제 생성으로 바뀝니다.
        </div>
      )}

      {candidates.length === 0 ? (
        <section className="panel">
          <button className="btn-primary" onClick={makeCandidates} disabled={busy === 'candidates'}>
            {busy === 'candidates' ? '후보 만드는 중…' : '캐릭터 후보 3안 만들기'}
          </button>
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </section>
      ) : (
        <section className="panel space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {candidates.map((c) => (
              <button key={c.id} type="button" onClick={() => setPicked(c.id)}
                className={`overflow-hidden rounded-xl border-2 text-left transition ${
                  picked === c.id ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/25' : 'border-[var(--line)] hover:border-neutral-300'
                }`}>
                <img src={c.imageUrl} alt="" className="aspect-square w-full object-cover" />
                <span className="block px-3 py-2 text-xs font-semibold">{c.description}</span>
              </button>
            ))}
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={lock} disabled={!picked || busy === 'lock'}>
              {busy === 'lock' ? '레퍼런스 시트 만드는 중…' : '이 캐릭터로 확정하기'}
            </button>
            <button className="btn-ghost" onClick={makeCandidates} disabled={busy === 'candidates'}>
              {busy === 'candidates' ? '다시 만드는 중…' : '후보 다시 만들기'}
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            확정하면 정면·측면·미소 3컷을 생성해 브랜드 자산으로 고정합니다.
          </p>
        </section>
      )}
    </div>
  );
}
