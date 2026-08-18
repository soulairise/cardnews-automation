'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { User } from '@/lib/types';

const LINKS = [
  { href: '/', label: '홈' },
  { href: '/brand', label: '① 브랜드' },
  { href: '/character', label: '② 캐릭터' },
  { href: '/create', label: '③ 카드뉴스' },
  { href: '/settings', label: '설정' },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<string>('');

  useEffect(() => {
    fetch('/api/state')
      .then((r) => r.json())
      .then((s) => { setUser(s.user); setPlan(s.plan?.label ?? ''); });
  }, [path]);

  async function logout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setUser(null);
    router.refresh();
    router.push('/');
  }

  return (
    <header className="border-b border-[var(--line)] bg-white/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-1 px-6 py-3">
        <Link href="/" className="mr-4 shrink-0">
          <Logo />
        </Link>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              path === l.href ? 'bg-[var(--accent)] text-white font-semibold' : 'text-[var(--muted)] hover:bg-neutral-100'
            }`}
          >
            {l.label}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {plan && (
            <span className="hidden rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-[var(--muted)] sm:inline">
              {plan}
            </span>
          )}
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                {user.picture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.picture} alt="" className="h-6 w-6 rounded-full object-cover" />
                )}
                {user.name}
              </span>
              <button onClick={logout} className="rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-neutral-100">
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary !px-3 !py-1.5 !text-xs">
              로그인
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
