'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import CardCanvas, { CARD_H, CARD_W } from '@/components/CardCanvas';
import { Brand, Card, Deck, Workspace } from '@/lib/types';
import { checkDeck, LIMITS } from '@/lib/qc';
import { getApiKey, loadWorkspace, updateWorkspace } from '@/lib/local';
import { buildBackgrounds, buildCopy } from '@/lib/pipeline';
import { FREE_PLAN, planStatus } from '@/lib/freeplan';

const PREVIEW_W = 300;
const SCALE = PREVIEW_W / CARD_W;

export default function CreatePage() {
  const [ready, setReady] = useState(false);
  const [ws, setWs] = useState<Workspace | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const hasKey = typeof window !== 'undefined' && !!getApiKey();

  useEffect(() => {
    loadWorkspace().then((w) => {
      setWs(w);
      if (w.decks.length) setDeck(w.decks[w.decks.length - 1]);
      setReady(true);
    });
  }, []);

  const brand: Brand | null = ws?.brand ?? null;
  const plan = ws ? planStatus(ws.characterSheetsUsed, ws.decks.length) : null;

  const issues = useMemo(
    () => (deck && brand ? checkDeck(deck.cards, brand.colors.text, brand.colors.bg) : []),
    [deck, brand],
  );

  async function generate() {
    if (!ws?.brand) return;
    if (ws.decks.length >= FREE_PLAN.maxDecks) {
      return setErr(`체험판에서는 카드뉴스를 ${FREE_PLAN.maxDecks}건까지 만들 수 있습니다. 설정에서 데이터를 지우면 다시 만들 수 있습니다.`);
    }
    setBusy(true);
    setErr('');
    setNote('');
    try {
      const key = getApiKey();
      const copy = await buildCopy(ws.brand, key, topic.trim());
      const cards: Card[] = copy.map((c, i) => ({
        id: `c${i}`, role: c.role, title: c.title, body: c.body, backgroundUrl: null,
      }));
      const backgrounds = await buildBackgrounds(ws, key, cards);
      cards.forEach((c, i) => (c.backgroundUrl = backgrounds[i]));

      const next: Deck = { id: `d${Date.now()}`, topic: topic.trim(), cards, createdAt: new Date().toISOString() };
      const saved = await updateWorkspace((w) => ({ ...w, decks: [...w.decks, next] }));
      setWs(saved);
      setDeck(next);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  function editCard(id: string, patch: Partial<Card>) {
    setDeck((d) => (d ? { ...d, cards: d.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) } : d));
    setNote('');
  }

  async function saveEdits() {
    if (!deck) return;
    const saved = await updateWorkspace((w) => ({
      ...w,
      decks: w.decks.map((d) => (d.id === deck.id ? deck : d)),
    }));
    setWs(saved);
    setNote('수정 내용을 저장했습니다. 이미지는 다시 생성하지 않았습니다.');
  }

  async function download(i: number) {
    const node = nodes.current[i];
    if (!node) return;
    try {
      const url = await toPng(node, { width: CARD_W, height: CARD_H, pixelRatio: 1, cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brand?.name ?? 'card'}-${String(i + 1).padStart(2, '0')}.png`;
      a.click();
    } catch (e) {
      setErr(`이미지 내보내기에 실패했습니다: ${(e as Error).message}`);
    }
  }

  async function downloadAll() {
    if (!deck) return;
    for (let i = 0; i < deck.cards.length; i++) {
      await download(i);
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  if (!ready) return <p className="text-sm text-[var(--muted)]">불러오는 중…</p>;

  if (!brand) {
    return (
      <div className="panel">
        <p className="text-sm">브랜드를 먼저 등록해야 카드뉴스를 만들 수 있습니다.</p>
        <Link href="/brand" className="btn-primary mt-4 inline-block">① 브랜드 등록하러 가기</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">③ 카드뉴스 만들기</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          홍보 내용만 넣으면 됩니다. 텍스트 수정은 이미지 재생성 없이 바로 반영됩니다.
        </p>
      </header>

      <section className="panel space-y-3">
        <label className="label" htmlFor="topic">이번에 알리고 싶은 내용</label>
        <textarea id="topic" rows={4} className="field resize-y"
          placeholder="예: 9월 15일 저녁 7시, 요가명상학과 가을 특강을 엽니다. 참가비 무료, 선착순 30명. 초보자도 참여할 수 있습니다."
          value={topic} onChange={(e) => setTopic(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={generate} disabled={busy || !topic.trim()}>
            {busy ? '만드는 중… (최대 1분)' : '카드뉴스 5장 만들기'}
          </button>
          {plan && (
            <span className="text-xs text-[var(--muted)]">
              {plan.decks.used}/{plan.decks.max}건 사용 · 잔여 {plan.decks.left}건
            </span>
          )}
          {!hasKey && (
            <span className="text-xs text-amber-700">키 없음 — 배경은 브랜드 컬러 그라데이션으로 대체됩니다</span>
          )}
        </div>
        {err && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{err}</p>}
      </section>

      {deck && (
        <>
          <section className="panel">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-bold">자동 품질검사</h2>
              {issues.length === 0 ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  통과 — 잘림·대비 문제 없음
                </span>
              ) : (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {issues.length}건 확인 필요
                </span>
              )}
            </div>
            {issues.length > 0 && (
              <ul className="space-y-1 text-sm">
                {issues.map((i, n) => (
                  <li key={n} className={i.level === 'error' ? 'text-red-600' : 'text-amber-700'}>
                    · [{i.cardId}] {i.message}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={downloadAll}>전체 PNG 다운로드</button>
            <button className="btn-ghost" onClick={saveEdits}>수정 내용 저장</button>
            <button className="btn-ghost" disabled title="체험판은 발행이 제외됩니다">SNS 발행 (준비 중)</button>
          </div>
          {note && <p className="text-sm text-emerald-700">{note}</p>}

          <div className="space-y-6">
            {deck.cards.map((card, i) => (
              <section key={card.id} className="panel grid gap-6 md:grid-cols-[300px_1fr]">
                <div>
                  <div style={{ width: PREVIEW_W, height: CARD_H * SCALE }} className="overflow-hidden rounded-xl border border-[var(--line)]">
                    <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                      <CardCanvas
                        ref={(el) => { nodes.current[i] = el; }}
                        card={card} brand={brand} index={i} total={deck.cards.length}
                      />
                    </div>
                  </div>
                  <button className="btn-ghost mt-3 w-full" onClick={() => download(i)}>이 장만 다운로드</button>
                </div>

                <div className="space-y-3">
                  <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold">
                    {i + 1}장 · {card.role === 'cover' ? '표지' : card.role === 'cta' ? '마무리' : '본문'}
                  </span>
                  <div>
                    <label className="label">
                      제목 <span className={card.title.length > (card.role === 'cover' ? LIMITS.coverTitle : LIMITS.bodyTitle) ? 'text-red-600' : ''}>
                        {card.title.length}/{card.role === 'cover' ? LIMITS.coverTitle : LIMITS.bodyTitle}자
                      </span>
                    </label>
                    <input className="field" value={card.title} onChange={(e) => editCard(card.id, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">
                      본문 <span className={card.body.length > LIMITS.body ? 'text-red-600' : ''}>
                        {card.body.length}/{LIMITS.body}자
                      </span>
                    </label>
                    <textarea rows={3} className="field resize-y" value={card.body}
                      onChange={(e) => editCard(card.id, { body: e.target.value })} />
                  </div>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
