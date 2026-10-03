import images from "@/generated/images.json";
import type { ToolRuntime } from "./types";
import { savedGamesEvent } from "./browser-storage";
let pending: Promise<ToolRuntime> | undefined;
export function loadTools(): Promise<ToolRuntime> {
  // One instance keeps clocks and unfinished rounds alive across Next routes.
  return (pending ??= import("@/generated/tool-runtime")
    .then(({ createToolRuntime }) => {
      let storage: Storage | undefined;
      try {
        storage = window.localStorage;
      } catch {}
      const storageStatus = { available: !!storage };
      return createToolRuntime({
        document,
        images,
        window,
        storageStatus,
        localStorage: {
          getItem(key: string) {
            try {
              if (!storage) throw new Error("Storage unavailable");
              return storage.getItem(key);
            } catch (error) {
              storageStatus.available = false;
              throw error;
            }
          },
          setItem(key: string, value: string) {
            try {
              if (!storage) throw new Error("Storage unavailable");
              storage.setItem(key, value);
              storageStatus.available = true;
              window.dispatchEvent(new Event(savedGamesEvent));
            } catch (error) {
              storageStatus.available = false;
              window.dispatchEvent(new Event(savedGamesEvent));
              throw error;
            }
          },
        },
        setInterval: window.setInterval.bind(window),
        clearInterval: window.clearInterval.bind(window),
      }) as unknown as ToolRuntime;
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    }));
}
