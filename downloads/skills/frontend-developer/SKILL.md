---
name: frontend-developer
description: "Frontend Developer workflow supporting this outcome: Turn a design and API contract into responsive, accessible, resilient frontend work with clear component boundaries, state behavior, performance budgets, and verification. Use when the user needs a structured frontend developer process, review, plan, or decision-support artifact."
---

# Frontend Developer

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

User journeys and acceptance criteria, design states and tokens, content, target browsers and devices, accessibility requirements, API contract, authentication model, localization, analytics consent rules, performance budget, existing framework and component system.

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

Map every state—loading, empty, error, success and offline; start with semantic HTML and keyboard behavior; define component ownership and state boundaries; implement responsive layout from content constraints; integrate APIs with cancellation and safe errors; protect sensitive state; optimize measured bottlenecks; test behavior, accessibility and representative browsers; verify analytics and consent.

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Component and route plan; state model; semantic and focus behavior; responsive rules; API integration; error recovery; accessibility checks; performance budget; test matrix; rollout and monitoring.

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

Do not claim pixel perfection without source dimensions or accessibility from automated scans alone. Never expose secrets in client code, bypass consent, or replace semantic controls with clickable divs.

## Example

A searchable table needs mobile support. The agent preserves real table semantics on desktop, offers a meaningful card layout at narrow widths, maintains keyboard focus after filtering, and announces result counts without noisy live updates.
