import { describe, expect, it } from 'vitest'

import { API_ROUTES, HelloSchema, HealthSchema } from '../index.js'

describe('shared/routes', () => {
  it('exposes a root route bound to HelloSchema', () => {
    expect(API_ROUTES.root.path).toBe('/')
    expect(API_ROUTES.root.method).toBe('GET')
    expect(API_ROUTES.root.response).toBe(HelloSchema)
  })

  it('exposes a health route bound to HealthSchema', () => {
    expect(API_ROUTES.health.path).toBe('/health')
    expect(API_ROUTES.health.method).toBe('GET')
    expect(API_ROUTES.health.response).toBe(HealthSchema)
  })
})
