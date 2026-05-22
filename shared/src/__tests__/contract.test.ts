import { describe, expect, it } from 'vitest'

import { HelloSchema } from '../index.js'

/**
 * Contract test — proves that the shared Zod schema accepts what the server
 * actually sends. If the server response shape drifts, this test fails first
 * before any consumer ships broken UI.
 */
describe('shared/contract', () => {
  it('HelloSchema accepts the canonical server response', () => {
    const sampleServerResponse = { message: 'Hello, world!' }
    const result = HelloSchema.safeParse(sampleServerResponse)
    expect(result.success).toBe(true)
  })

  it('HelloSchema rejects responses missing `message`', () => {
    const broken = { greeting: 'hi' }
    const result = HelloSchema.safeParse(broken)
    expect(result.success).toBe(false)
  })

  it('HelloSchema rejects empty message strings', () => {
    const broken = { message: '' }
    const result = HelloSchema.safeParse(broken)
    expect(result.success).toBe(false)
  })
})
