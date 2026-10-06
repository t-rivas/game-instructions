"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function LegacyLinks({ gameIds }: { gameIds: string[] }) {
  const router = useRouter();
  useEffect(() => {
    const migrate = () => {
      const [id, tab, section] = location.hash.slice(1).split("/");
      if (!gameIds.includes(id)) return;
      let lang = "es";
      try {
        lang =
          JSON.parse(localStorage.getItem("tablefolk-preferences") || "{}")
            .lang === "en"
            ? "en"
            : "es";
      } catch {}
      const view =
        (
          { reference: "play", full: "rules", learn: "learn" } as Record<
            string,
            string
          >
        )[tab] || "learn";
      router.replace(
        `/${lang}/${id}/${view}/${location.search}${section ? "#" + section : ""}`,
      );
    };
    migrate();
    window.addEventListener("hashchange", migrate);
    return () => window.removeEventListener("hashchange", migrate);
  }, [gameIds, router]);
  return null;
}
