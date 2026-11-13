---
{
 "order": 1,
 "group": "Set up and configure MCP",
 "category": "Configuration reference",
 "title": "MCP Config File Locations: Claude, Cursor, VS Code, Codex & More",
 "h1": "Where every MCP client keeps its config file",
 "description": "Exact MCP config file paths for Claude Desktop, Claude Code, Cursor, VS Code, Windsurf, Codex, Gemini CLI, Cline and Zed on macOS, Windows and Linux, with the top-level key each one expects.",
 "deck": "The same MCP server needs a different file, a different top-level key and sometimes a different format in every client. This page lists the paths, shows a working entry for each, and explains the mistakes that make a client silently ignore your server.",
 "published": "2026-11-12",
 "updated": "2026-11-12",
 "tools": [["MCP Config Lab", "https://mcp.guagua-alvin.top/"], ["MCP Config Guard", "https://mcpcheck.guagua-alvin.top/"]],
 "related": ["mcp-server-not-connecting", "claude-mcp-to-codex", "mcp-stdio-vs-streamable-http"],
 "cta": {"title": "Convert one config into every format", "text": "Paste a working entry from any client and get the equivalent JSON or TOML for the others, entirely in your browser.", "label": "Open MCP Config Lab", "url": "https://mcp.guagua-alvin.top/"},
 "sources": [
  ["Model Context Protocol: connect to local MCP servers", "https://modelcontextprotocol.io/docs/develop/connect-local-servers"],
  ["Claude Code documentation: MCP", "https://docs.claude.com/en/docs/claude-code/mcp"],
  ["Cursor documentation: Model Context Protocol", "https://cursor.com/docs/context/mcp"],
  ["VS Code documentation: use MCP servers", "https://code.visualstudio.com/docs/copilot/customization/mcp-servers"],
  ["Codex documentation: Model Context Protocol", "https://developers.openai.com/codex/mcp"],
  ["Gemini CLI documentation: MCP servers", "https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md"]
 ],
 "faq": [
  ["Why does my MCP server not appear after I edit the config file?", "The three most common causes are editing a file the client does not read (for example a project file when the client only loaded the user file), using the wrong top-level key (<code>servers</code> instead of <code>mcpServers</code>, or the reverse), and invalid JSON such as a trailing comma. Most desktop clients also read the file only at startup, so fully quit and reopen the application after saving."],
  ["Is the MCP config format the same in every client?", "No. Most JSON-based clients use an <code>mcpServers</code> object, but VS Code uses <code>servers</code>, Zed uses <code>context_servers</code>, and Codex uses TOML tables named <code>[mcp_servers.&lt;name&gt;]</code>. The fields inside an entry (command, args, env, url) are similar but not identical, especially for remote servers."],
  ["Should I commit a project-level MCP config to Git?", "A project file such as <code>.mcp.json</code>, <code>.cursor/mcp.json</code> or <code>.vscode/mcp.json</code> is designed to be shared, so committing it is normal. Never commit real credentials inside it. Reference environment variables or use the client's input-prompt mechanism, and review the file like code because it starts processes on every teammate's machine."],
  ["Can one file configure all my MCP clients?", "Not natively. Each client reads its own file. You can keep one source of truth and convert it, which is what a converter is for, or use a client-specific command such as <code>claude mcp add</code> or <code>codex mcp add</code> to write the entry for you."]
 ]
}
---
## Quick reference

Use this table to find the file, then read the section for your client for the details that matter: the key name, the scope rules and how to reload. Paths beginning with `~` are in your home directory; on Windows that is `%USERPROFILE%`.

| Client | User-level file | Project-level file | Top-level key |
|---|---|---|---|
| Claude Desktop | `claude_desktop_config.json` in the app's data folder | — | `mcpServers` |
| Claude Code | `~/.claude.json` | `.mcp.json` | `mcpServers` |
| Cursor | `~/.cursor/mcp.json` | `.cursor/mcp.json` | `mcpServers` |
| VS Code (Copilot) | `mcp.json` in the user profile | `.vscode/mcp.json` | `servers` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | — | `mcpServers` |
| Codex | `~/.codex/config.toml` | `.codex/config.toml` | `[mcp_servers.<name>]` |
| Gemini CLI | `~/.gemini/settings.json` | `.gemini/settings.json` | `mcpServers` |
| Cline | `cline_mcp_settings.json` in VS Code global storage | — | `mcpServers` |
| Zed | `~/.config/zed/settings.json` | — | `context_servers` |

Client applications change quickly. If a path here does not exist on your machine, use the client's own "open MCP configuration" command, which is listed in each section below, and treat that as authoritative.

## Claude Desktop

Claude Desktop reads one file per operating system:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux (unofficial builds) | `~/.config/Claude/claude_desktop_config.json` |

The reliable way to open it is **Settings → Developer → Edit Config**, which creates the file if it does not exist. A minimal local server looks like this:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"]
    }
  }
}
```

Claude Desktop reads the file at startup only. Closing the window is not enough on macOS: quit the application completely, then reopen it. Logs for each server are written to `~/Library/Logs/Claude/` on macOS and `%APPDATA%\Claude\logs\` on Windows, in files named `mcp-server-<name>.log`.

## Claude Code

Claude Code has three scopes. The scope decides both the file and who else gets the server.

| Scope | Stored in | Shared with |
|---|---|---|
| `local` (default) | `~/.claude.json`, under the current project's entry | Only you, only this project |
| `project` | `.mcp.json` at the repository root | Everyone who clones the repository |
| `user` | `~/.claude.json`, at the top level | Only you, every project |

You rarely need to edit these files by hand. The CLI writes them:

```bash
# local stdio server
claude mcp add tickets --env TICKET_TOKEN=... -- npx -y @example/ticket-server

# remote server, shared with the team through .mcp.json
claude mcp add --transport http --scope project docs https://mcp.example.com/mcp

claude mcp list
```

A project-scoped `.mcp.json` uses the same `mcpServers` shape as Claude Desktop, and supports `${VAR}` and `${VAR:-default}` expansion so that a shared file does not need to contain secrets. Claude Code asks for approval before it uses servers from a project file it has not seen before.

## Cursor

Cursor reads `~/.cursor/mcp.json` for servers you want everywhere and `.cursor/mcp.json` inside a project for servers that belong to that codebase. Both use `mcpServers`. Remote servers take a `url` instead of a `command`:

```json
{
  "mcpServers": {
    "tickets": { "command": "npx", "args": ["-y", "@example/ticket-server"] },
    "docs": { "url": "https://mcp.example.com/mcp" }
  }
}
```

After saving, open **Settings → MCP** (labelled "Tools & MCP" in recent versions) and check that the server shows a green status and a tool count. If it shows an error, the same panel exposes the server's output.

## VS Code

VS Code is the client most likely to trip people who copy a config from elsewhere, because **its top-level key is `servers`, not `mcpServers`**, and each entry may declare a `type`.

```json
{
  "servers": {
    "tickets": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@example/ticket-server"],
      "env": { "TICKET_TOKEN": "${input:ticket-token}" }
    },
    "docs": { "type": "http", "url": "https://mcp.example.com/mcp" }
  },
  "inputs": [
    { "id": "ticket-token", "type": "promptString", "description": "Ticket API token", "password": true }
  ]
}
```

The workspace file is `.vscode/mcp.json`. For a server available in every workspace, run **MCP: Open User Configuration** from the Command Palette; it opens the `mcp.json` in your user profile. The `inputs` array is worth using: VS Code prompts for the value once and stores it securely, so the token never appears in the file.

## Windsurf

Windsurf's Cascade reads `~/.codeium/windsurf/mcp_config.json` (on Windows, `%USERPROFILE%\.codeium\windsurf\mcp_config.json`). It uses `mcpServers`. One detail differs from other clients: a remote server is declared with **`serverUrl`**, not `url`.

```json
{
  "mcpServers": {
    "docs": { "serverUrl": "https://mcp.example.com/mcp" }
  }
}
```

Press the refresh button in the MCP panel after editing the file.

## Codex

Codex is the one mainstream client that does not use JSON. The CLI, the IDE extension and the desktop app share `~/.codex/config.toml`; a trusted project can add `.codex/config.toml`. Each server is a TOML table:

```toml
[mcp_servers.tickets]
command = "npx"
args = ["-y", "@example/ticket-server"]

[mcp_servers.tickets.env]
TICKET_TOKEN = "value-from-your-secret-store"

[mcp_servers.docs]
url = "https://mcp.example.com/mcp"
bearer_token_env_var = "DOCS_TOKEN"
```

Note the underscore in `mcp_servers`: a table named `[mcpServers.tickets]` is silently ignored. `codex mcp add` and `codex mcp list` manage the same file. The full field mapping from Claude JSON is in the [Claude-to-Codex conversion guide](/guides/claude-mcp-to-codex).

## Gemini CLI

Gemini CLI stores MCP servers inside its general settings file: `~/.gemini/settings.json` for your user, `.gemini/settings.json` for a project. The key is `mcpServers`. Its remote fields are easy to mix up: `httpUrl` is for a Streamable HTTP server, while `url` is for the older SSE transport.

```json
{
  "mcpServers": {
    "tickets": { "command": "npx", "args": ["-y", "@example/ticket-server"] },
    "docs": { "httpUrl": "https://mcp.example.com/mcp" }
  }
}
```

Run `/mcp` inside the CLI to list servers and their tools.

## Cline

Cline is a VS Code extension, but it does not read VS Code's `mcp.json`. It keeps its own `cline_mcp_settings.json` inside the extension's global storage, for example `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/` on macOS and `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\` on Windows. Open it from the Cline panel with **MCP Servers → Configure** rather than hunting for the path; forks of VS Code store it under their own application folder.

## Zed

Zed calls MCP servers *context servers* and stores them in its main settings file, `~/.config/zed/settings.json`, under `context_servers`:

```json
{
  "context_servers": {
    "tickets": { "command": "npx", "args": ["-y", "@example/ticket-server"], "env": {} }
  }
}
```

## Five mistakes that make a client ignore your server

1. **The wrong key.** `mcpServers`, `servers`, `context_servers` and `mcp_servers` are not interchangeable. A client finds no servers under an unknown key and reports nothing.
2. **Invalid JSON.** A trailing comma or a comment breaks strict JSON parsers. Claude Desktop will warn at startup; some clients fail quietly. Paste the file into a validator before restarting.
3. **Editing the wrong scope.** If a user-level and a project-level file both exist, check which one the client actually loaded. Claude Code's `claude mcp list` and Codex's `codex mcp list` print the effective set.
4. **Relative paths and a missing PATH.** Desktop apps do not start from your project directory and often do not inherit your shell's PATH. Use absolute paths for scripts, and see the [connection troubleshooting guide](/guides/mcp-server-not-connecting) if the error is `spawn npx ENOENT`.
5. **Not restarting.** Claude Desktop and several others load MCP configuration once. Quit and reopen.

> A config file starts programs with your user's permissions. Before copying an entry from a README, read the command, pin the package version where you can, and keep tokens out of the file. [MCP Config Guard](https://mcpcheck.guagua-alvin.top/) flags the common risks without uploading the file.
