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

`/games/` holds three browser games (Sudoku, Minesweeper, Klondike Solitaire). Game logic is in `games/assets/*.js`; the pages are generated from `content/games/*.md` and the markup in `scripts/build-games.py`:

```bash
python3 scripts/build-games.py && python3 scripts/build-guides.py
```

Links inside `/games/` are relative so the same files can be served at `games.guagua-alvin.top`. `ops/worker-proxy.js` already maps that host to the `/games/` directory; it takes effect after a proxied DNS record for `games` exists and the worker is redeployed (`cd ops && npx wrangler deploy`). After that, change `BASE` in `build-games.py` to the subdomain and rebuild so canonical URLs move.
