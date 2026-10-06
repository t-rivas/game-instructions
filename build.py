"""Build a self-contained, offline HTML file with no external dependencies."""
from pathlib import Path
import base64
root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + (root / 'styles.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="enhancements.css">', '<style>\n' + (root / 'enhancements.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="official.css">', '<style>\n' + (root / 'official.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="table-guide.css">', '<style>\n' + (root / 'table-guide.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="game-themes.css">', '<style>\n' + (root / 'game-themes.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="chess-clock.css">', '<style>\n' + (root / 'chess-clock.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="coup-session.css">', '<style>\n' + (root / 'coup-session.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="poker-timer.css">', '<style>\n' + (root / 'poker-timer.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="skull-score.css">', '<style>\n' + (root / 'skull-score.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="truco-score.css">', '<style>\n' + (root / 'truco-score.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="moth-score.css">', '<style>\n' + (root / 'moth-score.css').read_text(encoding='utf-8') + '\n</style>')
html = html.replace('<link rel="stylesheet" href="src/components/lesson-comparison.css">', '<style>\n' + (root / 'src/components/lesson-comparison.css').read_text(encoding='utf-8') + '\n</style>')
for name in ('data.js', 'dixit.js', 'new-games.js', 'more-games.js', 'setup-diagrams.js', 'setup-context.js', 'glossary.js', 'practice.js', 'enhancements.js', 'official.js', 'card-guides.js', 'skull-tricks.js', 'scoring-examples.js', 'avalon-lessons.js', 'coup-lessons.js', 'lesson-comparisons.js', 'table-guide.js', 'chess-clock.js', 'poker-timer.js', 'coup-session.js', 'skull-score.js', 'truco-score.js', 'moth-score.js', 'app.js'):
    html = html.replace(f'  <script src="{name}" defer></script>\n', '')
scripts = '\n'.join((root / name).read_text(encoding='utf-8') for name in ('data.js', 'dixit.js', 'new-games.js', 'more-games.js', 'setup-diagrams.js', 'setup-context.js', 'glossary.js', 'practice.js', 'enhancements.js', 'official.js', 'card-guides.js', 'skull-tricks.js', 'scoring-examples.js', 'avalon-lessons.js', 'coup-lessons.js', 'lesson-comparisons.js', 'table-guide.js', 'chess-clock.js', 'poker-timer.js', 'coup-session.js', 'skull-score.js', 'truco-score.js', 'moth-score.js', 'app.js'))
mime = {'.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'}
for image in [p for folder in ('assets', 'assets/official', 'assets/real', 'assets/ai') for p in (root / folder).iterdir() if p.is_file() and p.suffix.lower() in mime]:
    uri = f'data:{mime[image.suffix.lower()]};base64,' + base64.b64encode(image.read_bytes()).decode('ascii')
    scripts = scripts.replace(image.relative_to(root).as_posix(), uri)
html = html.replace('</body>', '<script>\n' + scripts.replace('</script', '<\\/script') + '\n</script>\n</body>')
(root / 'game-night.html').write_text(html, encoding='utf-8')
print('Built game-night.html - open directly in your browser.')
