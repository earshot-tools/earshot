import { z } from 'zod'

import { ProblemDetailsSchema } from '../errors/problem-details.js'
import { EchoRequestSchema, EchoResponseSchema } from '../schemas/echo.js'
import { HealthSchema } from '../schemas/health.js'
import { HelloSchema } from '../schemas/hello.js'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Sentinel response schema for `204 No Content`. The contract iterator
 * recognises this by identity and skips response-body parsing.
 */
export const NoContentSchema = z.void()

export interface RouteDef<TResponse, TBody = void> {
  readonly path: string
  readonly method: HttpMethod
  readonly response: z.ZodType<TResponse>
  /** Request body schema. `undefined` for routes without a body (GET, DELETE). */
  readonly body?: z.ZodType<TBody>
  /** Expected HTTP success status code. Defaults to 200 if omitted. */
  readonly status?: 200 | 201 | 202 | 204
  /** Optional human-readable description for OpenAPI. */
  readonly description?: string
}

/**
 * The canonical API surface. Server handlers MUST bind via `bindRoutes` so
 * paths + methods + handler signatures are all type-checked. Client fetchers
 * MUST pass these entries to `apiFetch`.
 *
 * Path params use Express `:name` syntax. The OpenAPI generator converts
 * `:name` → `{name}` and emits a `parameters` block automatically.
 */
export const API_ROUTES = {
  root: {
    path: '/',
    method: 'GET' as HttpMethod,
    response: HelloSchema,
    description: 'Returns a hello-world greeting.',
  },
  health: {
    path: '/health',
    method: 'GET' as HttpMethod,
    response: HealthSchema,
    description: 'Liveness probe.',
  },
  echo: {
    path: '/echo',
    method: 'POST' as HttpMethod,
    response: EchoResponseSchema,
    body: EchoRequestSchema,
    description: 'Echoes the request body back with a server timestamp.',
  },
  echoPut: {
    path: '/echo',
    method: 'PUT' as HttpMethod,
    response: EchoResponseSchema,
    body: EchoRequestSchema,
    description: 'Idempotent variant of POST /echo. Same semantics; demonstrates non-POST writes.',
  },
  echoDelete: {
    path: '/echo/:id',
    method: 'DELETE' as HttpMethod,
    response: NoContentSchema,
    status: 204 as const,
    description: 'No-op delete. Demonstrates path parameters + 204 No Content.',
  },
} as const

export type ApiRouteName = keyof typeof API_ROUTES

/**
 * Named-schema registry. The OpenAPI generator emits one `components/schemas`
 * entry per name and references it via `$ref` from operations + responses.
 * Adding a new schema to a route REQUIRES registering it here, otherwise the
 * generator inlines it (correct, but not idiomatic).
 *
 * `NoContent` is intentionally NOT registered — 204 responses have no body
 * and the generator special-cases the void schema.
 */
export const SCHEMAS = {
  Hello: HelloSchema,
  Health: HealthSchema,
  EchoRequest: EchoRequestSchema,
  EchoResponse: EchoResponseSchema,
  ProblemDetails: ProblemDetailsSchema,
} as const

export type SchemaName = keyof typeof SCHEMAS

/**
 * OpenAPI examples per route. Keep example data here (not on RouteDef) so the
 * runtime route table stays minimal. Skip routes with 204 responses.
 */
export const ROUTE_EXAMPLES: {
  readonly [K in ApiRouteName]?: { readonly request?: unknown; readonly response?: unknown }
} = {
  root: { response: { message: 'Hello, world!' } },
  health: { response: { status: 'ok' } },
  echo: {
    request: { message: 'ping' },
    response: { echoed: 'ping', receivedAt: '2026-01-01T00:00:00.000Z' },
  },
  echoPut: {
    request: { message: 'pong' },
    response: { echoed: 'pong', receivedAt: '2026-01-01T00:00:00.000Z' },
  },
}
