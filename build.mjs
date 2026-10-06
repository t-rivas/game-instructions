import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
let html = read('index.html');

for (const name of ['moth-score.css', 'truco-score.css', 'skull-score.css', 'styles.css', 'enhancements.css', 'official.css', 'table-guide.css', 'game-themes.css', 'chess-clock.css', 'poker-timer.css', 'coup-session.css', 'src/components/lesson-comparison.css']) {
  html = html.replace(
    `<link rel="stylesheet" href="${name}">`,
    () => `<style>\n${read(name)}\n</style>`
  );
}

const scriptNames = ['data.js', 'dixit.js', 'new-games.js', 'more-games.js', 'setup-diagrams.js', 'setup-context.js', 'glossary.js', 'practice.js', 'enhancements.js', 'official.js', 'card-guides.js', 'skull-tricks.js', 'scoring-examples.js', 'avalon-lessons.js', 'coup-lessons.js', 'lesson-comparisons.js', 'table-guide.js', 'chess-clock.js', 'poker-timer.js', 'coup-session.js', 'skull-score.js', 'truco-score.js', 'moth-score.js', 'app.js'];
for (const name of scriptNames) {
  html = html.replace(`  <script src="${name}" defer></script>\n`, '');
}

let scripts = scriptNames.map(read).join('\n');
const mime = {'.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'};

for (const folder of ['assets', 'assets/official', 'assets/real', 'assets/ai']) {
  for (const file of fs.readdirSync(path.join(root, folder))) {
    const fullPath = path.join(root, folder, file);
    const extension = path.extname(file).toLowerCase();
    if (!mime[extension] || !fs.statSync(fullPath).isFile()) continue;
    const relativePath = path.posix.join(folder, file);
    const uri = `data:${mime[extension]};base64,${fs.readFileSync(fullPath).toString('base64')}`;
    scripts = scripts.split(relativePath).join(uri);
  }
}

// A replacement callback preserves JavaScript's $$, $& and other dollar sequences.
html = html.replace('</body>', () => `<script>\n${scripts.replaceAll('</script', '<\\/script')}\n</script>\n</body>`);
fs.writeFileSync(path.join(root, 'game-night.html'), html);
console.log(`Built game-night.html (${Buffer.byteLength(html)} bytes)`);
