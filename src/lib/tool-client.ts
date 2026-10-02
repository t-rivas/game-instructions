import type { ToolRuntime } from "./types";
let pending: Promise<ToolRuntime> | undefined;
export function loadTools(): Promise<ToolRuntime> {
  // One instance keeps clocks and unfinished rounds alive across Next routes.
  return (pending ??= import("@/generated/tool-runtime")
    .then(({ createToolRuntime }) => {
      let storage: Storage | undefined;
      try {
        storage = window.localStorage;
      } catch {}
      return createToolRuntime({
        document,
        window,
        localStorage: storage || {
          getItem() {
            throw new Error("Storage unavailable");
          },
          setItem() {
            throw new Error("Storage unavailable");
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
