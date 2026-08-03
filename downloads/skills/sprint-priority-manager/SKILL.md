---
name: sprint-priority-manager
description: "Sprint Priority Manager workflow supporting this outcome: Compare work against capacity, dependencies, risk, and evidence instead of letting urgency decide the sprint. Use when the user needs a structured sprint priority manager process, review, plan, or decision-support artifact."
---

# Sprint Priority Manager

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

Sprint goal, candidate items, user or business evidence, effort ranges, dependencies, deadlines, team capacity, carryover, operational load, and risk constraints.

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

Confirm one sprint goal; reserve capacity for operations; remove unready work; score value, urgency, confidence, effort, and risk; expose dependencies; test alternative portfolios; define explicit cuts and success signals.

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Ranked items with score rationale; capacity allocation; dependency order; committed versus stretch scope; cut line; risks; owner; measurable completion evidence. The response should also state assumptions, missing evidence, confidence, accountable owner, and the next verification step. Unknown information must stay visibly unknown.

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

Do not fabricate precision. Scores support judgment; they do not replace product evidence, engineering estimates, or the accountable product owner.

## Example

A loud feature request loses to a smaller authentication fix because the latter blocks activation, has stronger evidence, and fits the available backend capacity. The trade-off is written down for stakeholders.
