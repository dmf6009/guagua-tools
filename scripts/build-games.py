#!/usr/bin/env python3
"""Build /games/*.html from content/games/*.md and the game markup below.

Usage:  python3 scripts/build-games.py && python3 scripts/build-guides.py   (the second refreshes sitemap.xml)

All links inside /games/ are relative, so the same files work at guagua-alvin.top/games/ and,
once a route maps it, at games.guagua-alvin.top/. Change BASE when the canonical host moves.
"""
import json, re, html, pathlib
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://guagua-alvin.top/games/"
MAIN = "https://guagua-alvin.top"
UPDATED = "2026-11-13"
ADS = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3191558815455000" crossorigin="anonymous"></script>'

GAMES = [
 {"slug": "sudoku", "name": "Sudoku", "title": "Free Online Sudoku: Easy to Expert, Notes &amp; Hints | Guagua Games",
  "h1": "Sudoku", "desc": "Play free Sudoku online in your browser. Four difficulty levels, pencil notes, hints, undo and automatic saving. No download, no sign-up, works on phone and desktop.",
  "deck": "A new puzzle every time, each with exactly one solution. Four levels, pencil notes, hints and undo.",
  "tile": "Fill the grid so every row, column and box holds 1 to 9. Four levels with notes and hints.", "genre": "Puzzle",
  "faq": [["Is this Sudoku free?", "Yes. Every puzzle is free, with no account and no download. The game runs entirely in your browser."],
          ["Does every puzzle have only one solution?", "Yes. Each puzzle is generated in your browser and checked by a solver so that exactly one solution exists. You never need to guess."],
          ["Is my progress saved?", "The current puzzle, your notes and the timer are saved in this browser's local storage. They stay on your device and are cleared if you clear site data."],
          ["Can I play Sudoku on my phone?", "Yes. The grid and number pad are sized for touch screens, and the page works offline once loaded."]],
  "mount": """<div class="bar"><div class="seg" id="levels" role="group" aria-label="Difficulty"><button type="button" data-level="easy">Easy</button><button type="button" data-level="medium">Medium</button><button type="button" data-level="hard">Hard</button><button type="button" data-level="expert">Expert</button></div>
<div class="stats"><span>Time <b id="time">00:00</b></span><span>Mistakes <b id="errors">0</b></span></div></div>
<div class="sdk-wrap"><div class="sdk-grid" id="grid" role="grid" aria-label="Sudoku grid"></div>
<div class="sdk-side"><div class="pad" id="pad" role="group" aria-label="Number pad"></div>
<div class="tools"><button type="button" class="btn" id="notes" aria-pressed="false">Notes</button><button type="button" class="btn" id="erase">Erase</button><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn" id="hint">Hint</button></div>
<button type="button" class="btn primary" id="new">New puzzle</button></div></div>
<p class="msg" id="msg" role="status" aria-live="polite"></p>"""},
 {"slug": "minesweeper", "name": "Minesweeper", "title": "Free Online Minesweeper: Beginner, Intermediate &amp; Expert | Guagua Games",
  "h1": "Minesweeper", "desc": "Play classic Minesweeper online for free. Beginner, Intermediate and Expert boards, safe first click, chording, flag mode for touch screens and best times. No download.",
  "deck": "The classic three boards with a safe first click, chording, and a flag mode for touch screens.",
  "tile": "Clear the board without touching a mine. Classic sizes, safe first click, touch-friendly flags.", "genre": "Puzzle",
  "faq": [["Is the first click always safe?", "Yes. Mines are placed after your first click, and never on that square or the eight around it, so the first click always opens an area."],
          ["How do I place a flag on a phone?", "Press and hold a square for about half a second, or turn on Flag mode and tap. Tap Flag mode again to go back to uncovering."],
          ["Can every Minesweeper board be solved without guessing?", "No. Boards are random, and some reach a position where the numbers cannot tell two squares apart. The article below explains how to make the best guess."],
          ["What is chording in Minesweeper?", "Clicking an uncovered number that already has the matching number of flags around it opens all its other neighbours at once. It is the main way experienced players save time."]],
  "mount": """<div class="bar"><div class="seg" id="levels" role="group" aria-label="Board size"><button type="button" data-level="beginner">Beginner</button><button type="button" data-level="intermediate">Intermediate</button><button type="button" data-level="expert">Expert</button></div>
<div class="stats"><span>Mines <b id="left">10</b></span><span>Time <b id="time">0</b></span><span>Best <b id="best">—</b></span></div>
<div class="bar-group"><button type="button" class="btn" id="flagmode" aria-pressed="false">⚑ Flag mode</button><button type="button" class="btn primary" id="new">New game</button></div></div>
<div class="ms-scroll"><div class="ms-grid" id="grid" role="grid" aria-label="Minesweeper board"></div></div>
<p class="msg" id="msg" role="status" aria-live="polite"></p>"""},
 {"slug": "solitaire", "name": "Klondike Solitaire", "title": "Free Online Solitaire (Klondike): Draw 1 or Draw 3 | Guagua Games",
  "h1": "Klondike Solitaire", "desc": "Play classic Klondike Solitaire online for free. Draw 1 or Draw 3, tap or drag to move, unlimited undo, hints and auto-finish. No download or sign-up, works on mobile.",
  "deck": "The classic patience game. Tap a card to move it, or drag it where you want. Draw 1 or Draw 3, unlimited undo.",
  "tile": "Build four suits from Ace to King. Draw 1 or Draw 3, tap or drag, unlimited undo.", "genre": "Card",
  "faq": [["Is this Solitaire free to play?", "Yes. It is free, needs no account or download, and runs entirely in your browser."],
          ["What is the difference between Draw 1 and Draw 3?", "In Draw 1 you turn one stock card at a time, so every card is reachable on each pass. In Draw 3 you turn three and can only play the top one, which makes the game harder and the order of play more important."],
          ["Can every Solitaire game be won?", "No. Deals are random and some cannot be solved. Analysis of Klondike with all cards visible suggests roughly four in five deals are solvable in principle, and real win rates are lower."],
          ["How do I move cards on a phone?", "Tap a card to send it to the best legal position, or press and drag it to a column or foundation of your choice."]],
  "mount": """<div class="bar"><div class="seg" id="draw" role="group" aria-label="Draw mode"><button type="button" data-draw="1">Draw 1</button><button type="button" data-draw="3">Draw 3</button></div>
<div class="stats"><span>Moves <b id="moves">0</b></span><span>Time <b id="time">00:00</b></span></div>
<div class="bar-group"><button type="button" class="btn" id="auto" hidden>Auto-finish</button><button type="button" class="btn" id="hint">Hint</button><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn primary" id="new">New game</button></div></div>
<div class="sol-table" id="table"></div>
<p class="msg" id="msg" role="status" aria-live="polite"></p>"""},
]

ART = {
 "sudoku": '<svg viewBox="0 0 90 90" width="96" height="96" aria-hidden="true"><rect x="3" y="3" width="84" height="84" fill="#fff" stroke="#151712" stroke-width="3"/><path d="M31 3v84M59 3v84M3 31h84M3 59h84" stroke="#151712" stroke-width="2"/><g font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="700" text-anchor="middle"><text x="17" y="24">5</text><text x="45" y="52" fill="#315f49">9</text><text x="73" y="24">2</text><text x="17" y="80">7</text><text x="73" y="80" fill="#315f49">4</text></g></svg>',
 "minesweeper": '<svg viewBox="0 0 90 90" width="96" height="96" aria-hidden="true"><g fill="#b9c8bb"><rect x="3" y="3" width="26" height="26" rx="3"/><rect x="32" y="3" width="26" height="26" rx="3"/><rect x="3" y="32" width="26" height="26" rx="3"/><rect x="61" y="61" width="26" height="26" rx="3"/></g><g fill="#fff" stroke="#d9d7cd"><rect x="61" y="3" width="26" height="26" rx="3"/><rect x="32" y="32" width="26" height="26" rx="3"/><rect x="61" y="32" width="26" height="26" rx="3"/><rect x="3" y="61" width="26" height="26" rx="3"/><rect x="32" y="61" width="26" height="26" rx="3"/></g><g font-family="ui-monospace,monospace" font-size="17" font-weight="800" text-anchor="middle"><text x="45" y="51" fill="#1f5fbf">1</text><text x="74" y="51" fill="#2a7a45">2</text><text x="45" y="80" fill="#c33c22">3</text><text x="16" y="22" fill="#d9532b">⚑</text></g></svg>',
 "solitaire": '<svg viewBox="0 0 100 90" width="106" height="96" aria-hidden="true"><g stroke="#9aa39a" fill="#fff"><rect x="8" y="14" width="44" height="62" rx="5" transform="rotate(-10 30 45)"/><rect x="28" y="12" width="44" height="62" rx="5"/><rect x="48" y="14" width="44" height="62" rx="5" transform="rotate(10 70 45)"/></g><g font-family="Georgia,serif" font-weight="700" text-anchor="middle"><text x="50" y="52" font-size="26" fill="#c22d18">♥</text><text x="80" y="34" font-size="13" fill="#151712">K</text><text x="19" y="36" font-size="13" fill="#151712">A</text></g></svg>',
}


def header(current=""):
    def a(slug, label):
        cur = ' aria-current="page"' if slug == current else ""
        return f'<a href="{slug}"{cur}>{label}</a>'
    return ('<a class="skip" href="#main">Skip to content</a><header class="g-header"><a class="g-brand" href="./"><i aria-hidden="true">G</i><span>GUAGUA <b>GAMES</b></span></a>'
            '<nav aria-label="Games">' + a("sudoku", "Sudoku") + a("minesweeper", "Minesweeper") + a("solitaire", "Solitaire")
            + f'<a href="{MAIN}/">Developer tools ↗</a></nav></header>')


FOOTER = (f'<footer class="g-footer"><span>Guagua Games · free browser games by Alvin Li. No download, no account.</span>'
          f'<div><a href="./">All games</a><a href="{MAIN}/about">About</a><a href="{MAIN}/contact">Contact</a>'
          f'<a href="{MAIN}/privacy">Privacy</a><a href="{MAIN}/terms">Terms</a><a href="{MAIN}/cookies">Cookies</a></div></footer>')


def head(title, desc, url, ld):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="theme-color" content="#f7f5ed">
<link rel="canonical" href="{url}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="assets/games.css">
{ADS}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Guagua Games">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{html.escape(desc, quote=True)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{MAIN}/assets/social-card.svg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
"""


def game_page(g):
    body = markdown.markdown((ROOT / "content" / "games" / f"{g['slug']}.md").read_text(encoding="utf-8"), extensions=["tables", "sane_lists"])
    body = body.replace("<table>", '<div class="tw"><table>').replace("</table>", "</table></div>")
    url = BASE + g["slug"]
    faq = "".join(f"<h3>{html.escape(q)}</h3><p>{html.escape(a)}</p>" for q, a in g["faq"])
    others = "".join(f'<a href="{o["slug"]}"><b>{o["name"]}</b><span>{o["tile"]}</span></a>' for o in GAMES if o["slug"] != g["slug"])
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": ["VideoGame", "WebApplication"], "name": g["name"], "url": url, "description": g["desc"], "genre": g["genre"],
         "applicationCategory": "GameApplication", "operatingSystem": "Any (web browser)", "gamePlatform": "Web browser", "inLanguage": "en",
         "playMode": "SinglePlayer", "isAccessibleForFree": True, "dateModified": UPDATED,
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
         "author": {"@type": "Person", "name": "Alvin Li", "url": MAIN + "/about"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Games", "item": BASE},
            {"@type": "ListItem", "position": 2, "name": g["name"], "item": url}]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in g["faq"]]}]}
    return (head(g["title"], g["desc"], url, ld) + header(g["slug"]) + f"""
<main id="main">
<p class="crumbs"><a href="./">Games</a> / {g['name']}</p>
<h1>{g['h1']}</h1>
<p class="deck">{g['deck']}</p>
<section class="game" aria-label="{g['name']} game">
{g['mount']}
<noscript><p class="msg">This game needs JavaScript. The rules and strategy guide below can be read without it.</p></noscript>
</section>
<article class="article">
{body}
<h2>Frequently asked questions</h2>
{faq}
<h2>More games</h2>
<div class="more">{others}</div>
<p class="note">Written and built by Alvin Li. Last updated November 13, 2026. Found a bug or a rule that behaves oddly? <a href="{MAIN}/contact">Report it</a>.</p>
</article>
</main>
{FOOTER}
<script src="assets/{g['slug']}.js" defer></script>
</body>
</html>
""")


def index_page():
    desc = "Free classic puzzle and card games that run in your browser: Sudoku, Minesweeper and Klondike Solitaire. No download, no account, saved progress, works on phone and desktop."
    tiles = "".join(f'<a class="tile" href="{g["slug"]}"><div class="art">{ART[g["slug"]]}</div><div class="txt"><b>{g["name"]}</b><span>{g["tile"]}</span><br><em>Play {g["name"]} →</em></div></a>' for g in GAMES)
    ld = {"@context": "https://schema.org", "@type": ["CollectionPage", "ItemList"], "name": "Guagua Games", "url": BASE, "description": desc,
          "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": g["name"], "url": BASE + g["slug"]} for i, g in enumerate(GAMES)]}
    return (head("Free Online Puzzle &amp; Card Games: Sudoku, Minesweeper, Solitaire | Guagua Games", desc, BASE, ld) + header() + f"""
<main id="main">
<h1>Classic games, nothing in the way.</h1>
<p class="deck">Three games you already know, built to load fast and stay out of your way. No download, no sign-up, and your game in progress is still there when you come back.</p>
<div class="hub">{tiles}</div>
<article class="article">
<h2>What you get</h2>
<ul>
<li><strong>Proper rules.</strong> Every Sudoku has exactly one solution. Minesweeper's first click is always safe and uses the classic board sizes. Solitaire is standard Klondike with Draw 1 and Draw 3.</li>
<li><strong>Works on a phone.</strong> Touch targets are sized for fingers: a number pad for Sudoku, long-press and a flag mode for Minesweeper, tap-to-move and drag for Solitaire.</li>
<li><strong>Keyboard support.</strong> Arrow keys and number keys in Sudoku, arrow keys and <kbd>F</kbd> in Minesweeper, <kbd>Ctrl</kbd>+<kbd>Z</kbd> to undo.</li>
<li><strong>Saved on your device.</strong> Progress and best times are kept in your browser's local storage. Nothing about your play is sent to a server.</li>
<li><strong>A guide under every game.</strong> Each page explains the rules and the techniques that actually improve your results.</li>
</ul>
<h2>Which game should I play?</h2>
<div class="tw"><table><thead><tr><th>Game</th><th>Typical length</th><th>Luck</th><th>Good for</th></tr></thead><tbody>
<tr><td><a href="sudoku">Sudoku</a></td><td>5 to 30 minutes</td><td>None: pure logic</td><td>Calm, focused thinking</td></tr>
<tr><td><a href="minesweeper">Minesweeper</a></td><td>1 to 5 minutes</td><td>Some: occasional forced guesses</td><td>Quick rounds and beating your best time</td></tr>
<tr><td><a href="solitaire">Klondike Solitaire</a></td><td>5 to 10 minutes</td><td>A lot: not every deal can be won</td><td>Relaxed play with a few real decisions</td></tr>
</tbody></table></div>
<h2>About these games</h2>
<p>Guagua Games is a small independent project by Alvin Li, who also maintains the developer tools at <a href="{MAIN}/">guagua-alvin.top</a>. The games are written from scratch in plain JavaScript with no game engine, which is why each page is only a few tens of kilobytes. More games will be added one at a time, when each is finished properly.</p>
<p class="note">Last updated November 13, 2026. Questions or bug reports: <a href="{MAIN}/contact">contact</a>. See the <a href="{MAIN}/privacy">privacy policy</a> for how advertising and local storage work on this site.</p>
</article>
</main>
{FOOTER}
</body>
</html>
""")


def main():
    out = ROOT / "games"
    for g in GAMES:
        (out / f"{g['slug']}.html").write_text(game_page(g), encoding="utf-8")
    (out / "index.html").write_text(index_page(), encoding="utf-8")
    lm = ROOT / "content" / "sitemap-lastmod.json"
    d = json.loads(lm.read_text())
    d["/games/"] = UPDATED
    for g in GAMES:
        d["/games/" + g["slug"]] = UPDATED
    lm.write_text(json.dumps(d, indent=1))
    print("built", len(GAMES), "games + index")


if __name__ == "__main__":
    main()
