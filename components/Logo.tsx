export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
        <defs>
          <linearGradient id="ghostFill" x1="8" y1="4" x2="32" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4B7BFF" />
            <stop offset="1" stopColor="#7B5CFF" />
          </linearGradient>
        </defs>
        {/* 유령 실루엣 — 아래쪽 물결 3개 */}
        <path
          d="M20 3c-8.3 0-14 5.9-14 14.2V35c0 1.4 1.7 2.1 2.7 1.1l2.6-2.6c.6-.6 1.5-.6 2.1 0l2.1 2.1c.6.6 1.5.6 2.1 0l2.3-2.3c.6-.6 1.5-.6 2.1 0l2.3 2.3c.6.6 1.5.6 2.1 0l2.1-2.1c.6-.6 1.5-.6 2.1 0l2.6 2.6c1 1 2.7.3 2.7-1.1V17.2C34 8.9 28.3 3 20 3Z"
          fill="url(#ghostFill)"
        />
        <circle cx="14.6" cy="17" r="3.1" fill="#fff" />
        <circle cx="25.4" cy="17" r="3.1" fill="#fff" />
        <circle cx="15.4" cy="17.6" r="1.4" fill="#1B2440" />
        <circle cx="26.2" cy="17.6" r="1.4" fill="#1B2440" />
      </svg>
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight">브랜드 카드뉴스 자동화</span>
        <span className="block text-[10px] font-semibold text-[var(--muted)]">by 고스트루이스</span>
      </span>
    </span>
  );
}
