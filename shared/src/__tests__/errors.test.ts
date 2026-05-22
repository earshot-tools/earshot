import { describe, expect, it } from 'vitest'

import { ProblemDetailsSchema } from '../index.js'

describe('shared/errors/ProblemDetailsSchema', () => {
  it('accepts a minimal RFC 7807 body', () => {
    const result = ProblemDetailsSchema.safeParse({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
    })
    expect(result.success).toBe(true)
  })

  it('accepts the full RFC 7807 shape', () => {
    const result = ProblemDetailsSchema.safeParse({
      type: 'https://example.com/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: 'No user with id 42',
      instance: '/users/42',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a body missing required fields', () => {
    const result = ProblemDetailsSchema.safeParse({ title: 'oops' })
    expect(result.success).toBe(false)
  })
})
