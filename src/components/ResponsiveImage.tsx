import type { ImgHTMLAttributes } from "react";
import manifest from "@/generated/images.json";
type Entry = {
  width: number;
  height: number;
  variants: { src: string; width: number }[];
};
export const emptyImage =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
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
  desktopOnly = false,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  desktopOnly?: boolean;
}) {
  const attributes = imageAttributes(src, sizes);
  if (desktopOnly)
    return (
      <picture>
        <source
          media="(min-width: 681px)"
          srcSet={attributes.srcSet || src}
          sizes={sizes}
        />
        <img
          {...props}
          width={attributes.width || props.width}
          height={attributes.height || props.height}
          src={emptyImage}
        />
      </picture>
    );
  return <img {...props} {...attributes} />;
}
