import { Collection } from "@/components/Collection";
import { LegacyLinks } from "@/components/LegacyLinks";
import { collection, gameIds, icons } from "@/lib/games";
export default function Home() {
  return (
    <>
      <LegacyLinks gameIds={gameIds} />
      <Collection lang="es" cards={collection()} icons={icons} />
    </>
  );
}
