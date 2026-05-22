# shared

Cross-workspace contracts for `earshot`: Zod schemas, derived
TypeScript types, and the typed route registry consumed by both the server
(handlers) and clients (`apiFetch`).

## Pattern

Zod schemas are the **single source of truth**. Types are derived via
`z.infer<typeof Schema>`. The same schema validates the server's response and
parses the client's incoming payload — drift between the two ends becomes a
type error or a contract-test failure.

```text
shared/
├── src/
│   ├── schemas/             # Zod object schemas for wire shapes
│   │   ├── hello.ts
│   │   └── health.ts
│   ├── errors/              # RFC 7807 Problem Details + project error types
│   │   └── problem-details.ts
│   ├── routes/              # The typed API route registry
│   │   └── index.ts
│   └── index.ts             # Public barrel — consumers import from here only
```

## Adding an API endpoint

1. Add the Zod schema in `src/schemas/<feature>.ts`.
2. Add a `RouteDef` entry in `src/routes/index.ts`:

   ```ts
   newThing: { path: '/things/:id', method: 'GET', response: ThingSchema },
   ```

3. Re-export from `src/index.ts`.
4. Bind the handler in `server/`:

   ```ts
   app.get(API_ROUTES.newThing.path, (req, res) => res.json(thing))
   ```

5. Call from the client in `app/`:

   ```ts
   const thing = await apiFetch(API_ROUTES.newThing)
   ```

6. Add a per-route assertion to
   `server/src/__tests__/contract.test.ts` so wire-shape drift fails fast.

## Conventions

- TypeScript strict.
- Zod is the only validation library.
- `z.infer` for derived types — no manually maintained TS types that shadow a schema.
- `as const` objects for enumerations — no `enum` keyword.
- Barrel exports via `src/index.ts`. Consumers in other workspaces import the
  package by name (`@earshot-tools/earshot-shared`)
  — never deep paths into `schemas/`, `errors/`, or `routes/`.
- Every public export needs a contract test under `src/__tests__/`.
- A breaking change requires updating every consumer in the same PR.

## Scripts

```bash
pnpm type-check    # tsc --noEmit
pnpm test          # vitest run
pnpm test:coverage # vitest run --coverage (100/100/100/100)
pnpm lint          # eslint . --max-warnings 0
pnpm depcruise     # architecture rules: tests must use the barrel
pnpm stryker       # mutation testing — proves the tests actually catch regressions
```
