#!/usr/bin/env python3
"""Assemble the authored static app into a single, dependency-free HTML file."""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
html = (DIST / 'index.html').read_text()
css = (DIST / 'styles.css').read_text()
model = (DIST / 'model.js').read_text()
app = (DIST / 'app.js').read_text()

assert '</style' not in css.lower(), 'Stylesheet contains an HTML closing tag.'
assert '</script' not in model.lower(), 'Model contains an HTML closing tag.'
assert '</script' not in app.lower(), 'App contains an HTML closing tag.'
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="model.js" defer></script>', '<script>window.AFTERLIGHT_PORTABLE = true;</script>')
html = html.replace('<script src="app.js" defer></script>', '')
# Inline classic scripts must run after the body exists. Hosted deferred scripts
# already have this behavior; the portable edition runs at the end of the body.
html = html.replace('</body>', '<script>\n' + model + '\n</script>\n<script>\n' + app + '\n</script>\n</body>')
html = re.sub(r'\s*<link rel="manifest"[^>]*>', '', html)
icon = base64.b64encode((DIST / 'icon.svg').read_bytes()).decode('ascii')
html = html.replace('href="icon.svg"', 'href="data:image/svg+xml;base64,' + icon + '"')
out = DIST / 'afterlight-offline.html'
out.write_text(html)
print(f'Portable app: {out.name} ({out.stat().st_size:,} bytes; no external runtime assets)')
