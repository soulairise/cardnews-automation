'use client';
import { useEffect, useState } from 'react';
import { clearApiKey, getApiKey, maskKey, resetWorkspace, setApiKey } from '@/lib/local';

export default function SettingsPage() {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { setSaved(getApiKey()); }, []);

  function save() {
    setApiKey(key);
    setKey('');
    setSaved(getApiKey());
    setMsg('저장했습니다. 이제 실제 이미지 생성이 켜집니다.');
  }

  function remove() {
    clearApiKey();
    setSaved(null);
    setMsg('키를 삭제했습니다.');
  }

  async function wipe() {
    await resetWorkspace();
    setMsg('브랜드·캐릭터·카드뉴스를 모두 지웠습니다. 처음부터 다시 만들 수 있습니다.');
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
          <span className={`h-2.5 w-2.5 rounded-full ${saved ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
          {saved ? (
            <span>연결됨 <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{maskKey(saved)}</code></span>
          ) : (
            <span className="text-[var(--muted)]">키 없음 — 플레이스홀더 모드로 동작 중</span>
          )}
        </div>

        <div>
          <label className="label" htmlFor="apikey">Gemini API 키</label>
          <div className="flex gap-2">
            <input
              id="apikey" type="password" className="field font-mono" autoComplete="off"
              placeholder="여기에 붙여넣기"
              value={key} onChange={(e) => setKey(e.target.value)}
            />
            <button className="btn-primary shrink-0" onClick={save} disabled={key.trim().length < 20}>저장</button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            이 사이트에는 서버가 없습니다. 키는 <b>이 브라우저에만</b> 저장되고 Google 외 어디로도 전송되지 않습니다.{' '}
            <a className="font-semibold text-[var(--accent)] underline"
               href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              키 발급받기 →
            </a>
          </p>
        </div>

        {msg && <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm">{msg}</p>}
        {saved && <button className="btn-ghost" onClick={remove}>저장된 키 삭제</button>}
      </section>

      <section className="panel space-y-3">
        <h2 className="text-sm font-bold">사용 모델</h2>
        <ul className="space-y-1 text-sm text-[var(--muted)]">
          <li>· 캐릭터 시트 — <code>gemini-3-pro-image</code> (브랜드당 1회성이라 고급 모델)</li>
          <li>· 카드 배경 — <code>gemini-3.1-flash-image</code> (매 건 발생하므로 표준 모델)</li>
          <li>· 카피 생성 — <code>gemini-3.7-flash</code></li>
        </ul>
      </section>

      <section className="panel space-y-3">
        <h2 className="text-sm font-bold">내 데이터</h2>
        <p className="text-sm text-[var(--muted)]">
          브랜드·캐릭터·카드뉴스는 이 브라우저(IndexedDB)에만 저장됩니다. 다른 기기에서는 보이지 않고,
          브라우저 데이터를 지우면 함께 사라집니다.
        </p>
        <button className="btn-ghost" onClick={wipe}>전부 지우고 처음부터</button>
      </section>
    </div>
  );
}
