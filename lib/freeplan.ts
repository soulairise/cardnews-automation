import { isGuestKey } from './store';

/**
 * PRD v0.3 10장 기준 + 로그인 게이트.
 * 비로그인은 맛보기 1건까지, 로그인하면 Free 플랜 한도로 열린다.
 */
export const GUEST_PLAN = {
  label: '무료 체험 (비로그인)',
  maxCharacterSheets: 1,
  maxDecks: 1,
  cardsPerDeck: 5,
  canPublish: false,
  watermark: true,
} as const;

export const FREE_PLAN = {
  label: 'Free (로그인)',
  maxCharacterSheets: 1,
  maxDecks: 3,
  cardsPerDeck: 5,
  canPublish: false,
  watermark: true,
} as const;

export function planFor(workspaceKey: string) {
  return isGuestKey(workspaceKey) ? GUEST_PLAN : FREE_PLAN;
}

export function planStatus(workspaceKey: string, sheetsUsed: number, deckCount: number) {
  const plan = planFor(workspaceKey);
  return {
    label: plan.label,
    isGuest: isGuestKey(workspaceKey),
    sheets: { used: sheetsUsed, max: plan.maxCharacterSheets, left: Math.max(0, plan.maxCharacterSheets - sheetsUsed) },
    decks: { used: deckCount, max: plan.maxDecks, left: Math.max(0, plan.maxDecks - deckCount) },
  };
}
