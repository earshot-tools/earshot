# Engineering research

Where to gather external facts that block an engineering decision: library versions, benchmarks, protocol support, vendor limits, documented practice.

## Flow

1. `/generate-research-brief <issue>` — Claude writes `brief-<issue>-<round>.md`.
2. Operator sends the brief to ChatGPT Deep Research (or equivalent).
3. ChatGPT returns facts in `findings-<issue>-<round>.md` (operator saves it here).
4. `/ingest-research <path>` — Claude reads findings, decides, logs `E-<issue>.md`.

## Rules

- Briefs ask for **facts**, not opinions. Reword "which is better?" as "documented benchmarks / stated support / measured throughput".
- Facts come from ChatGPT. Decisions come from Claude. Operator approves.
- One findings file per round. If facts are insufficient, generate a follow-up brief, do not guess.
