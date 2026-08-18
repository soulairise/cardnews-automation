import type { NextConfig } from 'next';

/**
 * 완전 정적 사이트로 내보낸다.
 * 서버가 없으므로 브랜드·캐릭터·카드뉴스는 브라우저에 저장되고,
 * Gemini 호출도 각자 브라우저에서 자기 키로 직접 나간다.
 */
const repo = 'cardnews-automation';
const isPages = process.env.DEPLOY_TARGET === 'pages';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isPages ? `/${repo}` : '',
  assetPrefix: isPages ? `/${repo}/` : '',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
