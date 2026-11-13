---
{
 "order": 9,
 "group": "Build and publish MCP servers",
 "category": "Distribution",
 "title": "Publish to the MCP Registry: server.json, mcpName & mcp-publisher",
 "h1": "Publish an MCP server to the official MCP Registry",
 "description": "A complete walkthrough for the official MCP Registry: write a valid server.json, choose a namespace, pass ownership verification for npm, PyPI, NuGet, Cargo, Docker and MCPB packages, and fix the errors mcp-publisher returns.",
 "deck": "The Registry stores metadata, not code. Publishing means proving that a name belongs to you and that the package it points to agrees. Most rejected submissions fail one of four checks, all of which you can test before running the publish command.",
 "published": "2026-08-06",
 "updated": "2026-11-12",
 "tools": [["RegistryReady", "https://mcpregistry.guagua-alvin.top/"]],
 "related": ["mcp-stdio-vs-streamable-http", "migrate-mcp-2026", "mcp-config-file-locations"],
 "cta": {"title": "Validate server.json before publishing", "text": "Check the schema, the name format, package and version alignment and transport fields, or generate a starting file from a short form.", "label": "Open RegistryReady", "url": "https://mcpregistry.guagua-alvin.top/"},
 "sources": [
  ["MCP Registry quickstart: publish a server", "https://modelcontextprotocol.io/registry/quickstart"],
  ["MCP Registry: supported package types", "https://modelcontextprotocol.io/registry/package-types"],
  ["MCP Registry: authentication methods", "https://modelcontextprotocol.io/registry/authentication"],
  ["MCP Registry: remote servers", "https://modelcontextprotocol.io/registry/remote-servers"],
  ["MCP Registry source and issue tracker", "https://github.com/modelcontextprotocol/registry"]
 ],
 "faq": [
  ["Does the MCP Registry host my server's code?", "No. The Registry stores only metadata: the server's name, description, version and where its package or remote endpoint lives. You publish the package itself to npm, PyPI, NuGet, crates.io, a container registry or a release page first, and the Registry entry points to it."],
  ["What is mcpName in package.json?", "<code>mcpName</code> is a property the Registry reads from your published npm package to verify ownership. Its value must be identical to the <code>name</code> in <code>server.json</code>, for example <code>io.github.your-username/weather</code>. If it is missing from the published version, publishing fails with a package validation error."],
  ["Can I use my own domain as the namespace?", "Yes. GitHub authentication gives you the <code>io.github.&lt;username&gt;/</code> namespace. To publish under a reverse-DNS name such as <code>com.example/</code>, authenticate with the DNS or HTTP method, which proves control of the domain."],
  ["Can I change or delete a published version?", "Treat published versions as permanent. The version string for a server must be unique, so publishing a fix means publishing a new version of both the package and the metadata rather than editing the existing entry."]
 ]
}
---
## What the Registry is, and is not

The official MCP Registry at `registry.modelcontextprotocol.io` is a catalogue of server metadata that clients and downstream marketplaces read. It does not host packages and it does not review your code. It is still labelled a preview, so details can change; check the linked documentation before a release.

A listing is one JSON document, `server.json`, that answers three questions: what the server is called, which version this is, and how a client can run or reach it.

## A minimal server.json

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "io.github.your-username/weather",
  "title": "Weather",
  "description": "Current conditions and forecasts from the Example Weather API.",
  "version": "1.0.1",
  "repository": {
    "url": "https://github.com/your-username/mcp-weather-server",
    "source": "github"
  },
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@your-username/mcp-weather-server",
      "version": "1.0.1",
      "transport": { "type": "stdio" }
    }
  ]
}
```

| Field | What to check |
|---|---|
| `$schema` | The dated schema URL. It tells validators which rules apply |
| `name` | `namespace/server-name`. The namespace must match how you authenticate |
| `description` | One clear sentence. Keep it short; long marketing copy is rejected by length limits |
| `version` | The version of this listing. Must be unique for the server |
| `packages[].identifier` | The exact package name in its registry |
| `packages[].version` | A specific published version, not a range and not `latest` |
| `packages[].transport` | How the packaged server communicates, usually `{"type": "stdio"}` |

## Check 1: the namespace matches your authentication

The part of `name` before the slash is a namespace you must prove you control.

| You authenticate with | You may publish under |
|---|---|
| `mcp-publisher login github` | `io.github.<your-username>/…` or `io.github.<your-org>/…` |
| DNS or HTTP domain verification | `com.example/…` (your domain reversed) |

The error *You do not have permission to publish this server* almost always means these two disagree: for example, a personal GitHub login used with an organisation's namespace you are not a member of, or a custom domain name used with GitHub authentication. Names are case-sensitive.

## Check 2: the package proves it belongs to the listing

Anyone could write a `server.json` that points at somebody else's package, so the Registry looks inside the published package for a marker that names the server. The marker differs by package type:

| `registryType` | Where it is published | Ownership marker |
|---|---|---|
| `npm` | npm public registry | `"mcpName": "<server name>"` in `package.json` |
| `pypi` | PyPI | The text `mcp-name: <server name>` in the README (an HTML comment is fine) |
| `nuget` | NuGet | `mcp-name: <server name>` in the package README |
| `cargo` | crates.io | `mcp-name: <server name>` as **visible** README text; crates.io strips HTML comments |
| `oci` | Docker Hub, GHCR and other supported registries | Image label `io.modelcontextprotocol.server.name="<server name>"` |
| `mcpb` | GitHub or GitLab release asset | URL must contain "mcp"; `fileSha256` is required in `server.json` |

For npm:

```json
{
  "name": "@your-username/mcp-weather-server",
  "version": "1.0.1",
  "mcpName": "io.github.your-username/weather"
}
```

For a container image:

```dockerfile
LABEL io.modelcontextprotocol.server.name="io.github.your-username/weather"
```

The detail that catches people: **the marker must be in the published artifact, at the version the listing names.** Adding `mcpName` to your repository does nothing until you publish a new package version that contains it. If version 1.0.0 is already on npm without the property, bump to 1.0.1, publish that, and reference 1.0.1 in `server.json`.

## Check 3: versions line up

There are two version fields and they mean different things. The top-level `version` is the version of the server as listed. `packages[].version` is the version of the artifact to install. Keeping them equal is the simplest policy and avoids confusion.

Before publishing, confirm the package version really exists:

```bash
npm view @your-username/mcp-weather-server@1.0.1 version mcpName
```

If that prints nothing, the Registry will not find it either. Ranges such as `^1.0.0` and tags such as `latest` are not accepted, because a listing must identify exactly one artifact. For OCI images the tag is part of the identifier (`ghcr.io/you/weather:1.0.1`), and a digest is better still.

## Check 4: the transport and inputs are described

`transport.type` tells a client how to talk to the packaged server. A local package normally uses `stdio`. If the server needs configuration, declare it so clients can prompt for it instead of failing at startup:

```json
"environmentVariables": [
  {
    "name": "WEATHER_API_KEY",
    "description": "API key for the Example Weather API",
    "isRequired": true,
    "isSecret": true
  }
]
```

Mark credentials with `isSecret` so clients store and display them appropriately. Never put a real value in `server.json`; the file is public.

## Remote servers

A hosted server is listed with `remotes` instead of, or in addition to, `packages`:

```json
"remotes": [
  { "type": "streamable-http", "url": "https://mcp.example.com/mcp" }
]
```

Use `streamable-http` for current servers. The older `sse` type exists for servers that still run the deprecated transport; see [stdio vs Streamable HTTP](/guides/mcp-stdio-vs-streamable-http) for the difference. Publishing a remote under a custom-domain namespace requires that the URL's host matches the verified domain.

## Publish

```bash
# 1. publish the package first
npm publish --access public

# 2. install the CLI (Homebrew shown; binaries are on the releases page)
brew install mcp-publisher

# 3. create or update server.json
mcp-publisher init

# 4. authenticate and publish
mcp-publisher login github
mcp-publisher publish
```

Confirm the result through the public API:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.your-username/weather"
```

To avoid doing this by hand on every release, the Registry supports publishing from GitHub Actions using the workflow's OIDC identity, so no long-lived token needs to be stored.

## Errors and what they mean

| Message | Cause | Fix |
|---|---|---|
| Registry validation failed for package | The ownership marker is missing from the published version, or does not equal `name` | Add the marker, publish a new package version, update both version fields |
| You do not have permission to publish this server | Namespace does not match the authentication method | Use `io.github.<login>/…` with GitHub auth, or verify the domain |
| Invalid or expired Registry JWT token | The login session ended | Run `mcp-publisher login github` again |
| Version already exists | That listing version was published before | Increment `version` |
| Schema validation errors | Missing required field, wrong type, or an outdated `$schema` | Validate against the dated schema; regenerate with `mcp-publisher init` |

## Release checklist

- The package is published and publicly installable at the exact version.
- The ownership marker is inside that published version and equals `name` character for character.
- `name` uses a namespace your login can publish to.
- Top-level `version` is new, and `packages[].version` exists.
- Required environment variables are declared; secrets are marked and no real values are present.
- `description` reads as one accurate sentence.
- A clean machine can run the server with the command a client would build from this metadata.

> The last item is the one that matters to users. A listing that validates but does not start, because the package forgot a `bin` entry or needs an undeclared variable, is worse than no listing. Install your own server from the published metadata before announcing it.
