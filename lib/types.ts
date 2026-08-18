export type Brand = {
  name: string;
  colors: { primary: string; secondary: string; bg: string; text: string };
  tone: string;
  audience: string;
  logoDataUrl?: string;
  createdAt: string;
};

export type CharacterCandidate = { id: string; description: string; imageUrl: string };

export type Character = {
  id: string;
  description: string;
  mainImageUrl: string;
  sheet: { label: string; imageUrl: string }[];
  lockedAt: string;
};

export type CardRole = 'cover' | 'body' | 'cta';

export type Card = {
  id: string;
  role: CardRole;
  title: string;
  body: string;
  backgroundUrl: string | null;
};

export type Deck = { id: string; topic: string; cards: Card[]; createdAt: string };

export type Workspace = {
  brand?: Brand;
  character?: Character;
  candidates?: CharacterCandidate[];
  characterSheetsUsed: number;
  decks: Deck[];
};

export const EMPTY_WORKSPACE: Workspace = { characterSheetsUsed: 0, decks: [] };
