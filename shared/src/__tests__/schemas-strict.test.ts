import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { SCHEMAS } from '../routes/index.js'

/**
 * Every registered schema MUST be `.strict()` so the contract can't
 * silently accept extra fields. This walks the SCHEMAS registry and
 * fails if any entry is missing `.strict()`.
 */
describe('SCHEMAS registry', () => {
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    it(`${name} is z.object(...).strict()`, () => {
      expect(schema).toBeInstanceOf(z.ZodObject)
      const objectSchema = schema as z.ZodObject<z.ZodRawShape>
      expect(objectSchema._def.unknownKeys).toBe('strict')
    })
  }
})
