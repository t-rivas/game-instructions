import "server-only";
import images from "@/generated/images.json";
import { createToolRuntime } from "@/generated/tool-runtime";
import type { Language, ToolKind, ToolRuntime, View } from "./types";
export function renderTools(
  lang: Language,
  game: string,
  view: View,
): Partial<Record<ToolKind, string>> {
  // A fresh runtime with no browser storage makes SSR deterministic.
  const runtime = createToolRuntime({ images }) as unknown as ToolRuntime;
  runtime.setRoute(lang, game, view);
  return {
    sources: runtime.view("sources"),
    ...(view === "play"
      ? { play: runtime.view("play") }
      : {
          helper: runtime.view("helper"),
          ...(view === "learn" && game === "avalon"
            ? {
                "setup-roles": runtime.view("setup-roles"),
                "setup-components": runtime.view("setup-components"),
                "setup-script": runtime.view("setup-script"),
              }
            : {}),
        }),
  };
}
