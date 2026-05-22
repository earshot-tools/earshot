---
name: pdf
description: Convert a markdown file into a professionally styled HTML document and PDF with SVG diagrams, intelligent page breaks, and a polished cover page.
---

# Generate Styled PDF from Markdown

Convert a markdown file into a professionally styled HTML document and PDF with SVG diagrams, intelligent page breaks, and a polished cover page.

## Usage

```text
/pdf <markdown-file-path> [style-template-path]
```

- `markdown-file-path` — The markdown file to convert (required)
- `style-template-path` — An existing styled HTML file to copy CSS from (optional, uses default professional style if omitted)

## Instructions

### Step 1: Read and analyze the source markdown

Read the markdown file. Analyze its structure:

- Count total lines
- Identify all headings (H1, H2, H3) and their line numbers
- Identify code blocks (``` fenced blocks)
- **Classify each code block** as one of:
  - `diagram` — ASCII art with box-drawing characters (─│┌┐└┘├┤┬┴┼), arrows (→←↑↓▶▼), flow indicators (|, v, ^), or aligned visual layouts
  - `formula` — mathematical expressions, variable definitions (where X =, R =)
  - `comparison` — side-by-side comparisons (e.g., "Traditional cramming:" vs "Spaced repetition:")
  - `code` — actual code/config (imports, function calls, file paths)
  - `table-like` — ASCII tables with alignment
- Identify tables (markdown `|---|` syntax)
- Identify blockquotes, bold/italic patterns, lists

### Step 2: Determine the CSS style

If a style template path is provided:

- Read lines 1-200 of the template to extract the `<style>` block
- Use that exact CSS, but always append the SVG and page-break CSS from below

If no template is provided, use this default professional CSS:

```css
@page {
  size: A4;
  margin: 2cm 2.5cm;
  @bottom-center {
    content: 'Page ' counter(page) ' of ' counter(pages);
    font-size: 9pt;
    color: #666;
  }
}
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #1a1a1a;
  max-width: 100%;
}
h1 {
  font-size: 22pt;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 8px;
  margin-top: 0;
  color: #1e3a5f;
}
h2 {
  font-size: 15pt;
  color: #2563eb;
  border-bottom: 1px solid #ddd;
  padding-bottom: 4px;
  margin-top: 28px;
  page-break-after: avoid;
}
h3 {
  font-size: 12pt;
  color: #1e3a5f;
  margin-top: 18px;
  page-break-after: avoid;
}
h4 {
  font-size: 10.5pt;
  color: #374151;
  margin-top: 14px;
  page-break-after: avoid;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 9.5pt;
  page-break-inside: avoid;
}
th,
td {
  border: 1px solid #d1d5db;
  padding: 6px 8px;
  text-align: left;
}
th {
  background: #f0f4ff;
  font-weight: 600;
  color: #1e3a5f;
}
tr:nth-child(even) {
  background: #f9fafb;
}
code {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 9pt;
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 3px;
}
pre {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #2563eb;
  padding: 10px 14px;
  font-size: 9pt;
  line-height: 1.45;
  overflow-x: auto;
  page-break-inside: avoid;
  border-radius: 4px;
}
pre code {
  background: none;
  padding: 0;
}
.formula-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 10px 0;
  page-break-inside: avoid;
}
.formula-box .label {
  font-weight: 600;
  color: #1e40af;
  font-size: 10pt;
  margin-bottom: 4px;
}
.note {
  background: #fefce8;
  border-left: 3px solid #eab308;
  padding: 8px 12px;
  font-size: 9.5pt;
  margin: 10px 0;
  border-radius: 0 4px 4px 0;
}
.cover {
  text-align: center;
  padding: 80px 0 40px 0;
  page-break-after: always;
}
.cover h1 {
  font-size: 28pt;
  border: none;
  margin-bottom: 10px;
}
.cover .project {
  font-size: 14pt;
  color: #2563eb;
  margin-bottom: 30px;
}
.cover .desc {
  font-size: 11pt;
  color: #555;
  max-width: 500px;
  margin: 0 auto 40px auto;
  line-height: 1.6;
}
.cover .meta-block {
  font-size: 10pt;
  color: #666;
  margin-top: 60px;
}
hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
}
/* SVG diagram styles */
.diagram-container {
  margin: 16px 0;
  text-align: center;
  page-break-inside: avoid;
}
.diagram-container svg {
  max-width: 100%;
  height: auto;
}
.diagram-caption {
  font-size: 8.5pt;
  color: #666;
  text-align: center;
  margin-top: 6px;
  font-style: italic;
}
/* Page break helpers */
.page-break-before {
  page-break-before: always;
}
.keep-together {
  page-break-inside: avoid;
}
.section-block {
  page-break-inside: avoid;
  margin-bottom: 12px;
}
/* Comparison blocks */
.comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 12px 0;
  page-break-inside: avoid;
}
.comparison-item {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 9pt;
}
.comparison-item.positive {
  border-left: 3px solid #16a34a;
}
.comparison-item.negative {
  border-left: 3px solid #dc2626;
}
.comparison-item h4 {
  margin: 0 0 6px 0;
  font-size: 9.5pt;
}
```

### Step 3: Plan the conversion

For each code block classified in Step 1, plan the conversion:

#### Diagrams → SVG

Convert ASCII diagrams to inline SVG. Common patterns:

**Flow diagrams** (vertical chains with arrows):

```text
[Step A]
    |
    v
[Step B]
    |
    v
[Step C]
```

→ Convert to SVG with rounded rectangles, connecting lines, and arrowheads.

**Box diagrams** (using ─│┌┐└┘ characters):
→ Convert to SVG rectangles with text labels.

**Tree/hierarchy diagrams** (using indentation, ^, |):
→ Convert to SVG with connected nodes.

**Simple arrow flows** (A → B → C):
→ Convert to horizontal SVG flow with boxes and arrows.

SVG guidelines:

- Use `font-family: 'Helvetica Neue', sans-serif` for text
- Box fill: `#f0f4ff`, stroke: `#2563eb`, corner radius: 6px
- Arrow color: `#6b7280`
- Text color: `#1e3a5f`
- Keep SVG width under 500px for A4 compatibility
- Add `class="diagram-container"` wrapper div
- If the ASCII diagram is too complex or ambiguous to convert reliably, keep it as `<pre><code>` instead — don't guess

#### Formulas → formula-box

```text
R = e^(-t/S)

Where:
  R = probability of remembering
  t = time since last review
  S = memory stability
```

→ Wrap in `<div class="formula-box">` with `<div class="label">` for the formula name.

#### Comparisons → side-by-side

```text
Traditional cramming:
Day 1: study study study
Day 2: (nothing)

Spaced repetition:
Day 1: study
Day 2: review
Day 4: review
```

→ Convert to `<div class="comparison">` with two `comparison-item` divs.

#### Code → pre/code (keep as-is)

Actual code stays in `<pre><code>` blocks.

### Step 4: Plan page breaks

Analyze the document structure and insert page break hints:

**Rules:**

1. Each H2 section that starts past the 60% mark of the current page should get `page-break-before: always`
2. Never break inside: tables, formula boxes, SVG diagrams, code blocks, note callouts
3. Never break between: a heading and its first paragraph/element
4. Large sections (>40 lines of HTML) should start on a fresh page
5. The cover page always has `page-break-after: always`
6. The table of contents (if present) gets `page-break-after: always`
7. Wrap heading + first content block in `<div class="section-block">` to keep them together

**Implementation:** Add `class="page-break-before"` to H2 elements that should start on a new page. The CSS handles the rest.

### Step 5: Plan the split for parallel agents

Divide the markdown into roughly equal parts:

- Under 200 lines: 2 parts
- 200-500 lines: 3 parts
- 500+ lines: 4-5 parts

**Part 1** always includes: full HTML document opening (`<!DOCTYPE html>`, `<head>` with CSS, `<body>`), cover page, table of contents, and the first batch of sections.
**Middle parts**: content sections only (no HTML wrapper).
**Last part**: final sections + footer + `</body></html>`.

### Step 6: Launch parallel agents

Launch one agent per part with these instructions:

1. The exact CSS to use
2. The markdown lines to convert (specify exact line range)
3. The code block classifications from Step 1 (so agents know which blocks to convert to SVG, formula-box, etc.)
4. Styling rules:
   - **Diagrams**: Convert classified `diagram` blocks to inline SVG (see Step 3 guidelines). If too complex, keep as `<pre><code>`.
   - **Formulas**: Wrap in `<div class="formula-box">` with `<div class="label">` for the formula name
   - **Comparisons**: Convert to `<div class="comparison">` side-by-side layout
   - **Notes/callouts**: Use `class="note"` for key insights ("Key insight:", "Important:", "Note:")
   - **Tables**: Standard `<table>` with `<th>` headers
   - **Headings**: `<h2>` with id attributes, add `class="page-break-before"` for major sections
   - **Section blocks**: Wrap heading + first element in `<div class="section-block">`
   - **Lists**: Use `<ul>`/`<ol>` with proper nesting
   - **Bold/italic**: `<strong>`/`<em>`
   - **Horizontal rules**: `<hr>`
5. Each agent writes output to `.tmp/partN.html`

**Cover page** (Part 1 only):

- Document H1 as title
- Subtitle (first italic line after H1, if present)
- Description from the introduction paragraph
- Date and author metadata
- Table of contents with linked entries

### Step 7: Assemble

```bash
cat .tmp/part1.html .tmp/part2.html ... .tmp/partN.html > .tmp/<output-name>.html
```

Verify:

- HTML is valid (opening/closing tags match)
- No duplicate `<html>`, `<head>`, `<body>` tags
- SVG elements render correctly

Clean up part files after successful assembly.

### Step 8: Generate PDF

Start a local HTTP server if not already running:

```bash
npx --yes http-server .tmp -p 8787 --cors -c-1 &
sleep 2
```

Use Playwright to navigate and generate the PDF:

```javascript
await page.goto('http://localhost:8787/<output-name>.html')
await page.pdf({
  path: '.tmp/<output-name>.pdf',
  format: 'A4',
  margin: { top: '2cm', right: '2.5cm', bottom: '2cm', left: '2.5cm' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="font-size:9px;color:#666;width:100%;text-align:center;padding:0 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
})
```

Stop the HTTP server after.

**If Playwright is unavailable**: Report the HTML path and tell the user to open it in Chrome and use Print → Save as PDF with these settings: A4, margins 2cm, background graphics enabled.

### Step 9: Quality check

After generating the PDF, verify:

- File size is reasonable (expect 200KB-1MB for a 20+ page document)
- Take a screenshot of the first page to show the user the cover
- Report any SVG conversions that were skipped (kept as pre/code)

### Step 10: Report

Tell the user:

- HTML file path: `.tmp/<name>.html`
- PDF file path: `.tmp/<name>.pdf`
- PDF file size
- Number of diagrams converted to SVG vs kept as ASCII
- Any issues encountered
- Show a screenshot of the cover page if possible

## Output naming

Derived from the input markdown file name:

- `docs/sample-document.md` → `.tmp/sample-document.html` + `.tmp/sample-document.pdf`

## Notes

- All temporary part files are cleaned up after assembly
- The HTML file is kept alongside the PDF for future edits
- Use the project's `.tmp/` folder for all temporary and output files
- SVG diagrams should be self-contained (no external references)
- When in doubt about an ASCII diagram, keep it as `<pre><code>` — a bad SVG conversion is worse than a clean ASCII block
