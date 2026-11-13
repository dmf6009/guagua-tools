---
{
 "order": 10,
 "group": "Agents, crawlers and files",
 "category": "AI crawlers",
 "title": "How to Block (or Allow) AI Crawlers in robots.txt: GPTBot, ClaudeBot & More",
 "h1": "Control AI crawlers with robots.txt and Content-Signal",
 "description": "A current list of AI crawler user agents (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot and others), ready-to-copy robots.txt rules, the Content-Signal directive, and what robots.txt cannot do.",
 "deck": "\"Block AI\" is three different decisions: whether your pages may train models, whether they may appear in AI search answers, and whether an assistant may fetch a page when a user asks. Each has its own user agents, and blocking the wrong one removes you from places you wanted to be.",
 "published": "2026-11-12",
 "updated": "2026-11-12",
 "tools": [["CrawlerPolicy", "https://aipolicy.guagua-alvin.top/"]],
 "related": ["write-agents-md", "mcp-config-file-locations"],
 "cta": {"title": "Build the policy instead of typing it", "text": "Choose what each kind of AI crawler may do and get a robots.txt block with matching Content-Signal lines, or paste an existing file to see who it lets in.", "label": "Open CrawlerPolicy", "url": "https://aipolicy.guagua-alvin.top/"},
 "sources": [
  ["RFC 9309: Robots Exclusion Protocol", "https://www.rfc-editor.org/rfc/rfc9309"],
  ["OpenAI: overview of OpenAI crawlers", "https://platform.openai.com/docs/bots"],
  ["Anthropic: does Anthropic crawl data from the web, and how can site owners block the crawler?", "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"],
  ["Google: common crawlers, including Google-Extended", "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers"],
  ["Perplexity: crawlers", "https://docs.perplexity.ai/guides/bots"],
  ["Content Signals", "https://contentsignals.org/"]
 ],
 "faq": [
  ["Does blocking GPTBot remove my site from ChatGPT search?", "No. GPTBot collects content that may be used for training. ChatGPT's search results come from a different crawler, OAI-SearchBot, and pages fetched at a user's request use ChatGPT-User. You can block GPTBot and still allow OAI-SearchBot if you want to appear in search answers without contributing training data."],
  ["Does blocking Google-Extended affect my Google Search ranking?", "No. Google-Extended is a control token, not a separate crawler: it tells Google not to use your content for training Gemini models and for grounding in some Gemini products. It does not affect crawling, indexing or ranking in Google Search, which are governed by Googlebot."],
  ["Is robots.txt legally binding or technically enforced?", "Neither. robots.txt is a voluntary convention, standardised as RFC 9309. Reputable crawlers follow it, but nothing stops a client from ignoring it or sending a false user agent. To enforce a block you need server-side controls such as firewall or bot-management rules."],
  ["Should I use robots.txt or a noindex tag?", "They do different jobs. robots.txt controls whether a crawler may fetch a URL. A <code>noindex</code> meta tag or header controls whether a fetched page may be shown in search results, and it only works if the crawler is allowed to fetch the page and see it. Blocking a URL in robots.txt and adding noindex to it at the same time defeats the noindex."]
 ]
}
---
## Three kinds of AI crawler

Before writing any rules, decide what you are trying to prevent. The companies that run AI products now mostly publish separate user agents for separate purposes:

| Purpose | What it does with your page | If you block it |
|---|---|---|
| **Training** | Collects pages that may be used to train future models | Your content is left out of future training data. No effect on visibility today |
| **AI search** | Builds an index used to cite and link sources in answers | Your site stops being cited in that product's answers |
| **User-triggered fetch** | Fetches one page because a person asked the assistant about it | The assistant tells the user it cannot read your page |

A publisher who wants readers but not uncompensated training would block the first group and allow the other two. A site with private or licensed material might block all three. Blocking everything "just in case" is the choice people most often regret, because it removes a growing source of referral traffic.

## User agents to know

These are the tokens to use after `User-agent:`. Vendors add and rename crawlers, so check the linked documentation before relying on any list, including this one.

| Operator | Training | AI search | User-triggered |
|---|---|---|---|
| OpenAI | `GPTBot` | `OAI-SearchBot` | `ChatGPT-User` |
| Anthropic | `ClaudeBot` | `Claude-SearchBot` | `Claude-User` |
| Perplexity | — | `PerplexityBot` | `Perplexity-User` |
| Google | `Google-Extended` (control token) | covered by `Googlebot` | — |
| Apple | `Applebot-Extended` (control token) | `Applebot` | — |
| Meta | `Meta-ExternalAgent` | — | `Meta-ExternalFetcher` |
| Amazon | `Amazonbot` | — | — |
| ByteDance | `Bytespider` | — | — |
| Common Crawl | `CCBot` | — | — |

Two entries behave differently from the rest. `Google-Extended` and `Applebot-Extended` are not crawlers and never appear in your logs. They are switches read by the company's normal crawler: disallowing them opts your content out of model training while Search continues exactly as before. Common Crawl's `CCBot` is not operated by an AI company, but its public dataset is widely used for training, so it belongs in any training opt-out.

## Copy-and-paste configurations

Place `robots.txt` at the root of each host: `https://example.com/robots.txt`. A file on `www.example.com` does not cover `blog.example.com`.

### Block training, stay visible in AI search

```text
# Training crawlers and training opt-out tokens
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Meta-ExternalAgent
User-agent: Amazonbot
User-agent: Bytespider
User-agent: CCBot
Disallow: /

# Everyone else, including search and user-triggered agents
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

Several `User-agent` lines may share one group of rules. That is part of the standard and keeps the file short.

### Block every AI use

Add the search and user-triggered agents to the same group:

```text
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Meta-ExternalAgent
User-agent: Meta-ExternalFetcher
User-agent: Amazonbot
User-agent: Bytespider
User-agent: CCBot
Disallow: /
```

### Allow AI, but protect part of the site

```text
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: CCBot
Disallow: /members/
Disallow: /drafts/
Allow: /
```

## The rule that surprises people: the most specific group wins

A crawler obeys **only one group**: the one whose `User-agent` matches it most specifically. It does not combine that group with `User-agent: *`.

```text
User-agent: *
Disallow: /admin/

User-agent: GPTBot
Disallow: /drafts/
```

Here GPTBot may crawl `/admin/`, because once it finds its own group it ignores the wildcard group entirely. If a rule should apply to everyone, repeat it in every named group.

Within a group, when an `Allow` and a `Disallow` both match a URL, the longer (more specific) path wins. An empty `Disallow:` means "allow everything", and `Disallow: /` means "allow nothing". Mixing those two up is the classic way to block a whole site by accident.

## Content-Signal: saying how content may be used

robots.txt was designed to answer one question: may you fetch this URL? It has no vocabulary for *what you may do afterwards*. Content Signals, a convention introduced by Cloudflare in 2025, adds a line for that:

```text
User-agent: *
Content-Signal: search=yes, ai-input=no, ai-train=no
Allow: /
```

| Signal | Meaning |
|---|---|
| `search` | Building a search index and showing links and short excerpts |
| `ai-input` | Using the content as input to an AI answer at request time (retrieval, grounding) |
| `ai-train` | Using the content to train or fine-tune models |

Each is `yes` or `no`; leaving one out expresses no preference. The line sits inside a `User-agent` group like any other rule, and parsers that do not know it simply ignore it, so adding it cannot break an existing file. It is a statement of preference rather than a technical control, and how much weight operators give it varies. It is still worth adding, because it states your position in a machine-readable form that an access rule alone cannot.

## What robots.txt cannot do

- **It does not enforce anything.** Compliance is voluntary. Crawlers that ignore the file, or that pretend to be a browser, are stopped only by server-side measures: firewall rules, bot management, rate limiting or authentication.
- **It does not remove what was already collected.** A rule added today affects future crawls.
- **It does not hide content.** The file is public and lists the paths you care about. Do not use it to protect anything sensitive; require a login instead.
- **It does not control indexing.** A blocked URL can still appear in search results as a bare link if other sites point to it. Use `noindex` on a crawlable page to keep it out of results.
- **It does not cover other hosts.** Each subdomain needs its own file.

Where enforcement matters, verify identity rather than trusting the user-agent string. OpenAI, Anthropic, Perplexity and others publish the IP ranges their crawlers use, and a request claiming to be `GPTBot` from an unlisted address is an impostor.

## Test before and after you deploy

1. Fetch the file as a crawler would and check the status is 200 and the type is plain text. A robots.txt that returns an HTML error page, or a 5xx error, is interpreted in ways you will not like: many crawlers treat a server error as "disallow everything".
2. Make sure no CDN or security rule serves a challenge page to bots requesting `/robots.txt` itself.
3. Test specific URLs against specific user agents rather than reading the file by eye. Group selection and path precedence are easy to misjudge.
4. Watch your access logs for a few days. Training crawlers you disallowed should stop requesting pages other than `robots.txt`.

```bash
curl -sI https://example.com/robots.txt | head -n 5
curl -s -A "GPTBot" https://example.com/robots.txt
```

> A policy is a business decision, not a technical one. Before blocking search-oriented agents, look at how much traffic already arrives from AI products; before allowing training crawlers, check any licences that apply to content you publish but do not own.
