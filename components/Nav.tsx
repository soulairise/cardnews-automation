'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { FREE_PLAN } from '@/lib/freeplan';

const LINKS = [
  { href: '/', label: '홈' },
  { href: '/brand', label: '① 브랜드' },
  { href: '/character', label: '② 캐릭터' },
  { href: '/create', label: '③ 카드뉴스' },
  { href: '/settings', label: '설정' },
];

export default function Nav() {
  const path = usePathname();
  const norm = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);
  const here = norm(path);

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
              here === l.href ? 'bg-[var(--accent)] text-white font-semibold' : 'text-[var(--muted)] hover:bg-neutral-100'
            }`}
          >
            {l.label}
          </Link>
        ))}
        <span className="ml-auto rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          {FREE_PLAN.label}
        </span>
      </nav>
    </header>
  );
}
