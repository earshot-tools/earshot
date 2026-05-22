---
name: ingest-answers
description: Ingest a ChatGPT/stakeholder answers markdown file, extract final decisions, append them to the project decision log, and summarize implementation impact. Use manually after the user provides answers.
argument-hint: '[path-to-answers-file]'
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Ingest Answers

Answers file: `$ARGUMENTS`

## Goal

Read the provided answers markdown file, extract each `Final Decision`, and convert those decisions into durable project artifacts.

## Commands used

`Read` (answers file, decision logs, CLAUDE.md), `Grep` (find next D/E number, check conflicts), `Edit` (append to decision logs, update system docs).

## Pre-flight checklist

- [ ] Answers file exists at the provided path.
- [ ] Read both decision directories to determine next `D-XXXX` and `E-XXXX` numbers.
- [ ] Read `CLAUDE.md` for current protocol.

## Workflow

1. Parse each `Final Decision:` block in the answers file.
2. Classify each as PRODUCT or ENGINEERING.
3. For PRODUCT decisions → route to `/product-decision-manager` with the verbatim decision text.
4. For ENGINEERING decisions → route to `/engineering-decision-manager`.
5. Note any answers that say "no decision yet" / "defer" — surface these as follow-up questions, do not invent decisions.

## Key rule

Here, the answer-author (operator / ChatGPT / stakeholder) decides. Claude logs **verbatim**. Claude does NOT reinterpret product decisions.

Contrast with `/ingest-research`, where ChatGPT only reports facts and Claude decides.

## Output

Print a report:

- Number of decisions logged.
- File paths for each new `D-<n>.md` / `E-<n>.md`.
- Any deferred or ambiguous answers that need follow-up.
