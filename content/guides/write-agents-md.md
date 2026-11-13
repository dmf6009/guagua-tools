---
{
 "order": 11,
 "group": "Agents, crawlers and files",
 "category": "Agent instructions",
 "title": "How to Write AGENTS.md: Structure, Examples & Common Mistakes",
 "h1": "Write an AGENTS.md that coding agents actually follow",
 "description": "What AGENTS.md is, which coding agents read it, what to put in it, how nested files and precedence work, a complete example, and the mistakes that make agents ignore or misapply your instructions.",
 "deck": "An AGENTS.md is the briefing a coding agent reads before it touches your repository. The useful ones are short, specific and testable. The ones that fail are long, vague, or quietly contradict themselves. Here is how to write the first kind.",
 "published": "2026-11-12",
 "updated": "2026-11-12",
 "tools": [["AgentFile Check", "https://agentslint.guagua-alvin.top/"], ["Agent Skill Guard", "https://skillguard.guagua-alvin.top/"]],
 "related": ["block-ai-crawlers-robots-txt", "mcp-config-file-locations", "mcp-server-not-connecting"],
 "cta": {"title": "Lint the file before you commit it", "text": "Paste an AGENTS.md and get a review of its scope, commands, verification steps and conflicting instructions, with concrete fixes.", "label": "Open AgentFile Check", "url": "https://agentslint.guagua-alvin.top/"},
 "sources": [
  ["AGENTS.md: the open format", "https://agents.md/"],
  ["Codex documentation: custom instructions with AGENTS.md", "https://developers.openai.com/codex/guides/agents-md"],
  ["Claude Code documentation: memory and CLAUDE.md", "https://docs.claude.com/en/docs/claude-code/memory"],
  ["GitHub Copilot documentation: repository custom instructions", "https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions"]
 ],
 "faq": [
  ["What is AGENTS.md?", "AGENTS.md is a plain Markdown file, placed in a repository, that gives AI coding agents the project-specific context a README does not: how to build and test, which conventions to follow, and what not to touch. It is an open convention with no required schema, supported by many coding agents."],
  ["Where should AGENTS.md go?", "Put the main file at the repository root. In a monorepo you can add further AGENTS.md files inside packages; an agent working on a file uses the nearest one up the directory tree, so a package-level file can add to or override the root guidance for that package."],
  ["What is the difference between AGENTS.md and README.md?", "A README is for people: what the project is, how to install it, how to contribute. AGENTS.md is for agents: exact commands, verification steps, boundaries and conventions, written as instructions. Keeping them separate keeps the README readable and the agent file precise."],
  ["Does Claude Code read AGENTS.md?", "Claude Code's own instruction file is CLAUDE.md. A common setup is to keep the shared instructions in AGENTS.md and have CLAUDE.md import it with a line containing <code>@AGENTS.md</code>, so every agent reads one source of truth."]
 ]
}
---
## What AGENTS.md is for

A coding agent arriving in your repository knows the programming language but nothing about your project: which package manager you use, how tests are run, which directories are generated, what a reviewer will reject. It can discover some of that by exploring, slowly and sometimes wrongly. `AGENTS.md` tells it up front.

The format is deliberately minimal. It is ordinary Markdown, with no required headings and no front matter. It began as a convention shared by several agent vendors and is now maintained as an open format, read by tools including Codex, Cursor, GitHub Copilot's coding agent, Gemini CLI, Jules, Aider, Zed, Windsurf and others. That reach is the reason to prefer it over a tool-specific file: one document serves every agent your contributors use.

## What to include

Write down what a capable new contributor would have to ask. In practice that is six things.

**1. Setup and build commands, exactly as typed.** An agent will run what you write. `pnpm install` and `pnpm build`, not "install dependencies".

**2. How to verify a change.** This is the most valuable section. State the command that must pass before work is considered done, how to run a single test, and how long things take.

**3. Project layout.** A few lines on where source, tests and generated files live, and which directories must never be edited by hand.

**4. Conventions a linter does not enforce.** Naming, error-handling style, how to add a migration, which library to use for dates. Skip anything the formatter already fixes.

**5. Boundaries.** What needs human approval, what must not be changed, and which commands are forbidden: production deploys, force pushes, edits to lockfiles or CI configuration.

**6. Pull request expectations.** Commit message format, what a PR description must contain, whether to update the changelog.

## A complete example

```markdown
# AGENTS.md

## Project
TypeScript monorepo for the Tickets API and its web dashboard.
Node 22, pnpm 10. Packages live in `packages/*`.

## Setup
- Install: `pnpm install`
- Start the API locally: `pnpm --filter api dev` (port 4000)

## Verify before finishing
Run all three; all must pass.
- Type check: `pnpm typecheck`
- Lint: `pnpm lint`
- Tests: `pnpm test`

Run one test file: `pnpm --filter api test src/refunds/refund.test.ts`
The full suite takes about four minutes. Prefer single files while iterating.

## Layout
- `packages/api/src` — HTTP handlers and domain logic
- `packages/web/src` — React dashboard
- `packages/db/migrations` — SQL migrations, append-only
- `packages/*/dist`, `packages/api/src/generated` — generated, never edit

## Conventions
- Validate all request bodies with the zod schemas in `packages/api/src/schemas`.
- Money is an integer number of cents. Never use floating point for amounts.
- New database changes are a new migration file. Never edit an existing one.
- Throw `AppError` with a code from `errors.ts`; do not throw plain strings.

## Boundaries
- Do not modify `.github/workflows`, `pnpm-lock.yaml` or anything in `infra/`
  unless the task explicitly asks for it.
- Never run `pnpm deploy`, `pnpm db:reset`, or any command against production.
- Ask before adding a new runtime dependency.

## Pull requests
- Conventional Commits (`feat:`, `fix:`, `chore:`).
- Describe what changed, why, and how you verified it.
```

That is about forty lines, and an agent can act on every one of them.

## Nested files and precedence

In a large repository, one file cannot describe everything. Agents that support the convention look for `AGENTS.md` in the directory of the file they are working on and in each parent directory, and **the nearest file takes precedence** when instructions conflict. A typical arrangement:

```text
AGENTS.md                  # shared rules: tooling, PR format, boundaries
packages/api/AGENTS.md     # API-specific: test database, schema rules
packages/web/AGENTS.md     # dashboard-specific: component conventions
```

Keep shared rules at the root and put only the differences in package files. Do not copy the root content into each package; duplicated text drifts, and two files that disagree are worse than one that is incomplete.

Individual tools add their own layers. Codex, for example, also reads a personal `~/.codex/AGENTS.md` that applies to all your projects, and concatenates files from the repository root down to the working directory, with a size limit on the combined text. An explicit instruction in the user's prompt overrides anything in the file.

## Working with CLAUDE.md and other tool-specific files

Some tools have their own file names: `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for Copilot, rule files for Cursor. Maintaining four copies guarantees they diverge. Choose one source of truth and point the others at it.

For Claude Code, a `CLAUDE.md` containing a single import line is enough:

```markdown
@AGENTS.md
```

Put only what is unique to that tool in the tool-specific file.

## Mistakes that make agents ignore the file

| Mistake | Why it fails | Fix |
|---|---|---|
| Vague guidance: "write clean, well-tested code" | Nothing to act on or check | Name the command and the rule |
| Commands described, not written | The agent guesses the script name | Put the exact command in backticks |
| No verification step | The agent declares success without running anything | Add a "must pass" list |
| Contradictions: "always add tests" and "do not touch `tests/`" | The agent picks one arbitrarily | Search the file for conflicts when you add a rule |
| Stale commands | The file says `npm test`; the project moved to pnpm | Review the file whenever tooling changes |
| Too long | Important rules are diluted and may be truncated | Keep the root file to what applies everywhere; move detail into nested files or linked docs |
| Only prohibitions | The agent knows what not to do but not what to do instead | Pair each "never" with the approved alternative |
| Secrets or internal URLs | The file is committed and widely read | Reference variable names, never values |

A useful test: give the file to a new human contributor. If they could make a correct change using only this file and the code, an agent probably can too.

## Security: instructions are executable in practice

An agent treats `AGENTS.md` as trusted guidance and will run the commands in it. That makes the file part of your supply chain.

- **Review changes to it like code.** A pull request that adds "run `curl … | sh` during setup" to an instruction file is an attack, not documentation.
- **Be careful with repositories you did not write.** Opening an untrusted project in an agent with permission to run commands means following that project's instructions. Read its agent files first, and keep approval prompts on.
- **Do not grant authority the file should not have.** Instructions such as "ignore previous rules" or "do not ask for confirmation" have no place in a project file.
- The same applies to `SKILL.md` files and other instruction bundles downloaded from the internet. [Agent Skill Guard](https://skillguard.guagua-alvin.top/) checks those for override attempts and risky permissions.

## Maintaining it

Treat the file as living documentation. When an agent makes the same mistake twice, the fix is usually one new line in `AGENTS.md`. When a line no longer matches the project, delete it; a wrong instruction is followed just as faithfully as a right one. A short file that is true is worth more than a long one that used to be.

> Start small: setup, verification and boundaries. Add a rule only when you have seen the problem it prevents. Files written from real corrections stay short and get followed.
