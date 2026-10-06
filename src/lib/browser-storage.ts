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
// Reads can succeed while writes fail in private mode or at the storage quota.
// A temporary unique key checks this without touching game snapshots or settings.
export function canWriteStored(): boolean {
  try {
    const probe = `tablefolk-storage-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
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

export const activityKey = "tablefolk-game-activity-v1";
export function gameActivity(): Record<string, number> {
  const stored = readStored<unknown>(activityKey, {});
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  return Object.fromEntries(
    Object.entries(stored).filter(
      ([id, value]) =>
        ["chess", "poker", "coup", "truco", "moth", "skull_king"].includes(
          id,
        ) &&
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0,
    ),
  );
}
export function markGameActivity(id: string) {
  if (!["chess", "poker", "coup", "truco", "moth", "skull_king"].includes(id))
    return;
  const activity = gameActivity();
  // Monotonic even if two actions share a millisecond or the wall clock moves back.
  const next = Math.max(
    Date.now(),
    ...Object.values(activity).map((value) => value + 1),
  );
  writeStored(activityKey, { ...activity, [id]: next });
}
// Locale changes and reloads of the same guide are not new player activity.
export function recordGameVisit(route: string) {
  try {
    if (sessionStorage.getItem("tablefolk-activity-route") === route) return;
    sessionStorage.setItem("tablefolk-activity-route", route);
    if (route.endsWith("/play")) markGameActivity(route.split("/")[0]);
  } catch {}
}
