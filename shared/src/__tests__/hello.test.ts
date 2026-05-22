import { describe, expect, it } from 'vitest'

import { HelloSchema, hello } from '../index.js'

describe('shared/hello', () => {
  it('returns a greeting that matches HelloSchema', () => {
    const result = hello('world')
    expect(result.message).toBe('Hello, world!')
    expect(() => HelloSchema.parse(result)).not.toThrow()
  })

  it('rejects an empty message', () => {
    expect(() => HelloSchema.parse({ message: '' })).toThrow()
  })
})
