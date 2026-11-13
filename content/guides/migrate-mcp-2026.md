---
{
 "order": 8,
 "group": "Build and publish MCP servers",
 "category": "Protocol upgrade",
 "title": "MCP 2026-07-28 Migration Guide: Stateless Requests Without initialize",
 "h1": "Migrate an MCP server to the stateless 2026-07-28 protocol",
 "description": "What the MCP 2026-07-28 specification removes and adds: no initialize handshake, no Mcp-Session-Id, server/discover, per-request _meta, Mcp-Method and Mcp-Name headers, input_required results, cacheable lists, and a step-by-step migration plan.",
 "deck": "The 2026-07-28 revision is the largest change to MCP since Streamable HTTP. Sessions and the handshake are gone, every request describes itself, and several long-standing features are deprecated. Here is what changed and an order of work that keeps older clients running.",
 "published": "2026-07-28",
 "updated": "2026-11-12",
 "tools": [["MCP 2026 Stateless Check", "https://mcp2026.guagua-alvin.top/"], ["MCP Task Trace", "https://mcptasks.guagua-alvin.top/"]],
 "related": ["mcp-stdio-vs-streamable-http", "debug-mcp-task-polling", "debug-mcp-oauth-401"],
 "cta": {"title": "Check a captured request against the new rules", "text": "Paste a request, its HTTP headers and the response. The checker verifies the per-request metadata, header and body agreement, and flags leftover session and handshake usage.", "label": "Open MCP 2026 Stateless Check", "url": "https://mcp2026.guagua-alvin.top/"},
 "sources": [
  ["The 2026-07-28 MCP specification release candidate (MCP blog)", "https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/"],
  ["Model Context Protocol specification", "https://modelcontextprotocol.io/specification/latest"],
  ["MCP went stateless: what changed in the 2026-07-28 spec (WorkOS)", "https://workos.com/blog/mcp-stateless-spec-2026-07-28"],
  ["RFC 9207: OAuth 2.0 Authorization Server Issuer Identification", "https://www.rfc-editor.org/rfc/rfc9207"]
 ],
 "faq": [
  ["Is the MCP initialize handshake removed?", "Yes. The 2026-07-28 specification removes the <code>initialize</code> request and the <code>notifications/initialized</code> notification. A client can send a normal request such as <code>tools/list</code> as its first message, with its protocol version and capabilities carried in the request's <code>_meta</code>. Servers still need to answer <code>initialize</code> for as long as they support clients on older protocol versions."],
  ["What replaces Mcp-Session-Id?", "Nothing at the protocol level. The session header and protocol sessions are removed. If a workflow needs state across calls, the server returns an explicit handle, such as a cart ID or a task ID, and the client passes it back as an ordinary argument. Authentication identifies the user; the handle identifies the state."],
  ["Do I have to migrate immediately?", "No. Protocol versions are negotiated per request, so a server can support 2025-11-25 and 2026-07-28 side by side, and the official SDKs are designed to do that. The features that were deprecated rather than removed (Roots, Sampling, Logging, HTTP+SSE and Dynamic Client Registration) remain usable for at least twelve months."],
  ["What is server/discover?", "<code>server/discover</code> is a request that returns the server's supported protocol versions, capabilities and identity. Servers must implement it. Clients may call it when they want that information up front, but it is not a handshake: it negotiates nothing and creates no state."]
 ]
}
---
## What changed, at a glance

The release candidate was locked in May 2026, with the final specification dated 28 July 2026. Its central idea is that an MCP server should be able to run like any stateless HTTP service: any instance can answer any request, with nothing remembered between them.

| Area | Before (2025-11-25) | 2026-07-28 |
|---|---|---|
| Connection setup | `initialize` request, then `notifications/initialized` | Removed. The first message can be any request |
| Sessions | `Mcp-Session-Id` header | Removed |
| Version and capabilities | Negotiated once in the handshake | Sent in `_meta` on every request |
| Discovery | Returned by `initialize` | `server/discover`, optional for clients |
| Server asks the user or model something mid-call | Server-initiated request over an open SSE stream | The result says `input_required`; the client retries with answers |
| Change notifications | Standalone GET stream, `resources/subscribe` | One `subscriptions/listen` stream |
| List freshness | Notifications only | `ttlMs` and `cacheScope` on list results |
| Tasks | Experimental core feature | Extension `io.modelcontextprotocol/tasks` |
| HTTP routing | Body only | `Mcp-Method` and `Mcp-Name` headers required |

## Every request describes itself

Without a handshake, the information that used to be exchanged once travels with each request in reserved `_meta` keys:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "search_tickets",
    "arguments": { "query": "refund" },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": { "name": "example-client", "version": "3.2.0" },
      "io.modelcontextprotocol/clientCapabilities": { "extensions": {} }
    }
  }
}
```

The server replies with `io.modelcontextprotocol/serverInfo` in the result's `_meta`. If it does not support the requested version it returns an unsupported-protocol-version error, and the client can pick another version, using `server/discover` to see which are offered.

One consequence is easy to overlook: because nothing is negotiated per connection, **the tool, prompt and resource lists can no longer differ per connection**. If your server shows different tools to different callers, that decision must be based on something in the request, normally the authenticated identity.

## Three headers on every HTTP request

Over Streamable HTTP, each POST repeats the essentials in headers so that gateways, rate limiters and logs do not need to parse JSON:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: search_tickets
```

`Mcp-Method` is the JSON-RPC method and `Mcp-Name` is the target, such as the tool name. The headers must agree with the body; a server rejects a request where they differ. That check matters for security: without it, a gateway could authorize one tool by header while the body calls another.

## Results carry a resultType

Every result now includes `resultType`. Ordinary results use `"complete"`. A client talking to an older server should treat a missing value as `"complete"`.

The other value replaces server-initiated requests. Previously, a server that needed to ask the user a question during a tool call sent `elicitation/create` over an open stream and waited. Now it finishes the HTTP exchange and says what it needs:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "confirm_refund": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Refund $240 to the original card?",
          "requestedSchema": {
            "type": "object",
            "properties": { "confirm": { "type": "boolean" } },
            "required": ["confirm"]
          }
        }
      }
    },
    "requestState": "opaque-integrity-protected-string"
  }
}
```

The client collects the answers and sends the original call again, as a new request with a new JSON-RPC `id`, including `inputResponses` (a map with the same keys as `inputRequests`) and the exact `requestState` it was given. Because the state travels with the request, any server instance can handle the retry. The specification calls this pattern Multi Round-Trip Requests, and allows it on `tools/call`, `prompts/get` and `resources/read` only.

Two rules matter for server authors. Only ask for input types the client declared support for in its capabilities. And treat a returned `requestState` as attacker-controlled: if it influences authorization or business logic, protect it with an HMAC or authenticated encryption, bind it to the authenticated user and the original request, give it a short expiry, and reject anything that fails verification.

## Lists become cacheable

`tools/list`, `prompts/list`, `resources/list`, `resources/templates/list` and `resources/read` results gain two fields: `ttlMs`, how long the result may be considered fresh, and `cacheScope`, either `"public"` or `"private"`. A client no longer needs a permanently open stream just to learn that a list changed.

Return tools in a stable order. Clients place tool definitions in the model's prompt, and a list that reorders itself between calls defeats prompt caching.

## What is removed outright

These are gone in 2026-07-28 with no deprecation period:

- `initialize` and `notifications/initialized`
- The `Mcp-Session-Id` header and protocol sessions
- SSE resumability: `Last-Event-ID` and event IDs. If a stream breaks, the in-flight request is lost and the client sends it again
- The standalone HTTP GET stream, `resources/subscribe` and `resources/unsubscribe`, replaced by `subscriptions/listen`
- `ping` and `logging/setLevel`
- `tasks/list` and `tasks/result` from the Tasks design

The loss of resumability changes how you should write tools. A client that never saw the response will retry, so **a tool with side effects needs to be idempotent**: accept an idempotency key as an argument, or make the operation safe to repeat.

## What is deprecated but still works

A new lifecycle policy guarantees at least twelve months between deprecation and removal, so the earliest these can disappear is July 2027:

| Deprecated | Suggested replacement |
|---|---|
| Roots | Pass paths as tool arguments, resource URIs or server configuration |
| Sampling | Call a model provider's API directly from the server |
| Logging over the protocol | stderr for stdio servers; OpenTelemetry for structured telemetry |
| HTTP+SSE transport | Streamable HTTP |
| OAuth Dynamic Client Registration | Client ID Metadata Documents |

## Smaller changes that break real code

- **Resource not found** now uses JSON-RPC code `-32602` (invalid params) instead of the custom `-32002`. Clients that compare against the literal old code need updating.
- **Tool schemas** use full JSON Schema 2020-12 for `inputSchema` and `outputSchema`. Implementations must not automatically fetch external `$ref` URIs.
- **Authorization:** clients must validate the `iss` parameter on the authorization response (RFC 9207), keep credentials separate per issuer, and send `application_type` when they do use Dynamic Client Registration. See the [OAuth 401 guide](/guides/debug-mcp-oauth-401).
- **Extensions** are negotiated through an `extensions` map in client and server capabilities. Tasks and MCP Apps are both extensions now.

## A migration order that keeps old clients working

Upgrade the SDK first; the Tier 1 SDKs handle both protocol generations and answer by the version each request declares. Then work through your own code:

1. **Find everything keyed by session.** Search for `Mcp-Session-Id`, session maps and per-connection caches. Move user identity to the authorization layer and workflow state to explicit handles that the server issues and the client passes back.
2. **Make the tool list a function of the request.** Remove anything that tailors `tools/list` during the handshake.
3. **Implement `server/discover`**, and keep answering `initialize` for older clients.
4. **Set `resultType`** on every result your own code constructs.
5. **Rewrite mid-call questions** from server-initiated elicitation or sampling to the `input_required` flow.
6. **Validate the new headers** and reject header and body mismatches. Update any gateway rules to use them.
7. **Add `ttlMs` and `cacheScope`**, and sort lists deterministically.
8. **Make side-effecting tools idempotent.**
9. **Move Tasks code** to the extension: no `tasks/list`, no `tasks/result`. The [task debugging guide](/guides/debug-mcp-task-polling) has the mapping.
10. **Plan the deprecations**: Roots, Sampling, protocol logging and DCR.

## Testing both generations

Run two kinds of client against the same deployment: one that still performs `initialize` and sends `Mcp-Session-Id`, and one that sends a bare 2026-07-28 `tools/call` as its very first request. Then test the property the release was designed for: put two instances behind a load balancer with no session affinity and confirm that a multi-step interaction, including an `input_required` round trip, succeeds when each step lands on a different instance.

> This page summarises the published changes and is not a substitute for the specification. Field names and required behaviour should be confirmed against the specification and your SDK's release notes before you ship.
