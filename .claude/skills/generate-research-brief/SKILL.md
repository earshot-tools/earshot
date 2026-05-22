---
name: generate-research-brief
description: 'Generate a ChatGPT Deep Research brief when an engineering decision is blocked by missing external facts: library versions, benchmarks, protocol support, ecosystem status, vendor limits, current official engineering practice, or AI-agent workflow mechanics. ChatGPT researches facts only — Claude decides.'
argument-hint: '<issue-number> [topic-hint]'
disable-model-invocation: false
allowed-tools: Read Grep Glob Edit Write Bash
---

# Generate Research Brief

You are generating a **research brief** for ChatGPT Deep Research (or equivalent). ChatGPT researches facts — you (Claude) decide.

Issue number: `$1`
Topic hint: `$2`

## Goal

Create a markdown file at `docs/engineering-research/brief-{issue}-{round}.md` that asks for **verified external facts** needed before an engineering decision can be made. Research scope is limited to things Claude cannot determine from the codebase alone — upstream library versions, protocol/API status, vendor pricing, benchmarks, ecosystem compatibility, current documented engineering practice, or current AI-agent workflow mechanics.

## Key rule — research vs decision

| Step                  | Owner                                        |
| --------------------- | -------------------------------------------- |
| Generate brief        | Claude                                       |
| Gather external facts | ChatGPT Deep Research                        |
| Interpret facts       | Claude                                       |
| Make the decision     | Claude                                       |
| Log E-XXXX            | Claude (via `/engineering-decision-manager`) |

ChatGPT MUST NOT make engineering recommendations. Briefs ask for facts, not opinions. If a brief slips into "which is better?", rewrite it as "measured benchmarks / documented capabilities / stated support status".

## Brief shape

```markdown
# Research brief — issue #<n>, round <k>

## Context (1 paragraph)

<what we are trying to decide, and why local sources don't answer it>

## Facts requested

1. **<topic A>**
   - What official documentation states about X.
   - Measured benchmarks for Y (link to source).
   - Vendor-stated support status for Z (link).
2. **<topic B>**
   - ...

## Sources to prioritise

- Official docs / RFCs / standards
- Vendor announcements with timestamps
- Recent (last 12 months) benchmarks from reputable third parties
- Avoid: blog opinion, marketing pages without numbers, training-data summaries

## Output format

A markdown findings file with one section per topic, each citing source URLs.
```

## Pre-flight checklist

- [ ] Issue number provided.
- [ ] Existing briefs for this issue grep'd to determine round number.
- [ ] Local files and decisions read first — confirm the gap is genuinely external.

## Output

Print the file path: `docs/engineering-research/brief-<issue>-<round>.md`.
Tell the operator: "Send this to ChatGPT Deep Research. Save the response as `findings-<issue>-<round>.md` in the same dir, then run `/ingest-research`."
