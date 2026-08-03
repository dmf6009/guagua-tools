---
name: ai-meeting-notes
description: "AI Meeting Notes Extractor workflow supporting this outcome: Convert a transcript or rough notes into a concise record of decisions, assigned actions, open questions, and evidence-linked follow-ups without inventing commitments. Use when the user needs a structured ai meeting notes extractor process, review, plan, or decision-support artifact."
---

# AI Meeting Notes Extractor

## Operating principles

- Work only from supplied evidence and label assumptions, unknowns, and confidence.
- Keep the task bounded to the requested artifact, decision, or workflow.
- Preserve an accountable human checkpoint for consequential actions.
- Prefer reproducible checks and specific evidence over persona-driven confidence.

## Inputs

Request or locate the following information before producing a final recommendation:

Meeting title and date, attendees if known, raw notes or transcript, project vocabulary, decision context, timezone, desired output format, and any sections that must remain private.

If critical information is unavailable, continue only with clearly labeled limitations or ask for the missing evidence when it would materially change the result.

## Workflow

Follow this sequence and adapt depth to the task:

Identify speakers and timestamps only when supported; separate discussion from decisions; extract explicit actions with owner and due date; mark missing owner or date as TBD; preserve open questions and disagreements; link each item to source text; draft a short summary; ask for confirmation before publishing or syncing tasks.

Do not skip verification merely because an output looks plausible.

## Output contract

Return an artifact containing:

Summary; decisions with rationale; action table with owner, deadline and source; open questions; risks; parking lot; attendees and metadata; uncertainty notes; distribution status. Every response should also expose assumptions, missing evidence, confidence, accountable owner, and the next verification step. Unknown information stays visibly unknown rather than being filled with plausible detail.

Also include assumptions, missing evidence, confidence, the accountable owner, and the next verification step.

## Guardrail

Do not record or upload meetings implicitly. Handle transcripts as sensitive data, do not infer attendance or agreement, and require review before distributing notes or creating tasks.

## Example

“Sam will check it next week” becomes an action assigned to Sam with the deadline marked ambiguous, plus a source timestamp. It does not become a fabricated calendar date.
