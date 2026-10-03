import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";
const manifest = JSON.parse(fs.readFileSync("src/generated/images.json"));
let checks = 0;
for (const [source, art] of Object.entries(manifest)) {
  const original = await sharp("public" + source).metadata();
  const stats = await sharp("public" + source).stats();
  const transparent = original.hasAlpha && stats.channels.at(-1).min < 255;
  for (const variant of art.variants) {
    const generated = await sharp("public" + variant.src).metadata();
    assert.equal(generated.format, "webp", source);
    assert.equal(generated.width, variant.width, source);
    assert.ok(generated.width <= original.width, `No enlargement: ${source}`);
    assert.ok(
      Math.abs(
        generated.height - (original.height * generated.width) / original.width,
      ) <= 1,
      `Aspect ratio: ${source}`,
    );
    if (transparent) assert.ok(generated.hasAlpha, `Transparency: ${source}`);
    checks++;
  }
}
console.log(
  `Verified ${checks} WebP variants: dimensions, aspect ratios and transparency.`,
);
