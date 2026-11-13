---
{
 "order": 6,
 "group": "Debug MCP servers",
 "category": "MCP Apps",
 "title": "MCP App Shows a Blank Panel? Check ui:// Resource, MIME Type & CSP",
 "h1": "Fix an MCP App that opens as a blank panel",
 "description": "Debug a blank MCP Apps UI: verify _meta.ui.resourceUri, the ui:// resource, the text/html;profile=mcp-app MIME type, the default sandbox CSP, connectDomains and resourceDomains, and the ui/initialize handshake.",
 "deck": "The tool returns data, but the embedded interface is empty. Stop debugging the business logic. A blank panel is a broken link somewhere between the tool descriptor, the UI resource, the sandbox policy and the app's first message to the host.",
 "published": "2026-07-29",
 "updated": "2026-11-12",
 "tools": [["MCP App Ready", "https://mcpapps.guagua-alvin.top/"]],
 "related": ["mcp-server-not-connecting", "debug-mcp-task-polling", "migrate-mcp-2026"],
 "cta": {"title": "Validate the whole app contract", "text": "Paste the tool descriptor, the resource response and the HTML. The checker correlates the URI, MIME type, visibility and CSP that are easy to misread in separate logs.", "label": "Open MCP App Ready", "url": "https://mcpapps.guagua-alvin.top/"},
 "sources": [
  ["MCP Apps overview", "https://modelcontextprotocol.io/extensions/apps/overview"],
  ["MCP Apps specification 2026-01-26", "https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx"],
  ["MCP Apps SDK and API documentation", "https://apps.extensions.modelcontextprotocol.io/api/"],
  ["MDN: Content Security Policy", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP"]
 ],
 "faq": [
  ["What MIME type does an MCP App resource need?", "The UI resource must be returned with the MIME type <code>text/html;profile=mcp-app</code>. A resource served as plain <code>text/html</code> is an ordinary HTML resource, and a host that implements MCP Apps will not render it as an app."],
  ["Why can my MCP App not call my API?", "When the resource declares no CSP metadata, hosts apply a restrictive default that includes <code>connect-src 'none'</code>, so every <code>fetch</code>, XHR and WebSocket is blocked. List the API's origin in <code>_meta.ui.csp.connectDomains</code> on the resource, or route the call through an MCP tool using <code>tools/call</code>."],
  ["Why does my MCP App work in one host but not another?", "MCP Apps is an optional extension. A host that does not advertise the <code>io.modelcontextprotocol/ui</code> extension shows only the tool's normal text result. Hosts also differ in which display modes, permissions and domains they allow, so test in each host you intend to support."],
  ["Can an MCP App load scripts from a CDN?", "Yes, if the origin is listed in <code>_meta.ui.csp.resourceDomains</code>. Without that, external scripts, styles, fonts and images are blocked by the default policy. Bundling everything into the single HTML file avoids the problem and is the pattern most examples use."]
 ]
}
---
## How an MCP App reaches the screen

MCP Apps is an extension to the Model Context Protocol (stable specification dated 2026-01-26) that lets a tool present an interactive HTML interface inside the host. Five things must all be true for anything to appear:

1. The host supports the extension and told the server so.
2. The tool's descriptor points at a UI resource.
3. `resources/read` returns that resource, with the right MIME type and real HTML.
4. The sandbox's Content Security Policy allows everything the page loads.
5. The page completes the `ui/initialize` handshake with the host.

A failure at steps 1 to 3 gives you no panel or an empty one. A failure at steps 4 or 5 gives you a panel that renders a shell and then stays blank. Work through them in order.

## 1. Confirm the host supports MCP Apps

A client that implements the extension advertises it in its capabilities under `extensions`, with the identifier `io.modelcontextprotocol/ui` and the MIME types it can render:

```json
{
  "capabilities": {
    "extensions": {
      "io.modelcontextprotocol/ui": { "mimeTypes": ["text/html;profile=mcp-app"] }
    }
  }
}
```

If the host does not send this, it will show the tool's text result and nothing else, and no change to your server will produce a panel. Check the host's documentation or the public client matrix before spending time on the server. Your tool should always return a meaningful text or structured result for this reason: it is what every other client sees.

## 2. Check the tool descriptor

Call `tools/list` (the MCP Inspector works well) and look at the tool's `_meta`:

```json
{
  "name": "show_dashboard",
  "description": "Show the ticket dashboard",
  "inputSchema": { "type": "object", "properties": {} },
  "_meta": {
    "ui": {
      "resourceUri": "ui://tickets/dashboard.html",
      "visibility": ["model", "app"]
    }
  }
}
```

- **`_meta.ui.resourceUri` must be present and use the `ui://` scheme.** An `https://` URL here is not valid.
- **Use the nested form.** Early drafts used a flat key, `_meta["ui/resourceUri"]`. It is deprecated; some hosts still accept it and others do not, which produces the "works in one client" bug.
- **`visibility`** defaults to `["model", "app"]`. A tool marked `["app"]` only is hidden from the model: the app can call it, but the model can never trigger it, so if that is your only entry point the panel never opens.

The metadata must be on the tool **definition** returned by `tools/list`. Putting it only on the tool call result is too late; hosts read the descriptor so they can preload the UI before the call finishes.

## 3. Read the exact resource

Request the URI from the descriptor, copied rather than retyped:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": { "uri": "ui://tickets/dashboard.html" } }
```

A correct response:

```json
{
  "contents": [{
    "uri": "ui://tickets/dashboard.html",
    "mimeType": "text/html;profile=mcp-app",
    "text": "<!doctype html><html>...</html>",
    "_meta": { "ui": { "csp": { "connectDomains": ["https://api.example.com"] } } }
  }]
}
```

| Check | Why it matters |
|---|---|
| The request succeeds | A "resource not found" error means the URI in the tool and the registered resource differ, often by one slash or a file extension |
| `mimeType` is exactly `text/html;profile=mcp-app` | Plain `text/html` is not treated as an app |
| `text` contains a complete HTML document | An empty string, a file path or an unbuilt template renders as a blank frame |
| `uri` in the response equals the requested URI | Some hosts match them strictly |

If your HTML is produced by a bundler, confirm the build ran. A very common cause of a blank panel is a server that reads `dist/index.html` from disk while the file does not exist in the published package, and returns an empty string or throws.

## 4. Look at the sandbox policy before your JavaScript

Hosts render the page in a sandboxed iframe. If the resource declares no `csp` metadata, the default policy is deliberately tight:

```text
default-src 'none';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
media-src 'self' data:;
connect-src 'none';
```

Read that as a list of things that fail silently unless you declare them:

| The page does this | Result under the default | Declare in `_meta.ui.csp` |
|---|---|---|
| `fetch("https://api.example.com/…")`, WebSocket | Blocked (`connect-src 'none'`) | `connectDomains` |
| `<script src="https://cdn.example.com/…">`, external CSS, web fonts, remote images | Blocked | `resourceDomains` |
| Embeds another site in an `<iframe>` | Blocked | `frameDomains` |

A page whose framework bundle comes from a CDN therefore renders nothing at all: the HTML loads, the script is refused, and the root element stays empty. Open the host's developer tools and look at the console. A line such as *Refused to load the script … because it violates the following Content Security Policy directive* is far better evidence than guessing.

Two ways to fix it. Bundle scripts and styles into the single HTML file, which needs no policy changes and is what the official examples do. Or declare the origins you need, on the **resource** (not the tool):

```json
"_meta": { "ui": { "csp": {
  "connectDomains": ["https://api.example.com"],
  "resourceDomains": ["https://cdn.example.com"]
} } }
```

Keep the list short. A host may refuse or warn about broad entries, and a wildcard added to make the panel work replaces a visible bug with an invisible security problem. Device access such as camera, microphone, geolocation and clipboard writing is requested separately through `_meta.ui.permissions`, and hosts may decline.

## 5. Check the handshake

The page and the host talk over `postMessage` using JSON-RPC. Nothing useful happens until the page sends `ui/initialize`, receives the host's reply, and sends `ui/notifications/initialized`. Only then does the host deliver the tool's arguments and result through `ui/notifications/tool-input` and `ui/notifications/tool-result`.

If the panel shows your static shell but never any data:

- **The app never connected.** With the official SDK, that means `app.connect()` was not called, threw, or ran before the handlers were registered.
- **Handlers were registered too late.** Set the tool-result handler before connecting, or the first result can arrive with nobody listening.
- **The page is waiting for a `load` event that already fired**, or for a size it was never given. Send a size-changed notification, or give the root element an explicit height; a zero-height app looks identical to a blank one.

```js
import { App } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "Ticket dashboard", version: "1.0.0" });
app.ontoolresult = (result) => render(result.structuredContent);   // register first
await app.connect();                                               // then connect
```

## Symptom-to-cause summary

| What you see | Most likely cause |
|---|---|
| Only text, no panel | Host does not support the extension, or `_meta.ui.resourceUri` is missing from the tool definition |
| Empty frame, nothing in the DOM | Wrong MIME type, empty `text`, or the resource read failed |
| Shell renders, console shows CSP errors | External scripts, styles or API calls not declared in `csp` |
| Shell renders, no data, no errors | Handshake not completed or result handler registered late |
| Works in one host only | Deprecated flat metadata key, or an undeclared domain that one host happens to allow |
| Panel has zero height | No size reported; set a height or notify the host of the size |

> Treat the sandbox as a feature. It is what allows a host to render third-party interfaces safely, so the durable fix for a blocked request is to declare exactly what the app needs, not to look for a host with a looser policy.
