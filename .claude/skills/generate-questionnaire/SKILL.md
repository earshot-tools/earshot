---
name: generate-questionnaire
description: Generate a focused markdown questionnaire when non-engineering decisions are missing or ambiguous. Use this manually after engineering discussion reveals a real product, UX, business-logic, or domain blocker.
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Generate Questionnaire

You are generating a questionnaire for an answer-author (operator, ChatGPT, stakeholder, domain expert).

## Goal

Create a markdown file under `docs/questions/` that asks only the missing non-engineering questions needed to continue implementation.

## Commands used

`Read` (decisions, system docs, answers, questions), `Grep` (duplicate check), `Write` (new questions file).

## Pre-flight checklist

- [ ] Read decision directories (`docs/decisions/product/`, `docs/decisions/engineering/`).
- [ ] Check trigger rule is met — at least one valid blocker exists (a product/UX/business-logic question that genuinely blocks implementation).
- [ ] Check for duplicate questions in existing `docs/questions/` files.
- [ ] Find next XXXX number from existing question files.

## Questionnaire shape

```markdown
# Questionnaire — <topic> (XXXX)

## Engineering context (why this is blocking)

<1 paragraph: what code can't be written until these decisions are made>

## Questions

1. **<question 1>**
   - Background: <why this matters in 1–2 sentences>
   - Options if helpful: A / B / C
   - Final Decision: <answer here>
2. **<question 2>**
   - Background:
   - Final Decision:
```

## Output format

Print:

- File path: `docs/questions/XXXX-<topic>.md`.
- Number of open questions.
- Instructions to the operator: "Send to ChatGPT/stakeholder, save the response under `docs/answers/XXXX-<topic>.md`, then run `/ingest-answers`."
