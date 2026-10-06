import images from "@/generated/images.json";
import { toolLoaders } from "@/generated/tool-loaders";
import type { ToolRuntime } from "./types";
import {
  canWriteStored,
  gameStorageKeys,
  savedGamesEvent,
} from "./browser-storage";
// Cache each instance, including its timers and unconfirmed entries, across routes.
const pending = new Map<string, Promise<ToolRuntime>>();
let activeGame: string | undefined;
export function loadTools(id: string): Promise<ToolRuntime> {
  if (!Object.hasOwn(toolLoaders, id))
    return Promise.reject(new Error("Unknown game"));
  const existing = pending.get(id);
  if (existing) return existing;
  const promise = toolLoaders[id as keyof typeof toolLoaders]()
    .then(({ createToolRuntime, runtimeId }) => {
      if (runtimeId !== `tablefolk-runtime:${id}`)
        throw new Error("Incorrect game runtime");
      let storage: Storage | undefined;
      try {
        storage = window.localStorage;
      } catch {}
      const storageStatus = { available: !!storage && canWriteStored() };
      // Only the current guide handles global input. Background clocks retain
      // visibility and interval callbacks, without owning another guide's controls.
      const gameDocument = new Proxy(document, {
        get(target, property) {
          if (property === "addEventListener")
            return (
              type: string,
              listener: EventListener,
              options?: AddEventListenerOptions | boolean,
            ) => {
              target.addEventListener(
                type,
                (event) => {
                  if (!["click", "keydown"].includes(type) || activeGame === id)
                    listener(event);
                },
                options,
              );
            };
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
      const runtime = createToolRuntime({
        document: gameDocument,
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
      const route = runtime.setRoute.bind(runtime);
      runtime.setRoute = (...args) => {
        activeGame = id;
        route(...args);
      };
      return runtime;
    })
    .catch((error) => {
      pending.delete(id);
      throw error;
    });
  pending.set(id, promise);
  return promise;
}
export async function loadSavedTools(): Promise<ToolRuntime[]> {
  const ids = ["chess", "poker", "coup", "moth", "skull_king", "truco"];
  return Promise.all(
    ids
      .filter((_, index) => {
        try {
          return !!localStorage.getItem(gameStorageKeys[index]);
        } catch {
          return false;
        }
      })
      .map(loadTools),
  );
}
