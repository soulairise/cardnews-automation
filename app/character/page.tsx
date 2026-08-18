'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Character, CharacterCandidate } from '@/lib/types';

type State = {
  hasKey: boolean;
  brand: { name: string } | null;
  character: Character | null;
  candidates: CharacterCandidate[];
  plan: { sheets: { left: number; max: number } };
};

export default function CharacterPage() {
  const router = useRouter();
  const [s, setS] = useState<State | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState<'' | 'candidates' | 'lock'>('');
  const [err, setErr] = useState('');

  const load = () => fetch('/api/state').then((r) => r.json()).then(setS);
  useEffect(() => { load(); }, []);

  async function call(action: 'candidates' | 'lock') {
    setBusy(action);
    setErr('');
    const res = await fetch('/api/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, candidateId: picked }),
    });
    const data = await res.json();
    setBusy('');
    if (!res.ok) return setErr(data.error);
    await load();
    if (action === 'lock') router.push('/create');
  }

  if (!s) return <p className="text-sm text-[var(--muted)]">불러오는 중…</p>;

  if (!s.brand) {
    return (
      <div className="panel">
        <p className="text-sm">브랜드를 먼저 등록해야 캐릭터를 만들 수 있습니다.</p>
        <Link href="/brand" className="btn-primary mt-4 inline-block">① 브랜드 등록하러 가기</Link>
      </div>
    );
  }

  if (s.character) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">② 캐릭터 — 확정됨</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            이 레퍼런스 시트가 앞으로 모든 카드 생성에 참조로 들어갑니다. 매번 새로 만들지 않기 때문에 회차가 달라져도 같은 캐릭터가 나옵니다.
          </p>
        </header>
        <section className="panel">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <figure className="space-y-2">
              <img src={s.character.mainImageUrl} alt="" className="aspect-square w-full rounded-xl border border-[var(--line)] object-cover" />
              <figcaption className="text-center text-xs font-semibold">대표</figcaption>
            </figure>
            {s.character.sheet.map((v) => (
              <figure key={v.label} className="space-y-2">
                <img src={v.imageUrl} alt="" className="aspect-square w-full rounded-xl border border-[var(--line)] object-cover" />
                <figcaption className="text-center text-xs text-[var(--muted)]">{v.label}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Free 체험은 캐릭터 시트 {s.plan.sheets.max}회까지입니다. 교체하려면 유료 플랜이 필요합니다.
          </p>
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
          브랜드 정보를 바탕으로 후보를 만들고, 하나를 고르면 레퍼런스 시트로 고정합니다. 고정 후에는 바꿀 수 없습니다.
        </p>
      </header>

      {!s.hasKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          API 키가 없어 <b>플레이스홀더 캐릭터</b>가 나옵니다. 흐름 확인용이며,{' '}
          <Link href="/settings" className="font-semibold text-[var(--accent)] underline">설정</Link>에서 키를 넣으면 실제 생성으로 바뀝니다.
        </div>
      )}

      {s.candidates.length === 0 ? (
        <section className="panel">
          <button className="btn-primary" onClick={() => call('candidates')} disabled={busy === 'candidates'}>
            {busy === 'candidates' ? '후보 만드는 중…' : '캐릭터 후보 3안 만들기'}
          </button>
          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </section>
      ) : (
        <section className="panel space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {s.candidates.map((c) => (
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
            <button className="btn-primary" onClick={() => call('lock')} disabled={!picked || busy === 'lock'}>
              {busy === 'lock' ? '레퍼런스 시트 만드는 중…' : '이 캐릭터로 확정하기'}
            </button>
            <button className="btn-ghost" onClick={() => call('candidates')} disabled={busy === 'candidates'}>
              {busy === 'candidates' ? '다시 만드는 중…' : '후보 다시 만들기'}
            </button>
          </div>
          <p className="text-xs text-[var(--muted)]">
            확정하면 정면·측면·미소 3컷을 생성해 브랜드 자산으로 고정합니다. Free 체험 잔여 {s.plan.sheets.left}회.
          </p>
        </section>
      )}
    </div>
  );
}
