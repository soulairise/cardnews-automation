/** 로그인이 없는 정적 버전 — 모든 데이터가 이 브라우저에만 남는다. */
export const FREE_PLAN = {
  label: '체험판',
  maxCharacterSheets: 1,
  maxDecks: 3,
  cardsPerDeck: 5,
  canPublish: false,
  watermark: true,
} as const;

export function planStatus(sheetsUsed: number, deckCount: number) {
  return {
    label: FREE_PLAN.label,
    sheets: {
      used: sheetsUsed,
      max: FREE_PLAN.maxCharacterSheets,
      left: Math.max(0, FREE_PLAN.maxCharacterSheets - sheetsUsed),
    },
    decks: {
      used: deckCount,
      max: FREE_PLAN.maxDecks,
      left: Math.max(0, FREE_PLAN.maxDecks - deckCount),
    },
  };
}
