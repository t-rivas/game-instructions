import { notFound } from "next/navigation";
import { DocumentLayout } from "@/components/DocumentLayout";
import { isLanguage, languages } from "@/lib/games";
export { metadata, viewport } from "@/components/DocumentLayout";
export const dynamicParams = false;
export function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();
  return <DocumentLayout lang={lang}>{children}</DocumentLayout>;
}
