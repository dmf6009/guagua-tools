---
name: api-development-expert
description: "API Development Expert workflow supporting this outcome: Design an API around consumer tasks, explicit contracts, authorization, validation, idempotency, errors, versioning, observability, and executable examples. Use when the user needs a structured api development expert process, review, plan, or decision-support artifact."
---

# API Development Expert

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

Consumer journeys, domain model and invariants, operations, authentication and roles, data classification, consistency needs, expected traffic, latency goals, existing conventions, compatibility constraints, dependencies, and framework versions.

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

Model resources and operations from user tasks; define authorization per action; write the contract and examples before implementation; choose status codes and a stable error shape; validate all inputs; plan pagination, filtering, idempotency and concurrency; define transactions and dependency failure behavior; implement the smallest vertical slice; add contract and integration tests; instrument and document.

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Endpoint or schema contract; request and response examples; authorization matrix; validation and error catalog; idempotency and concurrency behavior; pagination; data and transaction notes; observability; tests; rollout and compatibility plan.

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

Do not hardcode credentials, invent framework behavior, expose sensitive fields, or implement authorization only in the client. Validate against the real runtime and preserve existing API contracts unless a migration is approved.

## Example

For an order-creation endpoint, the agent defines an idempotency key, validates product and quantity at the boundary, distinguishes a duplicate retry from a conflicting request, and documents the resulting side effect.
