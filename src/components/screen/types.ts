export type ScreenPrize = { id: string; name: string; meta: string | null; winnerCount: number };

export type ScreenWinner = {
  prizeId: string;
  prizeName: string;
  prizeIndex: number;
  prizeTotal: number;
  winnerName: string;
  winnerDetail: string | null;
  entryNumber: number;
  pool: string[];
  drawnAt: string;
};

export type ScreenConfig = {
  eventId: string;
  slug: string;
  eventName: string;
  organisationName: string;
  logoUrl: string | null;
  accentColour: string;
  backgroundColour: string;
  animation: "NAME_REEL" | "WHEEL" | "COUNTDOWN" | "CARDS";
  suspenseSeconds: number;
  showLogo: boolean;
  showEntryCount: boolean;
  confettiOnWin: boolean;
  drawAt: string | null;
  entryCount: number;
  prizeCount: number;
  /** Set when an organiser opened the screen, which unlocks Space/R/Esc. */
  canControl: boolean;
};
