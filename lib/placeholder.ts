/**
 * API 키가 없을 때 쓰는 대체 비주얼.
 * 전체 플로우(등록 → 캐릭터 → 생성 → 편집 → 다운로드)를 키 없이 끝까지 돌려보기 위한 것으로,
 * 키가 들어오면 lib/gemini.ts 의 실제 생성으로 자동 전환된다.
 */

function svgUrl(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;
}

export function placeholderCharacter(opts: {
  primary: string;
  secondary: string;
  seed: number;
  label?: string;
}) {
  const { primary, secondary, seed, label } = opts;
  const skin = ['#F5D5C0', '#E8C4A8', '#D9A97F'][seed % 3];
  const hair = [primary, secondary, '#2E2A28'][seed % 3];
  const tilt = [-6, 0, 6][seed % 3];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${primary}" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="${secondary}" stop-opacity="0.35"/>
  </linearGradient></defs>
  <rect width="640" height="640" fill="url(#bg)"/>
  <g transform="translate(320 360) rotate(${tilt})">
    <ellipse cx="0" cy="150" rx="150" ry="120" fill="${primary}"/>
    <circle cx="0" cy="-40" r="115" fill="${skin}"/>
    <path d="M-118 -60 A118 118 0 0 1 118 -60 L118 -95 A118 118 0 0 0 -118 -95 Z" fill="${hair}"/>
    <circle cx="-42" cy="-45" r="11" fill="#2E2A28"/>
    <circle cx="42" cy="-45" r="11" fill="#2E2A28"/>
    <path d="M-34 10 Q0 42 34 10" stroke="#2E2A28" stroke-width="8" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
  return svgUrl(svg);
}

export function placeholderBackground(opts: { primary: string; secondary: string; seed: number }) {
  const { primary, secondary, seed } = opts;
  const angle = [0, 35, 90, 135][seed % 4];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#g)"/>
  <circle cx="${180 + seed * 90}" cy="${240 + seed * 60}" r="300" fill="#ffffff" opacity="0.10"/>
  <circle cx="${900 - seed * 70}" cy="${1120 - seed * 50}" r="220" fill="#000000" opacity="0.08"/>
</svg>`;
  return svgUrl(svg);
}
