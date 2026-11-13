---
{
 "order": 5,
 "group": "Debug MCP servers",
 "category": "Authorization",
 "title": "MCP OAuth 401 Troubleshooting: Metadata, Scopes, Audience & PKCE",
 "h1": "Fix an MCP OAuth 401 from the first broken link",
 "description": "Debug a remote MCP server that returns 401: read the WWW-Authenticate challenge, check RFC 9728 protected-resource metadata, authorization-server discovery, the resource parameter, token audience, scopes and PKCE S256.",
 "deck": "A working login page does not prove that an MCP client can discover how to authorize. The flow is a chain of five documents and requests; a 401 means one link is broken. Start at the first response and move forward one link at a time.",
 "published": "2026-07-29",
 "updated": "2026-11-12",
 "tools": [["MCP OAuth Lab", "https://mcpoauth.guagua-alvin.top/"]],
 "related": ["mcp-server-not-connecting", "mcp-stdio-vs-streamable-http", "migrate-mcp-2026"],
 "cta": {"title": "Check the whole metadata chain at once", "text": "Paste the resource URL and the public metadata documents; the validator reports the first identifier that does not line up. No tokens or secrets are needed.", "label": "Open MCP OAuth Lab", "url": "https://mcpoauth.guagua-alvin.top/"},
 "sources": [
  ["MCP specification 2025-11-25: authorization", "https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization"],
  ["RFC 9728: OAuth 2.0 Protected Resource Metadata", "https://www.rfc-editor.org/rfc/rfc9728"],
  ["RFC 8414: OAuth 2.0 Authorization Server Metadata", "https://www.rfc-editor.org/rfc/rfc8414"],
  ["RFC 8707: Resource Indicators for OAuth 2.0", "https://www.rfc-editor.org/rfc/rfc8707"],
  ["RFC 7636: Proof Key for Code Exchange (PKCE)", "https://www.rfc-editor.org/rfc/rfc7636"]
 ],
 "faq": [
  ["Why does my MCP server return 401 even though I logged in successfully?", "Logging in proves the authorization server accepted you. It does not prove the token is valid for the MCP server. The usual causes are a token whose audience does not match the MCP server's resource identifier, a missing scope, an issuer the server does not trust, or an expired token that the client failed to refresh."],
  ["What is the resource_metadata parameter in WWW-Authenticate?", "It is a URL, defined by RFC 9728, pointing to the server's protected-resource metadata document. An MCP client reads it from the 401 response to learn which authorization server protects the resource. If the header is missing, the client falls back to the well-known path derived from the MCP server URL."],
  ["Does an MCP client have to use PKCE?", "Yes. The MCP authorization specification requires PKCE for authorization-code flows and clients use the S256 challenge method. Clients are expected to refuse to proceed if the authorization server's metadata does not advertise PKCE support through <code>code_challenge_methods_supported</code>."],
  ["Do stdio MCP servers use OAuth?", "No. The MCP authorization specification applies to HTTP-based transports. A stdio server runs as a local process and receives credentials from its environment, typically through the <code>env</code> block of the client configuration."]
 ]
}
---
## The chain a client follows

When a client connects to a protected MCP server it does not know in advance where to log in. It discovers that in steps, and each step depends on the one before:

| # | Step | What the client needs | Typical failure |
|---|---|---|---|
| 1 | Unauthenticated request → `401` | A `WWW-Authenticate: Bearer` challenge | No challenge, or a `403`/`302` instead |
| 2 | Protected-resource metadata | `resource` and `authorization_servers` | 404, wrong `resource` value |
| 3 | Authorization-server metadata | Endpoints, PKCE methods, registration options | Issuer mismatch, wrong well-known path |
| 4 | Authorization and token requests | PKCE S256 and the `resource` parameter | Token minted for the wrong audience |
| 5 | Request with the token | Server-side validation | Audience, issuer, scope or expiry rejected |

Debug in that order. Changing token settings while step 2 is broken produces noise, because the client never gets that far.

## Step 1: capture the first 401

Send a request with no credentials and keep the response headers:

```bash
curl -i -X POST https://mcp.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

A server that follows the specification answers like this:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource/mcp", scope="tickets:read"
```

Things to check:

- **The status is 401.** A redirect to an HTML login page, or a 403, gives the client nothing to discover. API gateways and web application firewalls in front of the server often cause this.
- **`resource_metadata` is an absolute HTTPS URL** that you can open from outside your network.
- The optional `scope` value tells the client what to request. If it is present, it should name scopes the authorization server will actually grant.

If the header has no `resource_metadata`, clients fall back to well-known locations. For an MCP endpoint at `https://mcp.example.com/mcp` they try `/.well-known/oauth-protected-resource/mcp` and then `/.well-known/oauth-protected-resource` at the root.

## Step 2: read the protected-resource metadata

Fetch the URL from step 1:

```json
{
  "resource": "https://mcp.example.com/mcp",
  "authorization_servers": ["https://login.example.com"],
  "scopes_supported": ["tickets:read", "tickets:write"],
  "bearer_methods_supported": ["header"]
}
```

- **`resource` must identify the MCP server the client called.** Compare scheme, host, port and path. `http` versus `https`, a trailing slash, or an internal hostname behind a proxy all count as different resources, and a careful client rejects the document.
- **`authorization_servers` must contain the issuer you intend to use.** In multi-tenant identity providers, the wrong tenant URL here sends every user to the wrong login.
- The response should be `application/json` and, for browser-based clients, served with CORS headers that allow a cross-origin GET.

## Step 3: follow the issuer

Take the authorization server URL and fetch its metadata. For an issuer without a path, that is `https://login.example.com/.well-known/oauth-authorization-server`. Clients also try `/.well-known/openid-configuration`. For an issuer with a path such as `https://login.example.com/tenant1`, the well-known segment is inserted before the path: `https://login.example.com/.well-known/oauth-authorization-server/tenant1`.

```json
{
  "issuer": "https://login.example.com",
  "authorization_endpoint": "https://login.example.com/authorize",
  "token_endpoint": "https://login.example.com/token",
  "registration_endpoint": "https://login.example.com/register",
  "code_challenge_methods_supported": ["S256"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"]
}
```

- **`issuer` must equal the URL you used to find the document**, character for character. This is the most common subtle failure: every document loads, but a proxy rewrote the host or added a trailing slash, and the identifiers disagree.
- **`code_challenge_methods_supported` must include `S256`.** If the field is absent, MCP clients are required to stop.
- **The client must be able to register.** The server should support Client ID Metadata Documents (`client_id_metadata_document_supported: true`), or Dynamic Client Registration (a `registration_endpoint`), or the user must supply a pre-registered client ID. With none of the three, a client that has never seen this server cannot proceed, and the visible symptom is often just "the browser never opens".

## Step 4: the authorization and token requests

Two parameters deserve attention in the authorization URL the client opens:

```text
https://login.example.com/authorize?response_type=code
  &client_id=...
  &redirect_uri=http://127.0.0.1:33418/callback
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &resource=https%3A%2F%2Fmcp.example.com%2Fmcp
  &scope=tickets%3Aread
```

- **`resource`** (RFC 8707) tells the authorization server which API the token is for. MCP clients must send it on both the authorization request and the token request. An authorization server that ignores it will issue a token with a default audience, and step 5 will fail.
- **`redirect_uri`** must exactly match a registered value. Desktop clients use a loopback address with a port; some identity providers reject loopback redirects unless the client is registered as a native application.

## Step 5: why a valid token still gets 401

At this point the user has logged in and the client is sending `Authorization: Bearer ...`. If the server still answers 401, decode the token (if it is a JWT) and compare its claims with what the server expects:

| Claim | Must be | Typical mistake |
|---|---|---|
| `aud` | The MCP server's resource identifier | The identity provider's default API audience, or the client ID |
| `iss` | The issuer from step 3 | A different tenant or region |
| `exp` | In the future | Clock skew on the server; client not refreshing |
| `scope` | Includes what the tool needs | Requested scope was silently dropped |

An MCP server must only accept tokens issued for itself. It must not accept a token for another API and must not forward the client's token to upstream services. If your server calls another API, it needs its own credentials for that.

Two status codes are easy to confuse here. `401` means the token is missing, expired or not valid for this server. `403` with `error="insufficient_scope"` means the token is fine but lacks a scope; the client should request more, not log in again.

## Symptom-to-fix matrix

| Symptom | First thing to check |
|---|---|
| The client never opens a browser | Steps 1 to 3: missing challenge, unreachable metadata, or no way to register a client |
| The browser opens, then "invalid redirect_uri" | Loopback redirect not allowed for this client registration |
| Login succeeds, the next call is 401 | Step 5: the `aud` claim. Is the authorization server honouring `resource`? |
| Works for an hour, then 401 until reconnect | Refresh tokens not issued (`offline_access` not granted) or refresh failing |
| Works locally, fails behind a proxy | Metadata advertises an internal host or `http`; fix forwarded-header handling |
| Works in one client, not another | One client supports only DCR or only pre-registration; check which registration methods the server offers |

## Newer requirements to plan for

The 2026-07-28 revision of the specification tightens two things. Clients must validate the `iss` parameter returned on the authorization response against the issuer they started with (RFC 9207), which defends against mix-up attacks; make sure your authorization server sends it. And Client ID Metadata Documents become the preferred registration method, with Dynamic Client Registration deprecated. The [migration guide](/guides/migrate-mcp-2026) lists the other changes.

## Safe debugging checklist

- Save headers and public metadata documents, not live tokens.
- Fix the earliest failing link first.
- Compare identifiers exactly: scheme, host, port, path, trailing slash.
- Confirm `S256` is advertised.
- Confirm the token's `aud` is the MCP server.
- After correcting metadata, clear the client's cached authorization state and reconnect.

> Never paste client secrets, authorization codes or live access tokens into a validator, a chat or an issue tracker. The metadata documents are public by design and are enough to diagnose steps 1 to 3.
