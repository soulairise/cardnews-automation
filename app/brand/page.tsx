'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brand } from '@/lib/types';
import { loadWorkspace, updateWorkspace } from '@/lib/local';

const PRESETS = [
  { name: '블루', primary: '#2F6BFF', secondary: '#7AA2FF' },
  { name: '그린', primary: '#0F9D58', secondary: '#6FD79B' },
  { name: '코랄', primary: '#FF5A5F', secondary: '#FFA8AB' },
  { name: '보라', primary: '#6B4EFF', secondary: '#AE9BFF' },
  { name: '먹색', primary: '#1F2937', secondary: '#6B7280' },
];

export default function BrandPage() {
  const router = useRouter();
  const [form, setForm] = useState<Brand>({
    name: '',
    colors: { primary: '#2F6BFF', secondary: '#7AA2FF', bg: '#FFFFFF', text: '#151719' },
    tone: '친근하고 신뢰감 있는 존댓말',
    audience: '20~40대 일반 대중',
    createdAt: '',
  });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadWorkspace().then((w) => { if (w.brand) setForm(w.brand); });
  }, []);

  function setColor(k: keyof Brand['colors'], v: string) {
    setForm((f) => ({ ...f, colors: { ...f.colors, [k]: v } }));
  }

  function onLogo(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logoDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!form.name.trim()) return setMsg('브랜드명을 입력하세요.');
    setBusy(true);
    const brand: Brand = { ...form, name: form.name.trim(), createdAt: new Date().toISOString() };
    // 브랜드를 바꾸면 기존 캐릭터 후보는 무효가 된다 (확정된 캐릭터는 유지)
    await updateWorkspace((w) => ({ ...w, brand, candidates: [] }));
    setBusy(false);
    router.push('/character');
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">① 브랜드 정보 등록</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">한 번만 등록하면 이후 모든 카드뉴스에 자동으로 적용됩니다.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <section className="panel space-y-4">
          <div>
            <label className="label" htmlFor="bname">브랜드명</label>
            <input id="bname" className="field" value={form.name} placeholder="예: 소울라이즈"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label className="label">브랜드 컬러</label>
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} type="button"
                  onClick={() => setForm((f) => ({ ...f, colors: { ...f.colors, primary: p.primary, secondary: p.secondary } }))}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">
                  <span className="h-3 w-3 rounded-full" style={{ background: p.primary }} />
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {([['primary', '주색'], ['secondary', '보조색'], ['bg', '배경'], ['text', '글자']] as const).map(([k, label]) => (
                <div key={k}>
                  <span className="label">{label}</span>
                  <input type="color" className="h-10 w-full cursor-pointer rounded-lg border border-[var(--line)]"
                    value={form.colors[k]} onChange={(e) => setColor(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="tone">톤앤매너 (문체)</label>
            <input id="tone" className="field" value={form.tone}
              placeholder="예: 담백한 존댓말, 과장 없는 설명체"
              onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))} />
          </div>

          <div>
            <label className="label" htmlFor="aud">타겟 독자</label>
            <input id="aud" className="field" value={form.audience}
              placeholder="예: 요가·명상에 관심 있는 30~50대"
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} />
          </div>

          <div>
            <label className="label" htmlFor="logo">로고 (PNG/SVG, 배경 투명)</label>
            <input id="logo" type="file" accept="image/png,image/svg+xml"
              className="text-sm" onChange={(e) => onLogo(e.target.files?.[0])} />
          </div>

          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button className="btn-primary" onClick={save} disabled={busy || !form.name.trim()}>
            {busy ? '저장 중…' : '저장하고 캐릭터 만들기 →'}
          </button>
        </section>

        <aside className="panel">
          <span className="label">미리보기</span>
          <div className="overflow-hidden rounded-xl border border-[var(--line)]"
            style={{ background: form.colors.bg }}>
            <div style={{ height: 90, background: `linear-gradient(120deg, ${form.colors.primary}, ${form.colors.secondary})` }} />
            <div className="p-4">
              <div className="h-1.5 w-10 rounded-full" style={{ background: form.colors.primary }} />
              <p className="mt-3 text-lg font-extrabold leading-tight" style={{ color: form.colors.text }}>
                {form.name || '브랜드명'}
              </p>
              <p className="mt-1.5 text-xs" style={{ color: form.colors.text, opacity: 0.7 }}>{form.tone}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
