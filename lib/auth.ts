import { Provider, User } from './types';

type ProviderSpec = {
  label: string;
  authUrl: string;
  tokenUrl: string;
  profileUrl: string;
  scope: string;
  /** 제공자마다 프로필 응답 모양이 달라 여기서 통일한다 */
  parse: (raw: Record<string, unknown>) => { id: string; name: string; email?: string; picture?: string };
  brand: { bg: string; fg: string; border?: string };
};

export const PROVIDERS: Record<Provider, ProviderSpec> = {
  google: {
    label: 'Google로 계속하기',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
    parse: (r) => ({
      id: String(r.id ?? r.sub ?? ''),
      name: String(r.name ?? '사용자'),
      email: r.email ? String(r.email) : undefined,
      picture: r.picture ? String(r.picture) : undefined,
    }),
    brand: { bg: '#ffffff', fg: '#1f2328', border: '#dadce0' },
  },
  naver: {
    label: '네이버로 계속하기',
    authUrl: 'https://nid.naver.com/oauth2.0/authorize',
    tokenUrl: 'https://nid.naver.com/oauth2.0/token',
    profileUrl: 'https://openapi.naver.com/v1/nid/me',
    scope: '',
    parse: (r) => {
      const p = (r.response ?? {}) as Record<string, unknown>;
      return {
        id: String(p.id ?? ''),
        name: String(p.nickname ?? p.name ?? '사용자'),
        email: p.email ? String(p.email) : undefined,
        picture: p.profile_image ? String(p.profile_image) : undefined,
      };
    },
    brand: { bg: '#03C75A', fg: '#ffffff' },
  },
  kakao: {
    label: '카카오로 계속하기',
    authUrl: 'https://kauth.kakao.com/oauth/authorize',
    tokenUrl: 'https://kauth.kakao.com/oauth/token',
    profileUrl: 'https://kapi.kakao.com/v2/user/me',
    scope: 'profile_nickname',
    parse: (r) => {
      const acc = (r.kakao_account ?? {}) as Record<string, unknown>;
      const prof = (acc.profile ?? {}) as Record<string, unknown>;
      return {
        id: String(r.id ?? ''),
        name: String(prof.nickname ?? '사용자'),
        email: acc.email ? String(acc.email) : undefined,
        picture: prof.profile_image_url ? String(prof.profile_image_url) : undefined,
      };
    },
    brand: { bg: '#FEE500', fg: '#191600' },
  },
};

export function isProvider(v: string): v is Provider {
  return v === 'google' || v === 'naver' || v === 'kakao';
}

export function redirectUri(origin: string, provider: Provider) {
  return `${origin}/api/auth/${provider}/callback`;
}

export function buildAuthUrl(provider: Provider, clientId: string, origin: string, state: string) {
  const spec = PROVIDERS[provider];
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(origin, provider),
    response_type: 'code',
    state,
  });
  if (spec.scope) p.set('scope', spec.scope);
  return `${spec.authUrl}?${p.toString()}`;
}

export async function exchangeAndFetchUser(
  provider: Provider,
  code: string,
  clientId: string,
  clientSecret: string,
  origin: string,
  oauthState: string,
): Promise<User> {
  const spec = PROVIDERS[provider];

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri(origin, provider),
    code,
    state: oauthState, // 네이버는 토큰 교환에도 state 를 요구한다
  });

  const tokenRes = await fetch(spec.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const token = (await tokenRes.json()) as Record<string, unknown>;
  const accessToken = token.access_token as string | undefined;
  if (!accessToken) {
    throw new Error(`토큰 교환 실패: ${JSON.stringify(token).slice(0, 200)}`);
  }

  const profRes = await fetch(spec.profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const raw = (await profRes.json()) as Record<string, unknown>;
  const parsed = spec.parse(raw);
  if (!parsed.id) throw new Error('프로필 조회 실패');

  return {
    key: `${provider}:${parsed.id}`,
    provider,
    name: parsed.name,
    email: parsed.email,
    picture: parsed.picture,
    joinedAt: new Date().toISOString(),
  };
}
