---
{
 "order": 3,
 "group": "Set up and configure MCP",
 "category": "Transports",
 "title": "MCP Transports Explained: stdio vs Streamable HTTP vs SSE",
 "h1": "MCP transports: stdio, Streamable HTTP and the old SSE transport",
 "description": "How MCP's stdio and Streamable HTTP transports work, why HTTP+SSE was deprecated, which one to choose for a local or remote server, and how each appears in client config files.",
 "deck": "A transport is only the pipe that carries JSON-RPC messages, but picking the wrong one is behind most 'it works on my machine' MCP problems. Here is what each transport does on the wire, when to use it, and how to recognise a mismatch.",
 "published": "2026-11-12",
 "updated": "2026-11-12",
 "tools": [["MCP Config Lab", "https://mcp.guagua-alvin.top/"], ["MCP 2026 Stateless Check", "https://mcp2026.guagua-alvin.top/"]],
 "related": ["mcp-config-file-locations", "mcp-server-not-connecting", "migrate-mcp-2026"],
 "cta": {"title": "Moving a server between clients?", "text": "Convert stdio and remote entries between Claude, Cursor, VS Code, Codex and Gemini formats without retyping them.", "label": "Open MCP Config Lab", "url": "https://mcp.guagua-alvin.top/"},
 "sources": [
  ["MCP specification 2025-11-25: transports", "https://modelcontextprotocol.io/specification/2025-11-25/basic/transports"],
  ["MCP specification 2024-11-05: HTTP with SSE transport", "https://modelcontextprotocol.io/specification/2024-11-05/basic/transports"],
  ["The 2026-07-28 MCP specification release candidate", "https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/"]
 ],
 "faq": [
  ["Is SSE deprecated in MCP?", "The standalone HTTP+SSE transport from the 2024-11-05 specification is deprecated and was replaced by Streamable HTTP in the 2025-03-26 revision. Server-Sent Events still exist inside Streamable HTTP as an optional way to stream a response, so 'SSE' as a technique is not gone; the two-endpoint transport built on it is."],
  ["Which MCP transport should I use?", "Use stdio when the server runs on the same machine as the client and needs local access such as files, a local database or a CLI. Use Streamable HTTP when the server is a hosted service, must serve several users, or needs OAuth. Do not build new servers on the deprecated HTTP+SSE transport."],
  ["Can one MCP server support both stdio and HTTP?", "Yes. The official SDKs separate the server logic from the transport, so the same tools can be exposed over stdio for local installs and over Streamable HTTP for hosted use. Many published servers choose the transport from a command-line flag or an environment variable."],
  ["Why do I get a 405 Method Not Allowed from an MCP server?", "A 405 usually means a transport mismatch. A Streamable HTTP client sends a POST to the MCP endpoint, while an old SSE server expects a GET on its <code>/sse</code> endpoint, or the reverse. Check which transport the server implements and use the matching URL and client setting."]
 ]
}
---
## The short version

The Model Context Protocol defines messages (JSON-RPC 2.0 requests, responses and notifications) separately from how they travel. The specification standardises two transports:

| Transport | Where the server runs | How messages travel | Status |
|---|---|---|---|
| **stdio** | A child process on the same machine | Newline-delimited JSON on stdin and stdout | Current |
| **Streamable HTTP** | Anywhere reachable by URL | HTTP POST to one endpoint; the reply is JSON or an SSE stream | Current |
| HTTP+SSE | Anywhere reachable by URL | A long-lived `GET /sse` stream plus a separate POST endpoint | Deprecated since 2025-03-26 |

If the server touches things on your computer, choose stdio. If it is a service other people connect to, choose Streamable HTTP.

## stdio: the client starts the server

With stdio, the client launches the server as a subprocess using the `command` and `args` from its config. It then writes JSON-RPC messages to the process's standard input and reads replies from its standard output. Each message is a single line of JSON; messages must not contain embedded newlines.

```json
{
  "mcpServers": {
    "tickets": {
      "command": "npx",
      "args": ["-y", "@example/ticket-server"],
      "env": { "TICKET_TOKEN": "${TICKET_TOKEN}" }
    }
  }
}
```

Three properties follow from that design:

- **No network, no port, no authentication layer.** The server inherits the trust of the user who started the client. That is convenient and it is also the main security consideration: a stdio server runs with your permissions.
- **stdout belongs to the protocol.** Anything else printed there corrupts the stream. Logs go to stderr. This single rule explains a large share of failed connections; the [connection troubleshooting guide](/guides/mcp-server-not-connecting) covers it.
- **One client, one process.** Each client starts its own copy. Two editors using the same server run two processes with separate state.

Credentials for a stdio server come from the environment, which is why config files have an `env` block. The MCP authorization specification (OAuth) does not apply to stdio.

## Streamable HTTP: one endpoint, optional streaming

Streamable HTTP was introduced in the 2025-03-26 specification. The server exposes a single path, conventionally `/mcp`, and the client sends every JSON-RPC message as an HTTP POST to it.

```http
POST /mcp HTTP/1.1
Host: mcp.example.com
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2025-11-25

{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

The `Accept` header lists both content types because the server may answer in either of two ways:

- `Content-Type: application/json` — one response body, then the connection closes. This is enough for most tool calls.
- `Content-Type: text/event-stream` — a Server-Sent Events stream on which the server can send progress notifications and then the final response.

That choice is what "streamable" means: streaming is available when a request needs it and absent when it does not, so a simple server can be an ordinary stateless HTTP handler.

In client config files a remote server is an entry with a URL instead of a command. The field name varies by client: `url` in Claude Code, Cursor and Codex, `"type": "http"` plus `url` in VS Code, `serverUrl` in Windsurf and `httpUrl` in Gemini CLI. The [config file reference](/guides/mcp-config-file-locations) has an example for each.

Because the server is on the network, it needs real access control. The specification's authorization model is OAuth 2.1 with protected-resource metadata, and servers must also validate the `Origin` header to defend local HTTP servers against DNS rebinding. A local development server should bind to `127.0.0.1`, not `0.0.0.0`.

## Sessions, and what changes in 2026-07-28

In the 2025 revisions, a Streamable HTTP server could assign a session during initialization by returning an `Mcp-Session-Id` header, which the client then echoed on every request. Sessions made load balancing awkward, because every request had to reach the instance that remembered the session.

The 2026-07-28 specification removes protocol-level sessions and the `initialize` handshake. Each request carries its own protocol version and client information, and Streamable HTTP requests add `Mcp-Method` and `Mcp-Name` headers so that gateways can route and rate-limit without parsing the body. If you operate a remote server, read the [stateless migration guide](/guides/migrate-mcp-2026) before relying on session state.

## The old HTTP+SSE transport

The original remote transport, defined in the 2024-11-05 specification, used two endpoints:

1. The client opened `GET /sse` and kept it open. The first event told the client which URL to POST to.
2. The client sent requests by POST to that second URL, and received all responses on the open SSE stream.

It worked, but it required a permanently open connection per client, could not be served from typical serverless platforms, and lost in-flight responses when the stream dropped. Streamable HTTP replaced it. Many servers still expose an `/sse` endpoint for older clients, and client documentation often still shows a separate "SSE" option, which is why the two get confused.

You can usually tell which one a server speaks from its URL and behaviour:

| Clue | Transport |
|---|---|
| URL ends in `/sse`; a browser GET stays open and prints `event: endpoint` | HTTP+SSE (deprecated) |
| URL ends in `/mcp`; a GET returns 405 or opens an optional stream; POST returns JSON | Streamable HTTP |

## Choosing a transport

| Situation | Use | Why |
|---|---|---|
| Reads local files, runs local commands, talks to a local database | stdio | Needs local access; no network exposure |
| A hosted API you offer to customers | Streamable HTTP | One deployment, OAuth, scales horizontally |
| An internal company tool for many employees | Streamable HTTP | Central updates and central access control |
| A quick personal script | stdio | Nothing to deploy |
| A client that only supports stdio must reach a remote server | stdio bridge | A small proxy such as `mcp-remote` runs locally and forwards to the URL |

The last row is common in practice. A bridge is configured as a stdio server whose arguments contain the remote URL:

```json
{ "command": "npx", "args": ["-y", "mcp-remote", "https://mcp.example.com/mcp"] }
```

## Recognising a transport mismatch

- **405 Method Not Allowed** — POST sent to an SSE-only endpoint, or GET sent to a server that does not offer a stream.
- **404 Not Found** — the base URL was configured without the `/mcp` or `/sse` path.
- **The connection opens and nothing ever arrives** — a Streamable HTTP client waiting on an SSE server's `endpoint` event, or a proxy buffering the event stream. Reverse proxies must disable response buffering for `text/event-stream`.
- **400 Bad Request mentioning the protocol version** — the `MCP-Protocol-Version` header is missing or names a revision the server does not support.
- **Works locally, fails behind a load balancer** — session affinity. Requests carrying an `Mcp-Session-Id` are reaching an instance that never issued it.

> Deprecated does not mean switched off. HTTP+SSE servers still run and many clients still connect to them, but new work should target Streamable HTTP, and anything you publish should say clearly which transport and which URL it expects.
