'use client';
import { Provider } from '@/lib/types';

const STYLE: Record<Provider, { label: string; bg: string; fg: string; border?: string; icon: React.ReactNode }> = {
  google: {
    label: 'Google로 계속하기',
    bg: '#ffffff',
    fg: '#1f2328',
    border: '#dadce0',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
        <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
      </svg>
    ),
  },
  naver: {
    label: '네이버로 계속하기',
    bg: '#03C75A',
    fg: '#ffffff',
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden>
        <path fill="currentColor" d="M11.6 10.7 8.2 5.5H5v9h3.4V9.3l3.4 5.2H15v-9h-3.4v5.2Z" />
      </svg>
    ),
  },
  kakao: {
    label: '카카오로 계속하기',
    bg: '#FEE500',
    fg: '#191600',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path fill="currentColor" d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.4c0 2.1 1.4 3.94 3.5 4.98l-.85 3.13c-.08.28.23.5.47.34l3.74-2.47c.21.02.42.03.64.03 4.14 0 7.5-2.64 7.5-5.9S13.14 1.5 9 1.5Z" />
      </svg>
    ),
  },
};

export default function ProviderButton({ provider, configured }: { provider: Provider; configured: boolean }) {
  const s = STYLE[provider];
  if (!configured) {
    return (
      <div
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--muted)]"
        title="설정 화면에서 Client ID / Secret 을 등록하면 활성화됩니다"
      >
        <span style={{ opacity: 0.5 }}>{s.icon}</span>
        {s.label} <span className="text-xs font-normal">(설정 필요)</span>
      </div>
    );
  }
  return (
    <a
      href={`/api/auth/${provider}`}
      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition hover:brightness-95"
      style={{ background: s.bg, color: s.fg, border: s.border ? `1px solid ${s.border}` : 'none' }}
    >
      {s.icon}
      {s.label}
    </a>
  );
}
