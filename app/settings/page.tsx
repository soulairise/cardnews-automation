'use client';
import { useEffect, useState } from 'react';
import OAuthSetup from '@/components/OAuthSetup';

export default function SettingsPage() {
  const [key, setKey] = useState('');
  const [info, setInfo] = useState<{ hasKey: boolean; source: string | null; masked: string | null } | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => fetch('/api/config').then((r) => r.json()).then(setInfo);
  useEffect(() => { load(); }, []);

  async function save() {
    setBusy(true);
    setMsg('');
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg(data.error ?? '저장에 실패했습니다.');
    setKey('');
    setMsg('저장했습니다. 이제 실제 이미지 생성이 켜집니다.');
    load();
  }

  async function remove() {
    await fetch('/api/config', { method: 'DELETE' });
    setMsg('앱에 저장된 키를 삭제했습니다.');
    load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Gemini API 키를 넣으면 캐릭터와 배경이 실제 모델로 생성됩니다. 키가 없어도 전체 흐름은 그대로 동작합니다.
        </p>
      </header>

      <section className="panel space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${info?.hasKey ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
          {info?.hasKey ? (
            <span>
              연결됨 <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{info.masked}</code>
              <span className="ml-2 text-xs text-[var(--muted)]">
                ({info.source === 'env' ? '.env.local 파일' : '앱에 저장됨'})
              </span>
            </span>
          ) : (
            <span className="text-[var(--muted)]">키 없음 — 플레이스홀더 모드로 동작 중</span>
          )}
        </div>

        <div>
          <label className="label" htmlFor="apikey">Gemini API 키</label>
          <div className="flex gap-2">
            <input
              id="apikey"
              type="password"
              className="field font-mono"
              placeholder="여기에 붙여넣기"
              value={key}
              autoComplete="off"
              onChange={(e) => setKey(e.target.value)}
            />
            <button className="btn-primary shrink-0" onClick={save} disabled={busy || key.trim().length < 20}>
              {busy ? '저장 중…' : '저장'}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            키는 이 컴퓨터의 <code>.data/state.json</code> 에만 저장되며 외부로 전송되지 않습니다.{' '}
            <a
              className="font-semibold text-[var(--accent)] underline"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
            >
              키 발급받기 →
            </a>
          </p>
        </div>

        {msg && <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm">{msg}</p>}

        {info?.source === 'app' && (
          <button className="btn-ghost" onClick={remove}>앱에 저장된 키 삭제</button>
        )}
      </section>

      <OAuthSetup />

      <section className="panel">
        <h2 className="mb-2 text-sm font-bold">사용 모델</h2>
        <ul className="space-y-1 text-sm text-[var(--muted)]">
          <li>· 캐릭터 시트 — <code>gemini-3-pro-image</code> (브랜드당 1회성이라 고급 모델)</li>
          <li>· 카드 배경 — <code>gemini-3.1-flash-image</code> (매 건 발생하므로 표준 모델)</li>
          <li>· 카피 생성 — <code>gemini-3.7-flash</code></li>
        </ul>
      </section>
    </div>
  );
}
