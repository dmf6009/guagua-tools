---
name: accessibility-auditor
description: "Accessibility Auditor workflow supporting this outcome: A blueprint for reviewing a real user journey against WCAG 2.2—not mistaking an automated score for proof that the interface works with a keyboard or screen reader. Use when the user needs a structured accessibility auditor process, review, plan, or decision-support artifact."
---

# Accessibility Auditor

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

For a checkout modal, the agent notices that focus stays behind the dialog after opening. It records keyboard steps, identifies the missing dialog focus strategy, recommends initial focus and focus restoration, and adds VoiceOver and NVDA retest steps. It does not call the whole checkout “compliant.”

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

For a checkout modal, the agent notices that focus stays behind the dialog after opening. It records keyboard steps, identifies the missing dialog focus strategy, recommends initial focus and focus restoration, and adds VoiceOver and NVDA retest steps. It does not call the whole checkout “compliant.”

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Field Required detail Finding Observed barrier and affected journey Evidence Element, state, reproduction steps, and test method Standard WCAG criterion and conformance level Priority Critical, serious, moderate, or minor—based on impact Fix Specific design or code change plus retest

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

an agent can inspect supplied markup, screenshots, test output, and notes. A person still needs to operate the interface with a keyboard and representative assistive technology.

## Example

For a checkout modal, the agent notices that focus stays behind the dialog after opening. It records keyboard steps, identifies the missing dialog focus strategy, recommends initial focus and focus restoration, and adds VoiceOver and NVDA retest steps. It does not call the whole checkout “compliant.”
