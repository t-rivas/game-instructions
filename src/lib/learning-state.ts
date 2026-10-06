"use client";
import { useEffect, useState, type SetStateAction } from "react";

// Session learning choices are independent of game snapshots and temporary shares.
export function useLearningState<T extends object>(game: string, concept: string, initial: T, temporary = false, validate?: (value: T) => boolean) {
  const key = `tablefolk-${temporary ? "shared-" : ""}practice-${game}-${concept}-v1`;
  const [value, setValue] = useState(initial);
  useEffect(() => {
    let restored = initial;
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        const valid = Object.entries(initial as object).every(([name, fallback]) => {
          const item = stored[name];
          return typeof fallback === "number" ? typeof item === "number" && Number.isFinite(item)
            : typeof fallback === "object" ? item && typeof item === "object" && !Array.isArray(item)
            : typeof item === typeof fallback;
        });
        if (valid && (!validate || validate(stored))) restored = stored;
      }
    } catch {}
    setValue(restored);
    // Initial values are defaults; recovery is keyed only by the stable identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  function update(next: SetStateAction<T>) {
    setValue(old => {
      const updated = typeof next === "function" ? (next as (value: T) => T)(old) : next;
      try { sessionStorage.setItem(key, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }
  return [value, update] as const;
}
