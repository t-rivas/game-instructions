"""Build a self-contained, offline HTML file with no external dependencies."""
from pathlib import Path
import base64
root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + (root / 'styles.css').read_text() + '\n</style>')
html = html.replace('<link rel="stylesheet" href="enhancements.css">', '<style>\n' + (root / 'enhancements.css').read_text() + '\n</style>')
html = html.replace('<link rel="stylesheet" href="official.css">', '<style>\n' + (root / 'official.css').read_text() + '\n</style>')
html = html.replace('<link rel="stylesheet" href="table-guide.css">', '<style>\n' + (root / 'table-guide.css').read_text() + '\n</style>')
html = html.replace('<link rel="stylesheet" href="game-themes.css">', '<style>\n' + (root / 'game-themes.css').read_text() + '\n</style>')
for name in ('data.js', 'dixit.js', 'enhancements.js', 'official.js', 'table-guide.js', 'app.js'):
    html = html.replace(f'  <script src="{name}" defer></script>\n', '')
scripts = '\n'.join((root / name).read_text() for name in ('data.js', 'dixit.js', 'enhancements.js', 'official.js', 'table-guide.js', 'app.js'))
mime = {'.jpg': 'image/jpeg', '.webp': 'image/webp'}
for image in [p for folder in ('assets', 'assets/official') for p in (root / folder).iterdir() if p.suffix in mime]:
    uri = f'data:{mime[image.suffix]};base64,' + base64.b64encode(image.read_bytes()).decode('ascii')
    scripts = scripts.replace(image.relative_to(root).as_posix(), uri)
html = html.replace('</body>', '<script>\n' + scripts.replace('</script', '<\\/script') + '\n</script>\n</body>')
(root / 'game-night.html').write_text(html)
print('Built game-night.html — open directly in your browser.')
