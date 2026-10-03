import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

// Build-time assets work on Vercel and a plain static file server alike.
export async function prepareImages(root, catalog) {
  const sources = new Set([
    ...Object.values(catalog.official).map((art) => art.src),
    ...Object.values(catalog.artwork).map((art) => art[0]),
    "assets/avalon.jpg",
    "assets/coup.jpg",
    "assets/poker.jpg",
  ]);
  const target = path.join(root, "public/assets/responsive");
  fs.mkdirSync(target, { recursive: true });
  const manifest = {};
  for (const src of sources) {
    const input = fs.readFileSync(path.join(root, src.replace(/^\//, "")));
    const metadata = await sharp(input).metadata();
    const hash = crypto
      .createHash("sha256")
      .update(input)
      .update("webp-85-v1")
      .digest("hex")
      .slice(0, 12);
    const stem = path.basename(src, path.extname(src));
    const widths = [
      ...new Set(
        [96, 192, 320, 480, 768, 1200].map((width) =>
          Math.min(width, metadata.width),
        ),
      ),
    ];
    const variants = [];
    for (const width of widths) {
      const name = `${stem}-${hash}-${width}.webp`;
      const file = path.join(target, name);
      if (!fs.existsSync(file))
        await sharp(input)
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 85, alphaQuality: 100, effort: 6 })
          .toFile(file);
      variants.push({ width, src: `/assets/responsive/${name}` });
    }
    manifest["/" + src.replace(/^\//, "")] = {
      width: metadata.width,
      height: metadata.height,
      variants,
    };
  }
  fs.writeFileSync(
    path.join(root, "src/generated/images.json"),
    JSON.stringify(manifest) + "\n",
  );
  return manifest;
}
