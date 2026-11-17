# Guagua Tools

Tool directory for the `guagua-alvin.top` apex domain.

- Production: <https://guagua-alvin.top>
- Cloudflare Pages project: `guagua-tools`
- Production branch: `main`
- Build command: `exit 0`
- Build output directory: `.`

The site is plain static HTML, CSS, and JavaScript. Tool search and category filters run entirely in the browser.

## Practical MCP guides

- [Migrate an MCP server to protocol 2026-07-28](https://guagua-alvin.top/guides/migrate-mcp-2026)
- [Convert Claude Desktop MCP JSON to Codex TOML](https://guagua-alvin.top/guides/claude-mcp-to-codex)
- [Debug an MCP OAuth 401](https://guagua-alvin.top/guides/debug-mcp-oauth-401)
- [Fix an MCP App that opens as a blank panel](https://guagua-alvin.top/guides/fix-mcp-app-blank-ui)
- [Debug an MCP Task stuck in `working`](https://guagua-alvin.top/guides/debug-mcp-task-polling)
- [Prepare `server.json` for the MCP Registry](https://guagua-alvin.top/guides/publish-mcp-registry-server)

## Guides

Guide pages are generated. Edit the Markdown in `content/guides/` (JSON front matter between `---` lines), then run:

```bash
pip install markdown
python3 scripts/build-guides.py   # writes guides/*.html, guides/index.html and sitemap.xml
python3 scripts/sync-chrome.py    # only after changing the shared header/footer
```

Commit the generated HTML: the Pages build command is `exit 0`, so nothing is built on deploy.

## Games

Served at https://games.guagua-alvin.top/ from the `/games/` directory; `ops/worker-proxy.js` maps the host onto it, so every link inside `/games/` is relative.

| Page | Script |
|---|---|
| `sudoku`, `daily-sudoku`, `easy-sudoku`, `medium-sudoku`, `hard-sudoku`, `expert-sudoku` | `games/assets/sudoku-core.js` + `sudoku.js` (mode set by `window.GG_SUDOKU`) |
| `printable-sudoku` | `games/assets/sudoku-core.js` + `printable.js` |
| `2048` | `games/assets/2048.js` |
| `pyramid` | `games/assets/cards.js` + `pyramid.js` |
| `minesweeper` | `games/assets/minesweeper.js` |
| `solitaire` (Klondike) | `games/assets/solitaire.js` |
| `freecell` | `games/assets/cards.js` + `freecell.js` (Windows-compatible numbered deals) |
| `spider` | `games/assets/cards.js` + `spider.js` |

`games/assets/common.js` handles the post-game panel and result sharing on every page.

Page text lives in `content/games/*.md`; titles, FAQs and markup live in `scripts/build-games.py`. Rebuild with:

```bash
python3 scripts/build-games.py    # writes games/*.html, games/sitemap.xml, games/robots.txt, games/manifest.webmanifest
```

The daily Sudoku is generated from the date with a seeded random generator, so changing the generator in `sudoku.js` changes every past and future daily puzzle. Puzzle #1 is 1 January 2026; the page links to the last 30 days through `daily-sudoku?d=YYYY-MM-DD`.

The worker also redirects `guagua-alvin.top/games/*` to the subdomain; that part takes effect the next time the worker is deployed (`cd ops && npx wrangler deploy`).
