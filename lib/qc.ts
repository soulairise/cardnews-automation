/** PRD v0.3 F6 — 자동 품질검사. 사람 눈이 아니라 코드가 보조지표 2·3을 판정한다. */
import { Card } from './types';

export type Issue = { cardId: string; level: 'error' | 'warn'; message: string };

const LIMITS = { coverTitle: 20, bodyTitle: 24, body: 80 };

function srgb(c: number) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

export function contrastRatio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function checkDeck(cards: Card[], textColor: string, bgColor: string): Issue[] {
  const issues: Issue[] = [];

  const ratio = contrastRatio(textColor, bgColor);
  if (ratio < 4.5) {
    issues.push({
      cardId: cards[0]?.id ?? '-',
      level: ratio < 3 ? 'error' : 'warn',
      message: `본문 텍스트 대비 ${ratio.toFixed(1)}:1 — WCAG AA 기준 4.5:1 미달. 브랜드 컬러 조합을 조정하세요.`,
    });
  }

  for (const card of cards) {
    const titleMax = card.role === 'cover' ? LIMITS.coverTitle : LIMITS.bodyTitle;
    if (card.title.length > titleMax) {
      issues.push({ cardId: card.id, level: 'error', message: `제목 ${card.title.length}자 — ${titleMax}자 초과. 잘릴 수 있습니다.` });
    }
    if (card.body.length > LIMITS.body) {
      issues.push({ cardId: card.id, level: 'error', message: `본문 ${card.body.length}자 — ${LIMITS.body}자 초과. 세이프 영역을 침범합니다.` });
    }
    if (card.role !== 'cta' && !card.title.trim()) {
      issues.push({ cardId: card.id, level: 'error', message: '제목이 비어 있습니다.' });
    }
  }
  return issues;
}

export { LIMITS };
