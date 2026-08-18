'use client';
import { useEffect, useState } from 'react';
import { Provider } from '@/lib/types';

const META: Record<Provider, { name: string; console: string; note: string }> = {
  google: {
    name: 'Google',
    console: 'https://console.cloud.google.com/apis/credentials',
    note: 'OAuth 2.0 클라이언트 ID(웹 애플리케이션)를 만들고 아래 Redirect URI 를 "승인된 리디렉션 URI"에 등록하세요.',
  },
  naver: {
    name: '네이버',
    console: 'https://developers.naver.com/apps/#/register',
    note: '애플리케이션 등록 후 "네아로(네이버 아이디로 로그인)"를 사용 API 로 추가하고 Callback URL 을 등록하세요.',
  },
  kakao: {
    name: '카카오',
    console: 'https://developers.kakao.com/console/app',
    note: '내 애플리케이션 → 카카오 로그인 활성화 후 Redirect URI 등록. Client Secret 은 [보안] 탭에서 발급하고 "사용함"으로 설정하세요.',
  },
};

export default function OAuthSetup() {
  const [list, setList] = useState<{ provider: Provider; configured: boolean }[]>([]);
  const [open, setOpen] = useState<Provider | null>(null);
  const [form, setForm] = useState({ clientId: '', clientSecret: '' });
  const [msg, setMsg] = useState('');
  const [origin, setOrigin] = useState('');

  const load = () => fetch('/api/auth/config').then((r) => r.json()).then((d) => setList(d.providers));
  useEffect(() => { load(); setOrigin(window.location.origin); }, []);

  async function save(provider: Provider) {
    setMsg('');
    const res = await fetch('/api/auth/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, ...form }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setForm({ clientId: '', clientSecret: '' });
    setOpen(null);
    setMsg(`${META[provider].name} 로그인이 활성화되었습니다.`);
    load();
  }

  return (
    <section className="panel space-y-4">
      <div>
        <h2 className="text-sm font-bold">소셜 로그인 연동</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          무료 체험 1건을 넘기면 로그인이 필요합니다. 아래 세 제공자 중 쓰실 것만 설정하면 됩니다.
        </p>
      </div>

      {list.map((p) => {
        const m = META[p.provider];
        return (
          <div key={p.provider} className="rounded-xl border border-[var(--line)] p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${p.configured ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
              <span className="text-sm font-bold">{m.name}</span>
              <span className="text-xs text-[var(--muted)]">{p.configured ? '설정됨' : '미설정'}</span>
              <button
                className="btn-ghost ml-auto !px-3 !py-1 !text-xs"
                onClick={() => setOpen(open === p.provider ? null : p.provider)}
              >
                {open === p.provider ? '닫기' : p.configured ? '다시 설정' : '설정하기'}
              </button>
            </div>

            {open === p.provider && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-[var(--muted)]">{m.note}</p>

                <div>
                  <span className="label">Redirect URI (그대로 복사해 등록)</span>
                  <code className="block break-all rounded-lg bg-neutral-100 px-3 py-2 text-xs">
                    {origin}/api/auth/{p.provider}/callback
                  </code>
                </div>

                <div>
                  <label className="label">Client ID</label>
                  <input
                    className="field font-mono" autoComplete="off"
                    value={form.clientId}
                    onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Client Secret</label>
                  <input
                    type="password" className="field font-mono" autoComplete="off"
                    value={form.clientSecret}
                    onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn-primary" onClick={() => save(p.provider)}
                    disabled={!form.clientId.trim() || !form.clientSecret.trim()}>
                    저장
                  </button>
                  <a className="text-xs font-semibold text-[var(--accent)] underline"
                    href={m.console} target="_blank" rel="noreferrer">
                    {m.name} 개발자 콘솔 열기 →
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {msg && <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm">{msg}</p>}
    </section>
  );
}
