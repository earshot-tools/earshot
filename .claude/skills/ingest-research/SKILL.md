---
name: ingest-research
description: Ingest a ChatGPT Deep Research findings file, interpret the facts, make the engineering decision, and log it to docs/decisions/engineering/E-XXXX.md. Use after findings-{issue}-{round}.md has been saved from ChatGPT.
argument-hint: '<path-to-findings-file>'
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Ingest Research

Findings file: `$ARGUMENTS`

## Goal

Read the provided findings markdown file, **interpret the facts**, and record the resulting engineering decision via `/engineering-decision-manager`. If findings are insufficient, generate a follow-up brief instead of guessing.

## Key rule — you (Claude) decide

| Step                          | Owner                                        |
| ----------------------------- | -------------------------------------------- |
| Gathered facts                | ChatGPT                                      |
| Interpret facts               | Claude                                       |
| Weigh trade-offs              | Claude                                       |
| Make the engineering decision | Claude                                       |
| Log to E-XXXX.md              | Claude (via `/engineering-decision-manager`) |

This is the inverse of `/ingest-answers` (product). There, the answer-author decides and Claude logs verbatim. Here, ChatGPT only reports facts — Claude weighs them and decides.

## Workflow

1. Read the findings file at `$ARGUMENTS`.
2. Identify the question that prompted the brief (link to `brief-<n>-<k>.md`).
3. Map each fact to one of: supports option A / supports option B / inconclusive / contradicts both.
4. If inconclusive on the central question → generate a follow-up brief, do NOT guess.
5. If sufficient → write the decision text and route to `/engineering-decision-manager` with the issue number.
6. Mark the round in the file header (so future rounds chain).

## Pre-flight checklist

- [ ] Findings file exists at the provided path.
- [ ] The originating brief file is present in the same dir.
- [ ] Issue number derivable from filename.

## Output

Print:

- Decision summary (1–2 sentences).
- The new `E-<n>.md` file path.
- Any facts that remained inconclusive (operator can review).
