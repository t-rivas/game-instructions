import { DocumentLayout } from "@/components/DocumentLayout";
export { metadata, viewport } from "@/components/DocumentLayout";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocumentLayout lang="es">{children}</DocumentLayout>;
}
