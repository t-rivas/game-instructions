export function readStored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export const recentGamesKey = "tablefolk-recent-games";
export const savedGamesEvent = "tablefolk-saved-games";
export const gameStorageKeys = [
  "tablefolk-chess-clock",
  "tablefolk-poker-tournament-v1",
  "tablefolk-coup-session",
  "tablefolk-moth-score-v1",
  "tablefolk-skull-score-v1",
  "tablefolk-truco-score-v1",
];
