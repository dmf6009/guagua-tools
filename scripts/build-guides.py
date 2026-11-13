#!/usr/bin/env python3
"""Build /guides/*.html, /guides/index.html and sitemap.xml from content/guides/*.md.

Usage:  python3 scripts/build-guides.py
Needs:  pip install markdown

Each source file starts with a JSON front matter block between two lines of '---'.
The generated HTML is committed, because the Cloudflare Pages build command is `exit 0`.
"""
import json, re, html, pathlib, datetime
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "guides"
OUT = ROOT / "guides"
SITE = "https://guagua-alvin.top"
ADS = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3191558815455000" crossorigin="anonymous"></script>'
AUTHOR = "Alvin Li"

NAV = ('<nav aria-label="Main navigation"><a href="/mcp-tools">MCP tools</a><a href="/ai-agent-tools">Agent tools</a>'
       '<a href="/guides/">Guides</a><a href="/agents/">Agent skills</a><a href="/about">About</a></nav>')
HEADER = ('<header class="site-header"><a class="brand" href="/" aria-label="Guagua Tools home">'
          '<span class="brand-mark" aria-hidden="true">G</span><span>GUAGUA <b>TOOLS</b></span></a>' + NAV + '</header>')
FOOTER = ('<footer><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">G</span><span>GUAGUA <b>TOOLS</b></span></a>'
          '<p>Free MCP, AI agent and developer tools, with the guides to use them.</p>'
          '<div><a href="/mcp-tools">MCP tools</a><a href="/guides/">Guides</a><a href="/agents/">Agent skills</a>'
          '<a href="/testing-methodology">Testing method</a><a href="https://github.com/dmf6009/guagua-tools" rel="noopener">GitHub</a><a href="/sitemap.xml">Sitemap</a></div>'
          '<div class="trust-links" aria-label="Site policies"><a href="/about">About</a><a href="/contact">Contact</a>'
          '<a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/cookies">Cookies</a></div></footer>')


def esc(s):
    return html.escape(s, quote=True)


def long_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def load(path):
    raw = path.read_text(encoding="utf-8")
    _, fm, body = raw.split("---\n", 2)
    meta = json.loads(fm)
    meta["slug"] = path.stem
    md = markdown.Markdown(extensions=["tables", "fenced_code", "toc", "sane_lists"],
                           extension_configs={"toc": {"toc_depth": "2-2"}})
    body_html = md.convert(body)
    body_html = body_html.replace("<table>", '<div class="guide-table-wrap"><table class="guide-table">').replace("</table>", "</table></div>")
    body_html = body_html.replace("<blockquote>", '<div class="guide-callout">').replace("</blockquote>", "</div>")
    body_html = re.sub(r"<pre><code[^>]*>", "<pre><code>", body_html)
    meta["toc"] = [(t["id"], t["name"]) for t in md.toc_tokens]
    meta["words"] = len(re.sub(r"<[^>]+>", " ", body_html).split())
    meta["minutes"] = max(3, round(meta["words"] / 200))
    meta["html"] = body_html
    return meta


def render(g, all_guides):
    url = f"{SITE}/guides/{g['slug']}"
    faq_html = ""
    graph = [
        {"@type": "TechArticle", "@id": url + "#article", "headline": g["h1"], "description": g["description"],
         "datePublished": g["published"], "dateModified": g["updated"], "inLanguage": "en",
         "mainEntityOfPage": url, "wordCount": g["words"],
         "author": {"@type": "Person", "name": AUTHOR, "url": SITE + "/about"},
         "publisher": {"@type": "Organization", "name": "Guagua Tools", "url": SITE + "/",
                       "logo": {"@type": "ImageObject", "url": SITE + "/assets/favicon.svg"}},
         "image": SITE + "/assets/social-card.svg"},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Guagua Tools", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Guides", "item": SITE + "/guides/"},
            {"@type": "ListItem", "position": 3, "name": g["h1"], "item": url}]},
    ]
    if g.get("faq"):
        items = "".join(f"<h3>{esc(q)}</h3><p>{a}</p>" for q, a in g["faq"])
        faq_html = f'<section class="guide-faq" id="faq"><h2>Frequently asked questions</h2>{items}</section>'
        graph.append({"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)}}
            for q, a in g["faq"]]})
    toc = "".join(f'<li><a href="#{i}">{n}</a></li>' for i, n in g["toc"])
    if g.get("faq"):
        toc += '<li><a href="#faq">FAQ</a></li>'
    tools = "".join(f'<a href="{esc(u)}">{esc(n)}</a>' for n, u in g.get("tools", []))
    aside = f'<aside class="guide-aside"><nav class="guide-toc" aria-label="On this page"><strong>On this page</strong><ol>{toc}</ol></nav>'
    if tools:
        aside += f'<div class="guide-aside-tools"><strong>Free tool for this guide</strong>{tools}</div>'
    aside += "</aside>"
    related = [x for x in all_guides if x["slug"] in g.get("related", [])]
    rel_html = ""
    if related:
        rel_html = '<section class="guide-related"><h2>Keep reading</h2><ul>' + "".join(
            f'<li><a href="/guides/{r["slug"]}">{esc(r["h1"])}</a><span>{esc(r["description"])}</span></li>' for r in related) + "</ul></section>"
    cta = ""
    if g.get("cta"):
        c = g["cta"]
        cta = f'<div class="guide-next"><h3>{esc(c["title"])}</h3><p>{esc(c["text"])}</p><a href="{esc(c["url"])}">{esc(c["label"])} →</a></div>'
    sources = ""
    if g.get("sources"):
        sources = '<section class="guide-sources"><h2>Sources and further reading</h2><ul>' + "".join(
            f'<li><a href="{esc(u)}" rel="noopener">{esc(n)}</a></li>' for n, u in g["sources"]) + "</ul></section>"
    author = (f'<section class="guide-author"><p><strong>Written and maintained by {AUTHOR}</strong>, the developer behind Guagua Tools. '
              f'First published {long_date(g["published"])}; last reviewed {long_date(g["updated"])}. '
              'Found an error or an outdated detail? <a href="/contact">Report it</a> and it will be corrected. '
              'How pages are checked is described in the <a href="/testing-methodology">testing method</a>.</p></section>')
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(g['title'])}</title>
<meta name="description" content="{esc(g['description'])}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="author" content="{AUTHOR}">
<meta name="theme-color" content="#f7f5ed">
<link rel="canonical" href="{url}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
{ADS}
<meta property="og:type" content="article">
<meta property="og:site_name" content="Guagua Tools">
<meta property="og:title" content="{esc(g['title'])}">
<meta property="og:description" content="{esc(g['description'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/social-card.svg">
<meta property="article:published_time" content="{g['published']}">
<meta property="article:modified_time" content="{g['updated']}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{ld}</script>
</head>
<body>
<a class="skip-link" href="#content">Skip to content</a>
{HEADER}
<main class="guide-page" id="content">
<p class="breadcrumbs"><a href="/">Guagua Tools</a> / <a href="/guides/">Guides</a> / {esc(g['category'])}</p>
<header class="guide-head">
<p class="eyebrow"><span></span> {esc(g['category'])}</p>
<h1>{esc(g['h1'])}</h1>
<p class="guide-deck">{esc(g['deck'])}</p>
<p class="guide-meta">By {AUTHOR} · Updated <time datetime="{g['updated']}">{long_date(g['updated'])}</time> · {g['minutes']} min read</p>
</header>
<div class="guide-layout">
{aside}
<article class="guide-body">
{g['html']}
{faq_html}
{cta}
{sources}
{rel_html}
{author}
</article>
</div>
</main>
{FOOTER}
</body>
</html>
"""


def render_index(guides):
    cats = {}
    for g in guides:
        cats.setdefault(g["group"], []).append(g)
    order = ["Set up and configure MCP", "Debug MCP servers", "Build and publish MCP servers", "Agents, crawlers and files"]
    sections = ""
    for name in order + [c for c in cats if c not in order]:
        if name not in cats:
            continue
        cards = "".join(
            f'<a href="/guides/{g["slug"]}"><small>{esc(g["category"])} · {g["minutes"]} min</small><h3>{esc(g["h1"])}</h3>'
            f'<p>{esc(g["description"])}</p><b>Read the guide →</b></a>' for g in cats[name])
        sections += f'<section class="guide-group"><h2>{esc(name)}</h2><div class="case-grid">{cards}</div></section>'
    ld = json.dumps({"@context": "https://schema.org", "@graph": [
        {"@type": ["CollectionPage", "ItemList"], "name": "MCP and AI agent guides", "url": SITE + "/guides/",
         "numberOfItems": len(guides), "itemListElement": [
             {"@type": "ListItem", "position": i + 1, "name": g["h1"], "url": f"{SITE}/guides/{g['slug']}"} for i, g in enumerate(guides)]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Guagua Tools", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Guides", "item": SITE + "/guides/"}]}]}, ensure_ascii=False)
    desc = "Practical guides for the Model Context Protocol and AI agents: config file locations, connection errors, OAuth 401s, transports, the 2026 stateless migration, Registry publishing, AGENTS.md and AI crawler rules."
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCP &amp; AI Agent Guides: Setup, Debugging and Publishing | Guagua Tools</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="theme-color" content="#f7f5ed">
<link rel="canonical" href="{SITE}/guides/">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
{ADS}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Guagua Tools">
<meta property="og:title" content="MCP &amp; AI Agent Guides | Guagua Tools">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{SITE}/guides/">
<meta property="og:image" content="{SITE}/assets/social-card.svg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{ld}</script>
</head>
<body>
<a class="skip-link" href="#content">Skip to content</a>
{HEADER}
<main class="hub-page guides-index" id="content">
<p class="breadcrumbs"><a href="/">Guagua Tools</a> / Guides</p>
<section class="hub-hero"><p class="eyebrow"><span></span> {len(guides)} practical guides</p>
<h1>Guides for MCP <em>and AI agents.</em></h1>
<p>Each guide starts from something you can see — a config file that is not being read, a server that will not connect, a 401, a blank panel, a rejected listing — and works toward the fix with exact file paths, field names and commands. Every page names the specification or documentation it was checked against and the date it was last reviewed.</p></section>
{sections}
<section class="hub-copy"><h2>How these guides are written</h2>
<p>The guides are written by the maintainer of the tools on this site, while building and testing those tools against real client configurations and the published protocol documents. They are not generated from keyword lists and they do not republish vendor documentation: where a rule comes from a specification, the page links to it; where something is a practical recommendation rather than a requirement, the page says so.</p>
<p>The Model Context Protocol changes quickly. Each guide shows its last review date, and corrections are welcome through the <a href="/contact">contact page</a>. The <a href="/testing-methodology">testing method</a> explains how examples are checked and what a passing check does and does not mean.</p></section>
</main>
{FOOTER}
</body>
</html>
"""


def build_sitemap(guides):
    old = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    entries = dict(re.findall(r"<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>", old))
    overrides_path = ROOT / "content" / "sitemap-lastmod.json"
    if overrides_path.exists():
        for k, v in json.loads(overrides_path.read_text()).items():
            entries[SITE + k] = v
    entries = {k: v for k, v in entries.items() if "/guides/" not in k}
    newest = max(g["updated"] for g in guides)
    entries[SITE + "/guides/"] = newest
    for g in guides:
        entries[f"{SITE}/guides/{g['slug']}"] = g["updated"]

    def rank(u):
        p = u[len(SITE):]
        if p == "/":
            return (0, p)
        if p.startswith("/guides"):
            return (2, p)
        if p.startswith("/labs"):
            return (3, p)
        if p.startswith("/agents"):
            return (4, p)
        if p in ("/privacy", "/terms", "/cookies", "/contact", "/about", "/testing-methodology"):
            return (5, p)
        return (1, p)
    body = "".join(f"  <url><loc>{u}</loc><lastmod>{entries[u]}</lastmod></url>\n" for u in sorted(entries, key=rank))
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "</urlset>\n", encoding="utf-8")
    return len(entries)


def main():
    guides = sorted((load(p) for p in SRC.glob("*.md")), key=lambda g: g["order"])
    OUT.mkdir(exist_ok=True)
    for g in guides:
        (OUT / f"{g['slug']}.html").write_text(render(g, guides), encoding="utf-8")
        print(f"{g['words']:5d} words  guides/{g['slug']}.html")
    (OUT / "index.html").write_text(render_index(guides), encoding="utf-8")
    n = build_sitemap(guides)
    print(f"{len(guides)} guides, sitemap has {n} URLs")


if __name__ == "__main__":
    main()
