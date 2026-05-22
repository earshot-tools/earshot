# Questions (product / UX / business-logic)

When engineering work surfaces non-engineering ambiguity (product, UX, business-logic), use the questionnaire flow.

## Flow

1. `/generate-questionnaire` — Claude writes `XXXX-<topic>.md` here.
2. Operator sends the questionnaire to ChatGPT (or stakeholders).
3. Answers come back as `docs/answers/XXXX-<topic>.md`.
4. `/ingest-answers <path>` — Claude logs each Final Decision to `docs/decisions/product/` (or engineering if classified that way).

## Rules

- One question per missing decision. Multiple sub-questions only when they share context.
- Always cite the engineering reason the question is blocking implementation.
- ChatGPT/stakeholders own the Final Decision wording for product questions; Claude logs verbatim.
