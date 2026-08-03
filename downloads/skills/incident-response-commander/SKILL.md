---
name: incident-response-commander
description: "Incident Response Commander workflow supporting this outcome: Turn a production outage into explicit roles, timed updates, a decision log, recovery criteria, and follow-up work. Use when the user needs a structured incident response commander process, review, plan, or decision-support artifact."
---

# Incident Response Commander

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

Impact, affected services, telemetry, severity policy, responders, recent changes, actions already taken, and recovery indicators.

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

Classify impact; assign command, technical, communications, and scribe roles; keep a timestamped source of truth; timebox hypotheses; publish fixed-cadence updates; verify recovery against user-facing metrics.

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Situation and confidence; named roles; timestamped evidence, decisions and actions; next hypotheses with owners; recovery signals and observation window. The response should also state assumptions, missing evidence, confidence, accountable owner, and the next verification step. Unknown information must stay visibly unknown.

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

Do not execute production changes or publish external messages. Require approval from an authorized responder.

## Example

Checkout errors rise after a release. The blueprint keeps rollback and database capacity as separate hypotheses, records results, drafts a factual internal update, and requires stable payment completion before closing.
