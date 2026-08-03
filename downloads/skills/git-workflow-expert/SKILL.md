---
name: git-workflow-expert
description: "Git Workflow Expert workflow supporting this outcome: Choose a Git workflow that fits team size and release needs, then plan safe branches, atomic commits, integration, recovery, and CI controls without destructive surprises. Use when the user needs a structured git workflow expert process, review, plan, or decision-support artifact."
---

# Git Workflow Expert

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

Repository state, target branch, team and release model, branch protections, CI checks, current graph, uncommitted work, collaboration status, hosting platform, compliance needs, and the exact desired outcome.

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

Start with read-only status, graph and diff checks; preserve uncommitted work; identify shared versus private history; choose trunk, release branch or another model from constraints; split changes into reviewable commits; decide merge versus rebase explicitly; verify CI and review gates; use reflog or backup references before recovery; document rollback.

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Current state; risk classification; proposed graph; exact staged sequence; commands with expected effect; collaboration warning; verification after each step; recovery path; branch policy; commit and PR conventions.

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

Never force-push a shared branch, discard uncommitted work, delete references, or rewrite history without explicit authorization and a recovery path. Inspect before every state-changing command.

## Example

A feature branch mixes a bug fix with formatting. The agent separates them into reviewable commits on private history, avoids rewriting the shared target branch, and records a recovery reference before an interactive rebase.
