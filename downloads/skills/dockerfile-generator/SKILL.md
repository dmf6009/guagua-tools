---
name: dockerfile-generator
description: "Dockerfile Generator workflow supporting this outcome: Create a production-ready container build from verified project requirements, with deliberate base-image choices, cache behavior, runtime permissions, health checks, and reproducible verification. Use when the user needs a structured dockerfile generator process, review, plan, or decision-support artifact."
---

# Dockerfile Generator

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

Repository structure, language and runtime versions, package manager and lockfile, build and start commands, native dependencies, exposed port, health endpoint, target CPU, deployment runtime, registry policy, size and security constraints.

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

Inspect the real build path; choose a maintained, compatible base and pin deliberately; separate dependency, build and runtime stages; design cache-friendly copy order; add a focused dockerignore; run as a non-root user; keep secrets outside layers; define signals and shutdown behavior; build and test on the target architecture; scan and record provenance.

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Dockerfile; dockerignore; build command; runtime command; required environment variables without values; ports and health check; user and filesystem permissions; cache rationale; expected artifacts; verification commands; image scan and update notes.

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

Never embed credentials, private registry tokens, or production configuration. Do not invent exact image size or claim security from a Dockerfile review alone; build, test, scan, and review licenses.

## Example

A Node service needs a native module. The agent keeps build tools in the builder stage, copies only production dependencies and compiled output, runs under an unprivileged UID, and verifies the image on the deployment architecture.
