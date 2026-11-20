import type { ImgHTMLAttributes } from "react";
import manifest from "@/generated/images.json";
type Entry = {
  width: number;
  height: number;
  variants: { src: string; width: number }[];
};
export function imageAttributes(src: string, sizes: string) {
  const art = (manifest as Record<string, Entry>)[src];
  if (!art) return { src, sizes };
  return {
    src: (art.variants.find((v) => v.width >= 320) || art.variants.at(-1))!.src,
    srcSet: art.variants.map((v) => `${v.src} ${v.width}w`).join(", "),
    sizes,
    width: art.width,
    height: art.height,
  };
}
export function ResponsiveImage({
  src,
  sizes = "(max-width: 370px) 80vw, (max-width: 680px) 40vw, (max-width: 1000px) 40vw, 280px",
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
}) {
  const attributes = imageAttributes(src, sizes);
  return <img {...props} {...attributes} />;
}
