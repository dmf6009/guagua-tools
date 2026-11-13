---
{
 "order": 4,
 "group": "Set up and configure MCP",
 "category": "Config conversion",
 "title": "Convert Claude Desktop MCP Config to Codex TOML (config.toml)",
 "h1": "Convert a Claude Desktop MCP config to Codex TOML",
 "description": "Map claude_desktop_config.json to Codex's ~/.codex/config.toml: field-by-field mapping for mcpServers to [mcp_servers], env tables, remote URLs, bearer tokens, timeouts and the errors that follow a bad conversion.",
 "deck": "Claude Desktop describes MCP servers in JSON; Codex reads TOML. The translation is mechanical, but four details — the table name, the env table, remote authentication and timeouts — decide whether the server actually starts.",
 "published": "2026-07-29",
 "updated": "2026-11-12",
 "tools": [["MCP Config Lab", "https://mcp.guagua-alvin.top/"], ["MCP Config Guard", "https://mcpcheck.guagua-alvin.top/"]],
 "related": ["mcp-config-file-locations", "mcp-server-not-connecting", "mcp-stdio-vs-streamable-http"],
 "cta": {"title": "Let the converter do the rewrite", "text": "Paste Claude Desktop JSON and copy Codex TOML. The conversion happens in your browser and nothing is uploaded.", "label": "Open the free MCP config converter", "url": "https://mcp.guagua-alvin.top/"},
 "sources": [
  ["Codex documentation: Model Context Protocol", "https://developers.openai.com/codex/mcp"],
  ["Model Context Protocol: connect to local MCP servers", "https://modelcontextprotocol.io/docs/develop/connect-local-servers"],
  ["TOML v1.0.0 specification", "https://toml.io/en/v1.0.0"]
 ],
 "faq": [
  ["Where is the Codex MCP config file?", "Codex reads <code>~/.codex/config.toml</code>. The CLI, the IDE extension and the desktop app share it. A trusted project can also provide <code>.codex/config.toml</code> for servers that belong to that repository."],
  ["Does Codex use mcpServers like Claude Desktop?", "No. Codex uses TOML tables named <code>[mcp_servers.&lt;name&gt;]</code>, with an underscore and lower case. A table called <code>[mcpServers.name]</code> is valid TOML but Codex does not read it, so the server simply never appears."],
  ["How do I pass an API key to an MCP server in Codex?", "For a local stdio server, set it in the <code>[mcp_servers.&lt;name&gt;.env]</code> table, or list the variable name in <code>env_vars</code> to forward it from your own environment without writing the value in the file. For a remote server, use <code>bearer_token_env_var</code> to name the environment variable that holds the token."],
  ["Can I add an MCP server to Codex without editing TOML?", "Yes. <code>codex mcp add &lt;name&gt; -- &lt;command&gt;</code> writes a stdio entry and <code>codex mcp add &lt;name&gt; --url &lt;url&gt;</code> writes a remote one. <code>codex mcp list</code> shows what is configured, and <code>/mcp</code> inside the terminal UI shows which servers are active."]
 ]
}
---
## The short answer

Claude Desktop stores servers as properties of a `mcpServers` object in `claude_desktop_config.json`. Codex stores each server as a TOML table named `[mcp_servers.<name>]` in `~/.codex/config.toml`. Keep the server name, the command, the order of the arguments and the names of the environment variables exactly the same. Only the container syntax changes.

Claude Desktop JSON:

```json
{
  "mcpServers": {
    "tickets": {
      "command": "npx",
      "args": ["-y", "@example/ticket-server"],
      "env": { "TICKET_TOKEN": "tok_placeholder" }
    }
  }
}
```

Codex TOML:

```toml
[mcp_servers.tickets]
command = "npx"
args = ["-y", "@example/ticket-server"]

[mcp_servers.tickets.env]
TICKET_TOKEN = "tok_placeholder"
```

## Field mapping

| Claude Desktop JSON | Codex TOML | Notes |
|---|---|---|
| `mcpServers.<name>` | `[mcp_servers.<name>]` | Underscore, lower case. Quote names with dots or spaces: `[mcp_servers."my.server"]` |
| `command` | `command` | Unchanged string |
| `args` | `args` | Same array, same order |
| `env` (object) | `[mcp_servers.<name>.env]` table, or inline `env = { KEY = "value" }` | Keys are case-sensitive |
| — | `env_vars = ["NAME"]` | Codex only: forward a variable from your environment instead of storing its value |
| — | `cwd` | Codex only: working directory for the process |
| `url` (in clients that support remote entries) | `url` | Streamable HTTP endpoint |
| `headers.Authorization` | `bearer_token_env_var = "NAME"` | Names the variable holding the token |
| other static headers | `http_headers = { "X-Key" = "value" }` | Use `env_http_headers` to read values from variables |

Codex adds several per-server settings that have no Claude Desktop equivalent. They are optional, but two are worth knowing during a migration:

| Key | Default | Purpose |
|---|---|---|
| `startup_timeout_sec` | `10` | How long Codex waits for the server to start and list its tools |
| `tool_timeout_sec` | `60` | How long one tool call may run |
| `enabled` | `true` | Set `false` to keep an entry without loading it |
| `enabled_tools` / `disabled_tools` | all tools | Allow list and deny list for individual tools |

## Convert one server at a time

Copy a single entry rather than the whole file. If the server fails to start afterwards, you know which change caused it.

1. Open the Claude Desktop config (**Settings → Developer → Edit Config**) and copy one server.
2. Convert it, by hand using the table above or with [MCP Config Lab](https://mcp.guagua-alvin.top/).
3. Append the result to `~/.codex/config.toml`. Tables can appear in any order, but a table name may only be defined once.
4. Run `codex mcp list` and confirm the server is present with the command and arguments you expect.
5. Start Codex, run `/mcp`, and call one read-only tool.

## TOML details that break a correct-looking file

**Strings and backslashes.** TOML basic strings use the same backslash escapes as JSON, so a Windows path needs doubled backslashes or a literal string in single quotes:

```toml
args = ["C:\\Users\\you\\server\\index.js"]
args = ['C:\Users\you\server\index.js']      # literal string, no escaping
```

**Table placement.** Everything after a `[table]` header belongs to that table until the next header. If you paste a top-level setting such as `model = "..."` below an `[mcp_servers.x]` header, it becomes a field of that server and stops working as a global setting. Keep global keys at the top of the file.

**Duplicate tables.** Defining `[mcp_servers.tickets]` twice is a TOML error and Codex will refuse to load the file. Search for the name before appending.

**Booleans and numbers are not strings.** Write `enabled = false` and `startup_timeout_sec = 30`, without quotes. Environment values, by contrast, must always be strings: `PORT = "8080"`.

## Environment variables and secrets

A common Claude Desktop habit is to paste a real token into the `env` object. Converting that faithfully puts the same token into a second plain-text file. The migration is a good moment to stop doing that.

Codex gives you two better options. `env_vars` forwards a variable that already exists in the environment Codex was started from:

```toml
[mcp_servers.tickets]
command = "npx"
args = ["-y", "@example/ticket-server"]
env_vars = ["TICKET_TOKEN"]
```

For a remote server, `bearer_token_env_var` names the variable instead of containing the secret:

```toml
[mcp_servers.docs]
url = "https://mcp.example.com/mcp"
bearer_token_env_var = "DOCS_MCP_TOKEN"
```

Watch for `${VAR}` placeholders in the source file. Some clients expand them and some pass the literal text to the server, so a value such as `"${TICKET_TOKEN}"` may never have worked the way it looks. Decide where the real value comes from rather than copying the placeholder across.

## Remote servers and OAuth

A Claude Desktop config often reaches remote servers through a local bridge such as `mcp-remote`, because the app adds remote servers through its Connectors settings rather than through the JSON file. Codex speaks Streamable HTTP directly, so the bridge is usually unnecessary:

```toml
# instead of: command = "npx", args = ["-y", "mcp-remote", "https://mcp.example.com/mcp"]
[mcp_servers.docs]
url = "https://mcp.example.com/mcp"
```

If the server requires OAuth, run `codex mcp login docs` once to complete the browser flow. A server that only returns 401 after that needs the checks in the [OAuth 401 guide](/guides/debug-mcp-oauth-401).

## When the server does not start in Codex

| Symptom | Likely cause | Fix |
|---|---|---|
| Server missing from `codex mcp list` | Table named `mcpServers` or `mcp-servers`, or the file has a TOML syntax error | Rename to `mcp_servers`; validate the TOML |
| Listed, but times out at startup | First `npx` download is slower than 10 seconds | Run the command once in a terminal, or raise `startup_timeout_sec` |
| Starts, then authentication errors | Env key renamed or lower-cased during conversion; `env_vars` names a variable that is not set | Compare key names character by character |
| "No such file or directory" | Relative path in `args`, or the executable is not on Codex's PATH | Use absolute paths; set `cwd` if the server expects one |
| Works in Claude Desktop, tools missing in Codex | `enabled_tools` set too narrowly, or the argument order changed | Remove the filter; diff the `args` arrays |

If none of those match, run the exact command and arguments in a clean terminal. That separates a process problem from a configuration problem, and the [connection troubleshooting guide](/guides/mcp-server-not-connecting) covers the process side.

## Before you save: scan the result

A converted file is a list of programs that will run with your permissions every time Codex starts. Read it once as a reviewer: are packages pinned to a version, does any command pipe a download into a shell, does any argument grant a whole home directory, does any value look like a live credential? [MCP Config Guard](https://mcpcheck.guagua-alvin.top/) runs those checks locally and explains each finding. A warning is a prompt to look, not a verdict.

> Examples on this page use a fictional package and placeholder tokens. Replace them with your own server, and never paste a production credential into any online tool, including this site's.
