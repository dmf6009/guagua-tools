#!/usr/bin/env python3
"""Keep the header, footer and robots meta consistent on the hand-written pages.

Usage: python3 scripts/sync-chrome.py   (idempotent; run after editing HEADER/FOOTER in build-guides.py)
Generated guide pages are handled by build-guides.py and are skipped here.
"""
import importlib.util, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("bg", ROOT / "scripts" / "build-guides.py")
bg = importlib.util.module_from_spec(spec); spec.loader.exec_module(bg)
ROBOTS = '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">'

pages = [p for p in ROOT.rglob("*.html") if "guides" not in p.parts and "games" not in p.parts and ".git" not in p.parts]
for p in sorted(pages):
    s = orig = p.read_text(encoding="utf-8")
    s = re.sub(r'<header class="(?:site-header|policy-header)".*?</header>', lambda m: bg.HEADER, s, count=1, flags=re.S)
    s = re.sub(r'<footer.*?</footer>', lambda m: bg.FOOTER, s, count=1, flags=re.S)
    if 'name="robots"' not in s:
        s = re.sub(r'(<link rel="canonical"[^>]*>)', lambda m: ROBOTS + m.group(1), s, count=1)
    if s != orig:
        p.write_text(s, encoding="utf-8")
        print("updated", p.relative_to(ROOT))
