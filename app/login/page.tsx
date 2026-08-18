'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProviderButton from '@/components/ProviderButton';
import { Provider } from '@/lib/types';

const ERRORS: Record<string, string> = {
  not_configured: '이 제공자는 아직 설정되지 않았습니다. 설정 화면에서 Client ID / Secret 을 등록하세요.',
  state_mismatch: '보안 검증에 실패했습니다. 다시 시도해 주세요.',
  no_code: '인증이 취소되었습니다.',
  exchange_failed: '토큰 교환에 실패했습니다. Client Secret 과 Redirect URI 를 확인하세요.',
  unknown_provider: '알 수 없는 로그인 제공자입니다.',
};

function LoginInner() {
  const sp = useSearchParams();
  const [providers, setProviders] = useState<{ provider: Provider; configured: boolean }[]>([]);
  const err = sp.get('error');
  const detail = sp.get('detail');

  useEffect(() => {
    fetch('/api/auth/config').then((r) => r.json()).then((d) => setProviders(d.providers));
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">로그인</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          무료 체험 1건을 다 쓰셨습니다. 로그인하면 카드뉴스를 계속 만들 수 있고,
          만들던 브랜드와 캐릭터는 그대로 계정으로 옮겨집니다.
        </p>
      </header>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORS[err] ?? '로그인 중 오류가 발생했습니다.'}
          {detail && <p className="mt-1 break-all text-xs opacity-80">{detail}</p>}
        </div>
      )}

      <section className="panel space-y-3">
        {providers.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">불러오는 중…</p>
        ) : (
          providers.map((p) => <ProviderButton key={p.provider} provider={p.provider} configured={p.configured} />)
        )}
      </section>

      <p className="text-center text-xs text-[var(--muted)]">
        이 서비스 전용 계정으로 관리되며, 다른 앱의 회원 정보와 공유되지 않습니다.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">불러오는 중…</p>}>
      <LoginInner />
    </Suspense>
  );
}
