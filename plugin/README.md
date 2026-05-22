# plugin

Earshot Obsidian plugin TypeScript code.

This workspace holds the plugin's entry surface (`src/main.ts`) and supporting
modules. It is bundled to the repo-root `main.js` by `../esbuild.config.mjs`,
which Obsidian loads alongside `manifest.json` and `styles.css` at the repo
root.

## Scripts

```bash
pnpm type-check    # tsc --noEmit
pnpm test          # vitest run
pnpm test:coverage # vitest run --coverage (100/100/100/100)
pnpm lint          # eslint . --max-warnings 0
pnpm depcruise     # architecture rules
pnpm stryker       # mutation testing
```

The plugin code follows the same Ferrari quality gates as the rest of the
monorepo (shared ESLint base, vitest, dependency-cruiser, stryker, knip).
