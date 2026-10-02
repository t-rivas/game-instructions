import { Collection } from "@/components/Collection";
import { collection, icons, isLanguage } from "@/lib/games";
import { notFound } from "next/navigation";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();
  return {
    title: {
      absolute:
        lang === "en"
          ? "Tablefolk · Your game night companion"
          : "Tablefolk · Tu compañero de juegos",
    },
    description:
      lang === "en"
        ? "Clear rules for your favorite games. Learn before you start and find answers while you play."
        : "Las reglas, sin complicaciones. Guías sencillas para tus juegos favoritos, siempre a mano.",
  };
}
export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();
  return <Collection lang={lang} cards={collection()} icons={icons} />;
}
