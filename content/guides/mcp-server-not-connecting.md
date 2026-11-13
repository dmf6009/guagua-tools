---
{
 "order": 2,
 "group": "Debug MCP servers",
 "category": "Troubleshooting",
 "title": "MCP Server Not Connecting? Fix spawn ENOENT, Timeouts & Disconnects",
 "h1": "Fix an MCP server that will not connect",
 "description": "Step-by-step fixes for MCP servers that fail to start: spawn npx ENOENT, 'server disconnected', startup timeouts, JSON parse errors from stdout logging, Windows npx issues and missing environment variables.",
 "deck": "Almost every failed MCP connection is one of six problems, and each leaves a recognisable message. Find your error below, confirm it with one command, and apply the fix that matches.",
 "published": "2026-11-12",
 "updated": "2026-11-12",
 "tools": [["MCP Config Guard", "https://mcpcheck.guagua-alvin.top/"], ["MCP Config Lab", "https://mcp.guagua-alvin.top/"]],
 "related": ["mcp-config-file-locations", "mcp-stdio-vs-streamable-http", "debug-mcp-oauth-401"],
 "cta": {"title": "Check the config before you restart again", "text": "Scan an MCP configuration for malformed entries, risky commands and exposed secrets. The check runs in your browser.", "label": "Open MCP Config Guard", "url": "https://mcpcheck.guagua-alvin.top/"},
 "sources": [
  ["Model Context Protocol: debugging", "https://modelcontextprotocol.io/docs/tools/debugging"],
  ["Model Context Protocol: MCP Inspector", "https://modelcontextprotocol.io/docs/tools/inspector"],
  ["Model Context Protocol specification: transports", "https://modelcontextprotocol.io/specification/2025-11-25/basic/transports"]
 ],
 "faq": [
  ["What does 'spawn npx ENOENT' mean?", "The client tried to start the program named in <code>command</code> and the operating system could not find it. <code>ENOENT</code> is 'no such file or directory'. The config syntax is fine; the executable is not on the PATH that the client process sees. Use the absolute path to the executable, or on Windows wrap the command with <code>cmd /c</code>."],
  ["Why does my MCP server work in the terminal but not in Claude Desktop?", "A desktop application launched from the Dock or Start menu does not load your shell profile, so tools installed through nvm, fnm, pyenv, Homebrew or uv may be missing from its PATH. It also starts servers from a different working directory, so relative paths break. Absolute paths for both the command and its file arguments fix both problems."],
  ["Can I use console.log in an MCP server?", "Not in a stdio server. On the stdio transport, stdout carries the JSON-RPC messages, so any other text written there corrupts the stream and the client reports a parse error or disconnects. Write logs to stderr instead: <code>console.error</code> in Node.js, or <code>print(..., file=sys.stderr)</code> and the <code>logging</code> module in Python."],
  ["How do I see the logs for an MCP server?", "Claude Desktop writes one log file per server under <code>~/Library/Logs/Claude/</code> on macOS and <code>%APPDATA%\\Claude\\logs\\</code> on Windows. Cursor and VS Code show server output in their MCP or Output panels. For any client, you can also run the exact command from the config in a terminal and read stderr directly."]
 ]
}
---
## Start with the one test that splits the problem

Before changing anything, take the server out of the client. Copy the `command` and `args` from your config and run them in a terminal exactly as written:

```bash
npx -y @example/ticket-server
```

A healthy stdio server prints nothing (or only log lines on stderr) and waits. That tells you which half of the system is broken:

| What happens in the terminal | Where the problem is |
|---|---|
| "command not found" or a crash with a stack trace | The server or your runtime. Fix it here first. |
| It waits silently | The server is fine. The problem is how the client launches it: PATH, working directory, environment or config. |
| It prints text and waits | It may be logging to stdout. See the JSON parse error section. |

For a closer look, the official inspector connects to the same command and shows the handshake, the tool list and every message:

```bash
npx @modelcontextprotocol/inspector npx -y @example/ticket-server
```

If the inspector lists your tools, the server implementation is correct and the remaining work is entirely in the client configuration.

## Error: spawn npx ENOENT (or spawn uvx, node, python)

This is the most common MCP error. The client could not find the executable. It is a PATH problem, not a JSON problem.

**Find the real path** and put it in the config:

```bash
which npx        # macOS / Linux  → /Users/you/.nvm/versions/node/v22.11.0/bin/npx
where npx        # Windows        → C:\Program Files\nodejs\npx.cmd
```

```json
{
  "mcpServers": {
    "tickets": {
      "command": "/Users/you/.nvm/versions/node/v22.11.0/bin/npx",
      "args": ["-y", "@example/ticket-server"]
    }
  }
}
```

With version managers such as nvm, `npx` itself runs `node` through `env`, so a full path to `npx` may still fail with `env: node: No such file or directory`. In that case add the directory to PATH for the server:

```json
"env": { "PATH": "/Users/you/.nvm/versions/node/v22.11.0/bin:/usr/local/bin:/usr/bin:/bin" }
```

The cleaner long-term fix is to install Node.js or uv somewhere system-wide (the official installer or Homebrew), so that desktop applications can see it without help.

## Windows: npx does nothing or fails with ENOENT

On Windows, `npx` is a `.cmd` script rather than an executable, and many clients spawn processes without a shell. The process cannot be started directly. Run it through `cmd`:

```json
{
  "mcpServers": {
    "tickets": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@example/ticket-server"]
    }
  }
}
```

Two more Windows details: escape backslashes in JSON paths (`"C:\\Users\\you\\server.js"`) or use forward slashes, and remember that `%APPDATA%` and similar variables are not expanded inside the config file.

## Error: JSON parse errors, "Unexpected token", or instant disconnect

If the client log shows something like `Unexpected token 'S', "Server sta"... is not valid JSON`, the server is writing ordinary text to stdout. On the stdio transport, **stdout is reserved for protocol messages**. One banner line is enough to break the connection.

```js
// breaks a stdio server
console.log("Server started");

// correct: stderr is for logs
console.error("Server started");
```

```python
import sys, logging
logging.basicConfig(stream=sys.stderr, level=logging.INFO)   # not stdout
print("Server started", file=sys.stderr)
```

Check your dependencies too. A library that prints a deprecation warning, a progress bar or a "new version available" notice to stdout will cause intermittent failures that are hard to reproduce.

## Error: server disconnected, or it connects and then drops

A server that starts and then exits is crashing. The reason is in the server's stderr, which the client stores in its log. For Claude Desktop:

```bash
# macOS
tail -n 50 -f ~/Library/Logs/Claude/mcp-server-tickets.log
# Windows (PowerShell)
Get-Content "$env:APPDATA\Claude\logs\mcp-server-tickets.log" -Tail 50 -Wait
```

The usual causes, in order of frequency:

- **A missing environment variable.** The server reads an API key at startup and throws. The client does not pass your shell's variables to the server; only a small default set is inherited. Declare everything the server needs in the entry's `env` block.
- **A relative path.** `"args": ["./build/index.js"]` is resolved against the client's working directory, which is not your project. Use an absolute path.
- **An unbuilt project.** For a TypeScript server run from source, `build/index.js` does not exist until you run the build.
- **A wrong runtime version.** The client found a different, older `node` or `python` than your terminal does.

## Error: request timed out, or the server never becomes ready

The first run of `npx -y` or `uvx` downloads the package, which can take longer than the client's startup timeout. Run the command once in a terminal to fill the cache, then restart the client. If the server is slow for real reasons, such as opening a database or loading a model, raise the limit where the client allows it. Codex, for example, reads `startup_timeout_sec` (default 10) and `tool_timeout_sec` (default 60) per server.

A related symptom is a server that hangs because it is waiting for input: a login prompt, a "proceed? (y/n)" question from `npx` without `-y`, or an interactive OAuth flow. A stdio server must be able to start with no terminal attached.

## The server is connected but shows no tools

Connection succeeded, discovery did not. Check three things:

1. The server actually registers tools at startup. The inspector's **Tools** tab shows exactly what `tools/list` returns.
2. The client has not disabled them. Several clients let you switch individual tools off, and some cap the total number of tools across all servers.
3. Tool names and schemas are valid. A tool whose `inputSchema` is not a JSON Schema object can cause a client to drop the whole list.

## Remote servers: 401, 404 and 405

For a server reached by URL, the failures are HTTP failures:

| Status | Likely cause |
|---|---|
| 401 | Authorization is required or the token is wrong. Work through the [OAuth 401 guide](/guides/debug-mcp-oauth-401). |
| 404 | The URL is missing the MCP path. Most servers listen on `/mcp`, not the site root. |
| 405 | The client and server disagree about transport, typically a Streamable HTTP client pointed at an old SSE endpoint. See [stdio vs Streamable HTTP](/guides/mcp-stdio-vs-streamable-http). |
| 400 | A header the server requires, such as the protocol version, is missing or unsupported. |

## A checklist that catches most cases

- Run the exact command in a terminal. Does it start and wait?
- Use absolute paths for the command and for any file arguments.
- On Windows, wrap `npx` with `cmd /c`.
- Put every required variable in `env`. Do not rely on your shell.
- Send logs to stderr, never stdout.
- Validate the JSON, then fully quit and reopen the client.
- Read the server's log file before changing anything else.

> When you ask for help, share the redacted config entry and the last twenty lines of the server log. Remove tokens first: a config pasted into an issue tracker is a common way credentials leak.
