#!/usr/bin/env python3
"""Build the games site (served at https://games.guagua-alvin.top/) from content/games/*.md.

Usage:  python3 scripts/build-games.py

Writes games/*.html, games/sitemap.xml, games/robots.txt and games/manifest.webmanifest.
Files live in the /games/ directory of the Pages project; the proxy worker maps the games host onto it,
so every link inside /games/ is relative.
"""
import json, html, pathlib
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "games"
BASE = "https://games.guagua-alvin.top/"
MAIN = "https://guagua-alvin.top"
UPDATED = "2026-11-17"
UPDATED_TEXT = "November 17, 2026"
ADS = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3191558815455000" crossorigin="anonymous"></script>'
LEVELS = [("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard"), ("expert", "Expert")]

# Short labels for links between pages.
LINKS = {
    "sudoku": "Sudoku", "daily-sudoku": "Today's daily Sudoku", "easy-sudoku": "Easy Sudoku", "medium-sudoku": "Medium Sudoku",
    "hard-sudoku": "Hard Sudoku", "expert-sudoku": "Expert Sudoku", "minesweeper": "Minesweeper", "solitaire": "Klondike Solitaire",
    "freecell": "FreeCell", "spider": "Spider Solitaire", "2048": "2048", "pyramid": "Pyramid Solitaire", "printable-sudoku": "Printable Sudoku",
}
SOLITAIRES = [("solitaire", "Klondike"), ("freecell", "FreeCell"), ("spider", "Spider"), ("pyramid", "Pyramid")]


def sudoku_mount(mode, level=None):
    if mode == "free":
        top = ('<div class="seg" id="levels" role="group" aria-label="Difficulty">'
               + "".join(f'<button type="button" data-level="{k}">{v}</button>' for k, v in LEVELS) + "</div>")
    elif mode == "level":
        top = ('<nav class="seg" aria-label="Difficulty">'
               + "".join(f'<a href="{k}-sudoku"{" aria-current=\"page\"" if k == level else ""}>{v}</a>' for k, v in LEVELS) + "</nav>")
    else:
        top = ('<div class="daily-strip"><span>Puzzle <b id="dnum">#1</b></span><span>Level <b id="dlevel">—</b></span>'
               '<span>Streak <b id="dstreak">0</b></span><span>Solved <b id="dsolved">0</b></span><span id="darchive" hidden></span></div>')
    new = "" if mode == "daily" else '<button type="button" class="btn primary" id="new">New puzzle</button>'
    return f"""<div class="bar">{top}
<div class="stats"><span>Time <b id="time">00:00</b></span><span>Mistakes <b id="errors">0</b></span></div></div>
<div class="sdk-wrap"><div class="sdk-grid" id="grid" role="grid" aria-label="Sudoku grid"></div>
<div class="sdk-side"><div class="pad" id="pad" role="group" aria-label="Number pad"></div>
<div class="tools"><button type="button" class="btn" id="notes" aria-pressed="false">Notes</button><button type="button" class="btn" id="erase">Erase</button><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn" id="hint">Hint</button></div>
{new}</div></div>"""


MINES = """<div class="bar"><div class="seg" id="levels" role="group" aria-label="Board size"><button type="button" data-level="beginner">Beginner</button><button type="button" data-level="intermediate">Intermediate</button><button type="button" data-level="expert">Expert</button></div>
<div class="stats"><span>Mines <b id="left">10</b></span><span>Time <b id="time">0</b></span><span>Best <b id="best">—</b></span></div>
<div class="bar-group"><button type="button" class="btn" id="flagmode" aria-pressed="false">⚑ Flag mode</button><button type="button" class="btn primary" id="new">New game</button></div></div>
<div class="ms-scroll"><div class="ms-grid" id="grid" role="grid" aria-label="Minesweeper board"></div></div>"""

KLONDIKE = """<div class="bar"><div class="seg" id="draw" role="group" aria-label="Draw mode"><button type="button" data-draw="1">Draw 1</button><button type="button" data-draw="3">Draw 3</button></div>
<div class="stats"><span>Moves <b id="moves">0</b></span><span>Time <b id="time">00:00</b></span></div>
<div class="bar-group"><button type="button" class="btn" id="auto" hidden>Auto-finish</button><button type="button" class="btn" id="hint">Hint</button><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn primary" id="new">New game</button></div></div>
<div class="sol-table" id="table"></div>"""

FREECELL = """<div class="bar"><div class="stats"><span>Deal <b id="dealno">#1</b></span><span>Moves <b id="moves">0</b></span><span>Time <b id="time">00:00</b></span></div>
<form class="deal-pick" id="pick"><label for="pickno" class="stats">Deal #</label><input id="pickno" type="number" min="1" max="1000000" inputmode="numeric" placeholder="e.g. 617"><button type="submit" class="btn">Play</button></form>
<div class="bar-group"><button type="button" class="btn" id="hint">Hint</button><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn" id="restart">Restart</button><button type="button" class="btn primary" id="new">New deal</button></div></div>
<div class="sol-table" id="table"></div>"""

SPIDER = """<div class="bar"><div class="seg" id="suits" role="group" aria-label="Number of suits"><button type="button" data-suits="1">1 suit</button><button type="button" data-suits="2">2 suits</button><button type="button" data-suits="4">4 suits</button></div>
<div class="stats"><span>Score <b id="score">500</b></span><span>Moves <b id="moves">0</b></span><span>Time <b id="time">00:00</b></span></div>
<div class="bar-group"><button type="button" class="btn" id="hint">Hint</button><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn primary" id="new">New game</button></div></div>
<div class="sol-table" id="table"></div>"""

G2048 = ('<div class="bar"><div class="stats"><span>Score <b id="score">0</b></span><span>Best <b id="best">0</b></span></div>'
         '<div class="bar-group"><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn primary" id="new">New game</button></div></div>'
         '<div class="g2048" id="board" role="application" aria-label="2048 board"><div class="g2048-layer">'
         + "".join(f'<div class="bg" style="--x:{i % 4};--y:{i // 4}"></div>' for i in range(16))
         + '</div><div class="g2048-layer" id="tiles"></div></div><p class="g2048-help">Use the arrow keys or swipe on the board.</p>')

PYRAMID = """<div class="bar"><div class="stats"><span>Left <b id="left">28</b></span><span>Pass <b id="pass">1 of 3</b></span><span>Moves <b id="moves">0</b></span><span>Time <b id="time">00:00</b></span></div>
<div class="bar-group"><button type="button" class="btn" id="hint">Hint</button><button type="button" class="btn" id="undo">Undo</button><button type="button" class="btn primary" id="new">New game</button></div></div>
<div class="sol-table" id="table"></div>"""

PRINTABLE = """<form class="ps-form" id="print-form">
<label>Difficulty<select id="ps-level"><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option><option value="expert">Expert</option></select></label>
<label>Puzzles per page<select id="ps-per"><option value="1">1 (large print)</option><option value="2">2</option><option value="4" selected>4</option><option value="6">6</option></select></label>
<label>Pages<select id="ps-pages"><option value="1" selected>1</option><option value="2">2</option><option value="3">3</option><option value="5">5</option></select></label>
<label class="chk"><input type="checkbox" id="ps-answers" checked> Include answers</label>
<span class="ps-actions"><button type="submit" class="btn">New puzzles</button> <button type="button" class="btn primary" id="print">Print</button></span>
</form>
<p id="print-status" role="status" aria-live="polite"></p>
<div class="sheets" id="sheets"></div>"""

SUDOKU_FAQ_COMMON = [
    ["Does every puzzle have only one solution?", "Yes. Each puzzle is generated in your browser and checked by a solver so that exactly one solution exists. You never need to guess."],
    ["Is my progress saved?", "The current puzzle, your notes and the timer are saved in this browser's local storage, so you can close the page and continue later. Nothing is sent to a server."],
]

PAGES = [
 {"slug": "sudoku", "name": "Sudoku", "genre": "Puzzle", "js": ["sudoku-core", "sudoku"], "cfg": {"mode": "free"}, "mount": sudoku_mount("free"),
  "title": "Free Online Sudoku: Easy to Expert, Notes &amp; Hints | Guagua Games", "h1": "Sudoku",
  "desc": "Play free Sudoku online in your browser. Four difficulty levels, a daily puzzle, pencil notes, hints, undo and automatic saving. No download, no sign-up, works on phone and desktop.",
  "deck": "A new puzzle every time, each with exactly one solution. Four levels, pencil notes, hints and undo. Prefer one shared puzzle a day? Try the <a href=\"daily-sudoku\">daily Sudoku</a>.",
  "tile": "Fill the grid so every row, column and box holds 1 to 9. Four levels with notes and hints.",
  "next": ["daily-sudoku", "hard-sudoku", "minesweeper", "freecell"],
  "faq": [["Is this Sudoku free?", "Yes. Every puzzle is free, with no account and no download. The game runs entirely in your browser."]] + SUDOKU_FAQ_COMMON +
         [["Can I play Sudoku on my phone?", "Yes. The grid and number pad are sized for touch screens."]]},
 {"slug": "daily-sudoku", "name": "Daily Sudoku", "genre": "Puzzle", "js": ["sudoku-core", "sudoku"], "cfg": {"mode": "daily"}, "mount": sudoku_mount("daily"),
  "title": "Daily Sudoku: A New Free Puzzle Every Day | Guagua Games", "h1": "Daily Sudoku",
  "desc": "One free Sudoku a day, the same puzzle for everyone. Difficulty builds from easy on Monday to expert on Sunday. Track your streak and share your time. No sign-up.",
  "deck": "Today's puzzle is the same for every player. Solve it, keep your streak going, and share your time.",
  "next": ["medium-sudoku", "minesweeper", "solitaire", "freecell"],
  "faq": [["When does the daily Sudoku change?", "At midnight in your own time zone. Everyone who opens the page on the same calendar date gets the same puzzle."],
          ["How is my streak counted?", "The streak is the number of consecutive days on which you solved the daily puzzle in this browser. It stays alive until the end of today, so you have all day to keep it going."],
          ["Can I play past daily puzzles?", "Yes. The list below the grid links to the last 30 daily puzzles and shows which ones you have solved. Past puzzles count towards your total but not your streak."],
          ["How difficult is the daily puzzle?", "It follows the week: easy on Monday and Tuesday, medium on Wednesday and Thursday, hard on Friday and Saturday, and expert on Sunday."]]},
 {"slug": "minesweeper", "name": "Minesweeper", "genre": "Puzzle", "js": ["minesweeper"], "mount": MINES,
  "title": "Free Online Minesweeper: Beginner, Intermediate &amp; Expert | Guagua Games", "h1": "Minesweeper",
  "desc": "Play classic Minesweeper online for free. Beginner, Intermediate and Expert boards, safe first click, chording, flag mode for touch screens and best times. No download.",
  "deck": "The classic three boards with a safe first click, chording, and a flag mode for touch screens.",
  "tile": "Clear the board without touching a mine. Classic sizes, safe first click, touch-friendly flags.",
  "next": ["2048", "sudoku", "daily-sudoku"],
  "faq": [["Is the first click always safe?", "Yes. Mines are placed after your first click, and never on that square or the eight around it, so the first click always opens an area."],
          ["How do I place a flag on a phone?", "Press and hold a square for about half a second, or turn on Flag mode and tap. Tap Flag mode again to go back to uncovering."],
          ["Can every Minesweeper board be solved without guessing?", "No. Boards are random, and some reach a position where the numbers cannot tell two squares apart. The guide on this page explains how to make the best guess."],
          ["What is chording in Minesweeper?", "Clicking an uncovered number that already has the matching number of flags around it opens all its other neighbours at once. It is the main way experienced players save time."]]},
 {"slug": "solitaire", "name": "Klondike Solitaire", "genre": "Card", "js": ["solitaire"], "mount": KLONDIKE,
  "title": "Free Online Solitaire (Klondike): Draw 1 or Draw 3 | Guagua Games", "h1": "Klondike Solitaire",
  "desc": "Play classic Klondike Solitaire online for free. Draw 1 or Draw 3, tap or drag to move, unlimited undo, hints and auto-finish. No download or sign-up, works on mobile.",
  "deck": "The classic patience game. Tap a card to move it, or drag it where you want. Draw 1 or Draw 3, unlimited undo.",
  "tile": "Build four suits from Ace to King. Draw 1 or Draw 3, tap or drag, unlimited undo.",
  "next": ["freecell", "pyramid", "daily-sudoku"],
  "faq": [["Is this Solitaire free to play?", "Yes. It is free, needs no account or download, and runs entirely in your browser."],
          ["What is the difference between Draw 1 and Draw 3?", "In Draw 1 you turn one stock card at a time, so every card is reachable on each pass. In Draw 3 you turn three and can only play the top one, which makes the game harder and the order of play more important."],
          ["Can every Solitaire game be won?", "No. Deals are random and some cannot be solved. Analysis of Klondike with all cards visible suggests roughly four in five deals are solvable in principle, and real win rates are lower."],
          ["How do I move cards on a phone?", "Tap a card to send it to the best legal position, or press and drag it to a column or foundation of your choice."]]},
 {"slug": "freecell", "name": "FreeCell", "genre": "Card", "js": ["cards", "freecell"], "mount": FREECELL,
  "title": "Free Online FreeCell Solitaire: Numbered Deals 1 to 1,000,000 | Guagua Games", "h1": "FreeCell",
  "desc": "Play FreeCell Solitaire online for free. Classic numbered deals from 1 to 1,000,000, tap or drag to move, multi-card moves, unlimited undo and hints. No download, works on mobile.",
  "deck": "Every card is face up, so every game is a puzzle you can think through. Classic numbered deals, unlimited undo.",
  "tile": "All cards face up, four free cells, numbered deals. Nearly every game can be won.",
  "next": ["spider", "pyramid", "2048"],
  "faq": [["Can every FreeCell game be won?", "Almost. Of the original 32,000 numbered deals, only deal #11982 is known to be unsolvable. Nearly every other deal can be won with careful play."],
          ["Are the deal numbers the same as Windows FreeCell?", "Yes. Deals are generated with the same shuffle as the classic Windows version, so deal #1 here has the same layout as deal #1 there."],
          ["How many cards can I move at once in FreeCell?", "As many as your free space allows: (empty free cells + 1) multiplied by 2 for each empty column. The game moves the whole run for you when there is room."],
          ["How do I replay or share a specific deal?", "Type the number into the Deal # box and press Play, or share the page link with the deal number after a # sign."]]},
 {"slug": "spider", "name": "Spider Solitaire", "genre": "Card", "js": ["cards", "spider"], "mount": SPIDER,
  "title": "Free Online Spider Solitaire: 1, 2 or 4 Suits | Guagua Games", "h1": "Spider Solitaire",
  "desc": "Play Spider Solitaire online for free with 1, 2 or 4 suits. Tap or drag to move, unlimited undo, hints and classic scoring. No download or sign-up, works on phone and desktop.",
  "deck": "Two decks, ten columns, eight runs to complete. Choose 1, 2 or 4 suits; tap or drag to move.",
  "tile": "Build eight King-to-Ace runs. Choose 1, 2 or 4 suits for easy to expert play.",
  "next": ["freecell", "pyramid", "2048"],
  "faq": [["Which Spider Solitaire mode is easiest?", "One suit. All cards are spades, so every descending stack can be moved, and most games can be won. Two suits is a good next step; four suits is the full challenge."],
          ["Why can I not deal more cards?", "A new row can only be dealt when every column has at least one card. Move a card into each empty column first."],
          ["How is Spider Solitaire scored?", "You start with 500 points, lose one for every move or deal, and gain 100 for each completed King-to-Ace run."],
          ["Can I move cards of different suits together?", "You can place any card on one of the next rank higher, but you can only pick up several cards together if they are all the same suit and in sequence."]]},
]
PAGES += [
 {"slug": "2048", "name": "2048", "genre": "Puzzle", "js": ["2048"], "mount": G2048,
  "title": "Play 2048 Online Free: Classic Number Puzzle with Undo | Guagua Games", "h1": "2048",
  "desc": "Play 2048 online for free. Slide and merge numbered tiles to reach 2048 with arrow keys or swipes. One-move undo, best score saved, works on phone and desktop. No download.",
  "deck": "Slide the tiles, merge equal numbers, and reach 2048. Arrow keys on a keyboard, swipes on a phone.",
  "tile": "Slide and merge tiles to reach 2048. Quick rounds, arrow keys or swipe.",
  "next": ["daily-sudoku", "minesweeper", "freecell"],
  "faq": [["How do you win 2048?", "Merge tiles until one shows 2048. You can then keep playing for a higher score or a bigger tile."],
          ["What is the best strategy for 2048?", "Keep your largest tile in one corner, mostly use three directions so it stays there, and build a descending chain of tiles along the edge next to it."],
          ["Is there an undo in this 2048?", "Yes, one move. It fixes a slip but cannot replay a whole game, so scores stay comparable."],
          ["Does 2048 work on a phone?", "Yes. Swipe on the board in the direction you want the tiles to move. The page does not scroll while your finger is on the board."]]},
 {"slug": "pyramid", "name": "Pyramid Solitaire", "genre": "Card", "js": ["cards", "pyramid"], "mount": PYRAMID,
  "title": "Free Online Pyramid Solitaire: Pair Cards to 13 | Guagua Games", "h1": "Pyramid Solitaire",
  "desc": "Play Pyramid Solitaire online for free. Pair uncovered cards that add up to 13 and clear the pyramid. Three passes through the stock, hints and unlimited undo. No download.",
  "deck": "Remove pairs of cards that add up to 13 and clear all 28 cards from the pyramid. Kings go on their own.",
  "tile": "Pair cards that add up to 13 to clear the pyramid. Quick to learn, hard to win.",
  "next": ["solitaire", "freecell", "2048"],
  "faq": [["Which cards add up to 13 in Pyramid Solitaire?", "Queen and Ace, Jack and 2, 10 and 3, 9 and 4, 8 and 5, and 7 and 6. A King is worth 13 by itself and is removed alone."],
          ["Which cards can I use?", "Any pyramid card that is not covered by a card in the row below it, plus the top card of the waste pile."],
          ["How many times can I go through the stock?", "Three times. When the stock is empty, click it to turn the waste pile back over."],
          ["Can every game of Pyramid Solitaire be won?", "No. Many deals cannot be cleared even with perfect play, so a low win rate is normal for this game."]]},
 {"slug": "printable-sudoku", "name": "Printable Sudoku", "genre": "Puzzle", "js": ["sudoku-core", "printable"], "mount": PRINTABLE, "no_after": True,
  "title": "Printable Sudoku: Free Puzzles with Answers, 1 to 6 per Page | Guagua Games", "h1": "Printable Sudoku",
  "desc": "Print free Sudoku puzzles in easy, medium, hard or expert. Choose 1, 2, 4 or 6 puzzles per page, large print for one, and answer pages. A4 or Letter, generated fresh every time.",
  "deck": "Choose a level and layout, check the preview, and print. New puzzles every time, with answer pages if you want them.",
  "tile": "Sudoku sheets to print, from large print to six per page, with answers.",
  "faq": [["Are these printable Sudoku puzzles free?", "Yes. You can print and photocopy them for personal use, classrooms, care homes and clubs."],
          ["Do the puzzles come with answers?", "Yes. Leave Include answers ticked and answer pages print after the puzzles, each matched by its puzzle number."],
          ["Can I print large-print Sudoku?", "Yes. Choose 1 puzzle per page for a grid that fills the sheet."],
          ["Will it print on A4 and US Letter?", "Yes. The sheets adapt to the paper size chosen in your browser's print dialog."]]},
]
BY_SLUG = {p["slug"]: p for p in PAGES}
BY_SLUG["daily-sudoku"]["below"] = '<section class="archive" aria-labelledby="arch-h"><h2 id="arch-h">Previous puzzles</h2><ol id="archive-list"></ol></section>'

for k, v in LEVELS:
    PAGES.append({
        "slug": f"{k}-sudoku", "name": f"{v} Sudoku", "genre": "Puzzle", "js": ["sudoku-core", "sudoku"], "cfg": {"mode": "level", "level": k}, "mount": sudoku_mount("level", k),
        "title": {"easy": "Easy Sudoku Online: Free Puzzles for Beginners", "medium": "Medium Sudoku Online: Free Puzzles with Notes",
                  "hard": "Hard Sudoku Online: Free Challenging Puzzles", "expert": "Expert Sudoku Online: Free Very Hard Puzzles"}[k] + " | Guagua Games",
        "h1": f"{v} Sudoku",
        "desc": {"easy": "Free easy Sudoku puzzles for beginners, solvable by scanning alone. Unlimited puzzles, hints, undo and saving, plus a guide to the two techniques you need.",
                 "medium": "Free medium Sudoku puzzles online. Unlimited puzzles with pencil notes and hints, and a guide to candidates, naked pairs and pointing pairs.",
                 "hard": "Free hard Sudoku puzzles online. Unlimited challenging grids with notes and undo, and a guide to triples, hidden pairs and the X-Wing.",
                 "expert": "Free expert Sudoku puzzles online for advanced solvers. Unlimited very hard grids with notes, plus a guide to Swordfish, XY-Wing and colouring."}[k],
        "deck": {"easy": "Around 40 givens, solvable by scanning alone. The best place to learn or to work on speed.",
                 "medium": "Around 33 givens. Scanning gets you started; pencil notes finish the job.",
                 "hard": "Around 28 givens. Expect to work from candidates for most of the puzzle.",
                 "expert": "About 24 givens. Full notes and advanced patterns, but never a guess."}[k],
        "next": {"easy": ["medium-sudoku", "daily-sudoku", "minesweeper"], "medium": ["hard-sudoku", "daily-sudoku", "freecell"],
                 "hard": ["expert-sudoku", "daily-sudoku", "freecell"], "expert": ["daily-sudoku", "freecell", "spider"]}[k],
        "faq": [[f"How many givens does an {v.lower()} Sudoku have?" if k in ("easy", "expert") else f"How many givens does a {v.lower()} Sudoku have?",
                 {"easy": "About 40 of the 81 cells.", "medium": "About 33 of the 81 cells.", "hard": "About 28 of the 81 cells.", "expert": "About 24, sometimes a few more."}[k]
                 + " Difficulty is set by removing givens while keeping exactly one solution."]] + SUDOKU_FAQ_COMMON,
    })
BY = {p["slug"]: p for p in PAGES}
TILES = ["sudoku", "2048", "minesweeper", "solitaire", "freecell", "spider", "pyramid"]

ART = {
 "2048": '<svg viewBox="0 0 90 90" width="96" height="96" aria-hidden="true"><rect x="2" y="2" width="86" height="86" rx="8" fill="#c9c6b8"/>' + "".join(f'<rect x="{6+(i%2)*42}" y="{6+(i//2)*42}" width="36" height="36" rx="5" fill="{c}"/><text x="{24+(i%2)*42}" y="{30+(i//2)*42}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="{f}" fill="{t}">{v}</text>' for i, (v, c, t, f) in enumerate([("2", "#eeeadf", "#151712", 17), ("8", "#cfe3c4", "#151712", 17), ("128", "#d5ff66", "#151712", 13), ("2048", "#151712", "#d5ff66", 11)])) + '</svg>',
 "pyramid": '<svg viewBox="0 0 110 90" width="116" height="96" aria-hidden="true"><g stroke="#9aa39a" fill="#fff">' + "".join(f'<rect x="{46 - r*11 + i*22}" y="{6 + r*20}" width="18" height="26" rx="3"/>' for r in range(4) for i in range(r + 1)) + '</g><g font-family="Georgia,serif" font-weight="700" font-size="10"><text x="16" y="80" fill="#151712">7♠</text><text x="38" y="80" fill="#c22d18">6♥</text><text x="82" y="80" fill="#151712">K♣</text></g></svg>',
 "sudoku": '<svg viewBox="0 0 90 90" width="96" height="96" aria-hidden="true"><rect x="3" y="3" width="84" height="84" fill="#fff" stroke="#151712" stroke-width="3"/><path d="M31 3v84M59 3v84M3 31h84M3 59h84" stroke="#151712" stroke-width="2"/><g font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="700" text-anchor="middle"><text x="17" y="24">5</text><text x="45" y="52" fill="#315f49">9</text><text x="73" y="24">2</text><text x="17" y="80">7</text><text x="73" y="80" fill="#315f49">4</text></g></svg>',
 "minesweeper": '<svg viewBox="0 0 90 90" width="96" height="96" aria-hidden="true"><g fill="#b9c8bb"><rect x="3" y="3" width="26" height="26" rx="3"/><rect x="32" y="3" width="26" height="26" rx="3"/><rect x="3" y="32" width="26" height="26" rx="3"/><rect x="61" y="61" width="26" height="26" rx="3"/></g><g fill="#fff" stroke="#d9d7cd"><rect x="61" y="3" width="26" height="26" rx="3"/><rect x="32" y="32" width="26" height="26" rx="3"/><rect x="61" y="32" width="26" height="26" rx="3"/><rect x="3" y="61" width="26" height="26" rx="3"/><rect x="32" y="61" width="26" height="26" rx="3"/></g><g font-family="ui-monospace,monospace" font-size="17" font-weight="800" text-anchor="middle"><text x="45" y="51" fill="#1f5fbf">1</text><text x="74" y="51" fill="#2a7a45">2</text><text x="45" y="80" fill="#c33c22">3</text><text x="16" y="22" fill="#d9532b">⚑</text></g></svg>',
 "solitaire": '<svg viewBox="0 0 100 90" width="106" height="96" aria-hidden="true"><g stroke="#9aa39a" fill="#fff"><rect x="8" y="14" width="44" height="62" rx="5" transform="rotate(-10 30 45)"/><rect x="28" y="12" width="44" height="62" rx="5"/><rect x="48" y="14" width="44" height="62" rx="5" transform="rotate(10 70 45)"/></g><g font-family="Georgia,serif" font-weight="700" text-anchor="middle"><text x="50" y="52" font-size="26" fill="#c22d18">♥</text><text x="80" y="34" font-size="13" fill="#151712">K</text><text x="19" y="36" font-size="13" fill="#151712">A</text></g></svg>',
 "freecell": '<svg viewBox="0 0 110 90" width="116" height="96" aria-hidden="true"><g fill="none" stroke="#315f49" stroke-dasharray="4 3" stroke-width="2"><rect x="4" y="8" width="22" height="30" rx="3"/><rect x="30" y="8" width="22" height="30" rx="3"/></g><g stroke="#9aa39a" fill="#fff"><rect x="58" y="8" width="22" height="30" rx="3"/><rect x="84" y="8" width="22" height="30" rx="3"/><rect x="20" y="46" width="22" height="30" rx="3"/><rect x="20" y="56" width="22" height="30" rx="3"/><rect x="62" y="46" width="22" height="30" rx="3"/><rect x="62" y="56" width="22" height="30" rx="3"/></g><g font-family="Georgia,serif" font-weight="700" font-size="13"><text x="62" y="22" fill="#151712">A♠</text><text x="88" y="22" fill="#c22d18">A♥</text><text x="23" y="70" fill="#c22d18">7♦</text><text x="65" y="70" fill="#151712">9♣</text></g></svg>',
 "spider": '<svg viewBox="0 0 110 90" width="116" height="96" aria-hidden="true"><g stroke="#9aa39a" fill="#fff">' + "".join(f'<rect x="{6+i*20}" y="{10+j*12}" width="18" height="26" rx="3"/>' for i in range(5) for j in range(3)) + '</g><g font-family="Georgia,serif" font-weight="700" font-size="11" fill="#151712">' + "".join(f'<text x="{8+i*20}" y="45">{r}♠</text>' for i, r in enumerate(["K", "Q", "J", "10", "9"])) + '</g><text x="55" y="80" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#151712">♠</text></svg>',
}


def nav(current=""):
    items = [("daily-sudoku", "Daily"), ("sudoku", "Sudoku"), ("2048", "2048"), ("minesweeper", "Minesweeper"), ("solitaire", "Solitaire"), ("./", "All games")]
    cur = "sudoku" if current.endswith("-sudoku") and current != "daily-sudoku" else "solitaire" if current in ("freecell", "spider", "pyramid") else current
    links = "".join(f'<a href="{s}"{" aria-current=\"page\"" if s == cur else ""}>{n}</a>' for s, n in items)
    return ('<a class="skip" href="#main">Skip to content</a><header class="g-header"><a class="g-brand" href="./"><i aria-hidden="true">G</i><span>GUAGUA <b>GAMES</b></span></a>'
            f'<nav aria-label="Games">{links}</nav></header>')


FOOTER = ('<footer class="g-footer"><span>Guagua Games · free browser games by Alvin Li. No download, no account.</span>'
          f'<div><a href="./">All games</a><a href="{MAIN}/">Developer tools</a><a href="{MAIN}/about">About</a><a href="{MAIN}/contact">Contact</a>'
          f'<a href="{MAIN}/privacy">Privacy</a><a href="{MAIN}/terms">Terms</a><a href="{MAIN}/cookies">Cookies</a></div></footer>')


def head(title, desc, url, ld):
    d = html.escape(desc, quote=True)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{d}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="theme-color" content="#f7f5ed">
<link rel="canonical" href="{url}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="stylesheet" href="assets/games.css">
{ADS}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Guagua Games">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
"""


def family(slug):
    if slug not in dict(SOLITAIRES):
        return ""
    links = " · ".join(f'<b>{n}</b>' if s == slug else f'<a href="{s}">{n}</a>' for s, n in SOLITAIRES)
    return f'<p class="crumbs">Solitaire games: {links}</p>'


def after_panel(p):
    if p.get("no_after"):
        return ""
    links = "".join(f'<a href="{s}">{LINKS[s]}</a>' for s in p["next"])
    return (f'<div class="after" id="after" hidden><p class="after-title" id="after-title">Nicely done. What next?</p>'
            f'<div class="after-links"><button type="button" class="btn" id="share" hidden>Share result</button>{links}</div></div>')


def game_page(p):
    body = markdown.markdown((ROOT / "content" / "games" / f"{p['slug']}.md").read_text(encoding="utf-8"), extensions=["tables", "sane_lists"])
    body = body.replace("<table>", '<div class="tw"><table>').replace("</table>", "</table></div>")
    url = BASE + p["slug"]
    faq = "".join(f"<h3>{html.escape(q)}</h3><p>{html.escape(a)}</p>" for q, a in p["faq"])
    others = "".join(f'<a href="{s}"><b>{BY[s]["name"]}</b><span>{BY[s]["tile"]}</span></a>' for s in TILES if s != p["slug"])
    if p["slug"].endswith("sudoku"):
        others = ('<a href="daily-sudoku"><b>Daily Sudoku</b><span>One shared puzzle a day, with a streak to keep.</span></a>' if p["slug"] != "daily-sudoku" else "") + others
        if p["slug"] == "sudoku" or p["slug"] == "daily-sudoku":
            levels = " · ".join(f'<a href="{k}-sudoku">{v}</a>' for k, v in LEVELS)
            body = body + f"<p><strong>Play by difficulty:</strong> {levels} · <a href=\"printable-sudoku\">Print puzzles</a></p>"
    crumbs = '<a href="./">Games</a> / ' + (f'<a href="sudoku">Sudoku</a> / {p["name"]}' if p["slug"].endswith("-sudoku") and p["slug"] != "daily-sudoku" else p["name"])
    ld_items = [{"@type": "ListItem", "position": 1, "name": "Games", "item": BASE}]
    if p["slug"].endswith("-sudoku") and p["slug"] != "daily-sudoku":
        ld_items.append({"@type": "ListItem", "position": 2, "name": "Sudoku", "item": BASE + "sudoku"})
    ld_items.append({"@type": "ListItem", "position": len(ld_items) + 1, "name": p["name"], "item": url})
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": ["VideoGame", "WebApplication"], "name": p["name"], "url": url, "description": p["desc"], "genre": p["genre"],
         "applicationCategory": "GameApplication", "operatingSystem": "Any (web browser)", "gamePlatform": "Web browser", "inLanguage": "en",
         "playMode": "SinglePlayer", "isAccessibleForFree": True, "dateModified": UPDATED,
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
         "author": {"@type": "Person", "name": "Alvin Li", "url": MAIN + "/about"}},
        {"@type": "BreadcrumbList", "itemListElement": ld_items},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]}]}
    cfg = f'<script>window.GG_SUDOKU={json.dumps(p["cfg"])};</script>\n' if p.get("cfg") else ""
    scripts = cfg + '<script src="assets/common.js" defer></script>\n' + "".join(f'<script src="assets/{j}.js" defer></script>\n' for j in p["js"])
    return (head(p["title"], p["desc"], url, ld) + nav(p["slug"]) + f"""
<main id="main">
<p class="crumbs">{crumbs}</p>
<h1>{p['h1']}</h1>
<p class="deck">{p['deck']}</p>{family(p['slug'])}
<section class="game" aria-label="{p['name']} game">
{p['mount']}
{'' if p.get('no_after') else '<p class="msg" id="msg" role="status" aria-live="polite"></p>'}
{after_panel(p)}
<noscript><p class="msg">This game needs JavaScript. The rules and strategy guide below can be read without it.</p></noscript>
</section>
{p.get('below', '')}
<article class="article">
{body}
<h2>Frequently asked questions</h2>
{faq}
<h2>More games</h2>
<div class="more">{others}</div>
<p class="note">Written and built by Alvin Li. Last updated {UPDATED_TEXT}. Found a bug or a rule that behaves oddly? <a href="{MAIN}/contact">Report it</a>.</p>
</article>
</main>
{FOOTER}
{scripts}</body>
</html>
""")


def index_page():
    desc = "Free classic games in your browser: Sudoku with a daily puzzle, 2048, Minesweeper, and Klondike, FreeCell, Spider and Pyramid Solitaire. No download, no account, saved progress."
    tiles = "".join(f'<a class="tile" href="{s}"><div class="art">{ART[s]}</div><div class="txt"><b>{BY[s]["name"]}</b><span>{BY[s]["tile"]}</span><br><em>Play {BY[s]["name"]} →</em></div></a>' for s in TILES)
    ld = {"@context": "https://schema.org", "@type": ["CollectionPage", "ItemList"], "name": "Guagua Games", "url": BASE, "description": desc,
          "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": BY[s]["name"], "url": BASE + s} for i, s in enumerate(TILES + ["daily-sudoku"])]}
    levels = "".join(f'<a href="{k}-sudoku">{v} Sudoku</a>' for k, v in LEVELS) + '<a href="printable-sudoku">Printable Sudoku</a>'
    return (head("Free Online Games: Sudoku, 2048, Solitaire, FreeCell, Minesweeper | Guagua Games", desc, BASE, ld) + nav() + f"""
<main id="main">
<h1>Classic games, nothing in the way.</h1>
<p class="deck">Games you already know, built to load fast and stay out of your way. No download, no sign-up, and your game in progress is still there when you come back.</p>
<div class="daily-cta"><div><b>Daily Sudoku</b><span>One puzzle a day, the same for everyone. Keep your streak going.</span></div><a href="daily-sudoku">Play today's puzzle →</a></div>
<div class="hub">{tiles}</div>
<p class="hub-more"><strong>Sudoku by difficulty:</strong> {levels}</p>
<article class="article">
<h2>What you get</h2>
<ul>
<li><strong>Proper rules.</strong> Every Sudoku has exactly one solution. Minesweeper's first click is always safe. FreeCell uses the classic numbered deals. Klondike, Spider and Pyramid follow the standard rules.</li>
<li><strong>Sudoku on paper too.</strong> <a href="printable-sudoku">Printable Sudoku</a> makes sheets of one to six puzzles with answer pages.</li>
<li><strong>Works on a phone.</strong> Touch targets are sized for fingers: a number pad for Sudoku, long-press and a flag mode for Minesweeper, tap-to-move and drag for the card games.</li>
<li><strong>Keyboard support.</strong> Arrow keys and number keys in Sudoku, arrow keys and <kbd>F</kbd> in Minesweeper, <kbd>Ctrl</kbd>+<kbd>Z</kbd> to undo everywhere.</li>
<li><strong>Saved on your device.</strong> Progress, streaks and best times are kept in your browser's local storage. Nothing about your play is sent to a server.</li>
<li><strong>A guide under every game.</strong> Each page explains the rules and the techniques that actually improve your results.</li>
</ul>
<h2>Which game should I play?</h2>
<div class="tw"><table><thead><tr><th>Game</th><th>Typical length</th><th>Luck</th><th>Good for</th></tr></thead><tbody>
<tr><td><a href="sudoku">Sudoku</a></td><td>5 to 30 minutes</td><td>None: pure logic</td><td>Calm, focused thinking</td></tr>
<tr><td><a href="daily-sudoku">Daily Sudoku</a></td><td>5 to 30 minutes</td><td>None</td><td>A daily habit and comparing times with friends</td></tr>
<tr><td><a href="2048">2048</a></td><td>3 to 15 minutes</td><td>A little: where new tiles appear</td><td>Short breaks, one more game</td></tr>
<tr><td><a href="minesweeper">Minesweeper</a></td><td>1 to 5 minutes</td><td>Some: occasional forced guesses</td><td>Quick rounds and beating your best time</td></tr>
<tr><td><a href="freecell">FreeCell</a></td><td>5 to 15 minutes</td><td>Very little: almost every deal can be won</td><td>Planning ahead with nothing hidden</td></tr>
<tr><td><a href="solitaire">Klondike Solitaire</a></td><td>5 to 10 minutes</td><td>A lot: not every deal can be won</td><td>Relaxed play with a few real decisions</td></tr>
<tr><td><a href="spider">Spider Solitaire</a></td><td>10 to 30 minutes</td><td>Moderate, more with 4 suits</td><td>Long sessions with adjustable difficulty</td></tr>
<tr><td><a href="pyramid">Pyramid Solitaire</a></td><td>3 to 8 minutes</td><td>A lot: many deals cannot be cleared</td><td>Quick games with simple arithmetic</td></tr>
</tbody></table></div>
<h2>About these games</h2>
<p>Guagua Games is a small independent project by Alvin Li, who also maintains the developer tools at <a href="{MAIN}/">guagua-alvin.top</a>. The games are written from scratch in plain JavaScript with no game engine, so each page loads quickly even on a slow connection. New games are added one at a time, when each is finished properly.</p>
<p class="note">Last updated {UPDATED_TEXT}. Questions or bug reports: <a href="{MAIN}/contact">contact</a>. See the <a href="{MAIN}/privacy">privacy policy</a> for how advertising and local storage work on this site.</p>
</article>
</main>
{FOOTER}
</body>
</html>
""")


def main():
    for p in PAGES:
        (OUT / f"{p['slug']}.html").write_text(game_page(p), encoding="utf-8")
    (OUT / "index.html").write_text(index_page(), encoding="utf-8")
    urls = [BASE] + [BASE + s for s in ["daily-sudoku", "sudoku"] + [f"{k}-sudoku" for k, _ in LEVELS] + ["printable-sudoku", "2048", "minesweeper", "solitaire", "freecell", "spider", "pyramid"]]
    (OUT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                     + "".join(f"  <url><loc>{u}</loc><lastmod>{UPDATED}</lastmod></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n", encoding="utf-8")
    (OUT / "manifest.webmanifest").write_text(json.dumps({
        "name": "Guagua Games", "short_name": "Guagua Games", "description": "Free Sudoku, Minesweeper and card games.",
        "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#f7f5ed", "theme_color": "#f7f5ed",
        "icons": [{"src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png"},
                  {"src": "assets/favicon.svg", "sizes": "any", "type": "image/svg+xml"}],
        "shortcuts": [{"name": "Daily Sudoku", "url": "daily-sudoku"}, {"name": "2048", "url": "2048"}, {"name": "FreeCell", "url": "freecell"}]}, indent=1), encoding="utf-8")
    print(f"built {len(PAGES)} game pages + index, sitemap with {len(urls)} URLs")


if __name__ == "__main__":
    main()
