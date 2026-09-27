import fs from 'node:fs';
import path from 'node:path';

let html = fs.readFileSync('index.html', 'utf8');

for (const name of ['styles.css', 'enhancements.css', 'official.css', 'table-guide.css', 'game-themes.css']) {
  html = html.replace(
    `<link rel="stylesheet" href="${name}">`,
    `<style>\n${fs.readFileSync(name, 'utf8')}\n</style>`
  );
}

const scriptNames = ['data.js', 'dixit.js', 'new-games.js', 'enhancements.js', 'official.js', 'table-guide.js', 'app.js'];
for (const name of scriptNames) {
  html = html.replace(`  <script src="${name}" defer></script>\n`, '');
}

let scripts = scriptNames.map(name => fs.readFileSync(name, 'utf8')).join('\n');
const mime = {'.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'};

for (const folder of ['assets', 'assets/official', 'assets/real', 'assets/ai']) {
  for (const file of fs.readdirSync(folder)) {
    const fullPath = path.join(folder, file);
    const extension = path.extname(file).toLowerCase();
    if (!mime[extension] || !fs.statSync(fullPath).isFile()) continue;
    const relativePath = fullPath.split(path.sep).join('/');
    const uri = `data:${mime[extension]};base64,${fs.readFileSync(fullPath).toString('base64')}`;
    scripts = scripts.split(relativePath).join(uri);
  }
}

html = html.replace('</body>', `<script>\n${scripts.replaceAll('</script', '<\\/script')}\n</script>\n</body>`);
fs.writeFileSync('game-night.html', html);
console.log(`Built game-night.html (${fs.statSync('game-night.html').size} bytes)`);
