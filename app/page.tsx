'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type S = {
  hasKey: boolean;
  user: { name: string } | null;
  brand: { name: string } | null;
  character: unknown | null;
  decks: unknown[];
  plan: {
    label: string;
    isGuest: boolean;
    sheets: { used: number; max: number; left: number };
    decks: { used: number; max: number; left: number };
  };
};

function Step({ n, title, desc, done, href, cta }: {
  n: string; title: string; desc: string; done: boolean; href: string; cta: string;
}) {
  return (
    <div className="panel flex items-start gap-4">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-[var(--muted)]'
      }`}>{done ? '✓' : n}</span>
      <div className="flex-1">
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>
      </div>
      <Link href={href} className={done ? 'btn-ghost' : 'btn-primary'}>{done ? '보기' : cta}</Link>
    </div>
  );
}

export default function Home() {
  const [s, setS] = useState<S | null>(null);
  useEffect(() => { fetch('/api/state').then((r) => r.json()).then(setS); }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">브랜드 카드뉴스 자동화</h1>
        <p className="mt-2 text-[var(--muted)]">
          브랜드를 한 번 등록하고 캐릭터를 고정하면, 이후에는 홍보 문구만 넣어도 같은 톤·같은 캐릭터의 카드뉴스가 나옵니다.
        </p>
      </header>

      {s && !s.hasKey && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <b>플레이스홀더 모드</b> — API 키 없이 전체 흐름이 동작합니다. 실제 이미지 생성을 켜려면{' '}
          <Link href="/settings" className="font-semibold text-[var(--accent)] underline">설정에서 키를 넣으세요</Link>.
        </div>
      )}

      <div className="space-y-3">
        <Step n="1" title="브랜드 정보 등록" desc="로고·컬러·폰트·톤앤매너. 한 번만 하면 됩니다."
          done={!!s?.brand} href="/brand" cta="등록하기" />
        <Step n="2" title="캐릭터 생성·고정" desc="후보 3안 중 하나를 골라 레퍼런스 시트로 고정합니다."
          done={!!s?.character} href="/character" cta="만들기" />
        <Step n="3" title="카드뉴스 생성" desc="홍보 문구 입력 → 5장 생성 → 텍스트 수정 → PNG 다운로드."
          done={!!s?.decks.length} href="/create" cta="만들기" />
      </div>

      {s && (
        <section className="panel">
          <h2 className="mb-3 text-sm font-bold">{s.plan.label} 사용량</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: '캐릭터 시트', ...s.plan.sheets },
              { label: '카드뉴스', ...s.plan.decks },
            ].map((x) => (
              <div key={x.label}>
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span>{x.label}</span><span className="text-[var(--muted)]">{x.used} / {x.max}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.min(100, (x.used / x.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          {s.plan.isGuest ? (
            <p className="mt-4 text-xs text-[var(--muted)]">
              비로그인 상태에서는 카드뉴스 {s.plan.decks.max}건까지 만들 수 있습니다.{' '}
              <Link href="/login" className="font-semibold text-[var(--accent)] underline">로그인</Link>하면
              한도가 늘어나고, 지금 만든 브랜드·캐릭터는 그대로 계정으로 옮겨집니다.
            </p>
          ) : (
            <p className="mt-4 text-xs text-[var(--muted)]">
              Free 플랜은 다운로드까지 제공하며 SNS 발행은 포함되지 않습니다. (PRD v0.3 10장)
            </p>
          )}
        </section>
      )}
    </div>
  );
}
