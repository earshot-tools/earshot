#!/usr/bin/env node
/**
 * Generate openapi.json from the shared API_ROUTES + SCHEMAS registries.
 *
 *  - Walks SCHEMAS to emit `components/schemas/<Name>`.
 *  - Walks API_ROUTES to emit operations; each request/response body
 *    references the named schema via `$ref` instead of inlining.
 *  - Walks ROUTE_EXAMPLES to attach `examples` to request/response media types.
 *  - Converts Express `:name` path params to OpenAPI `{name}` + emits a
 *    `parameters` block for each.
 *  - Honors `route.status` (e.g. 204 → no response body).
 *
 * Run: pnpm openapi
 * Output: openapi.json at repo root.
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { API_ROUTES, NoContentSchema, ROUTE_EXAMPLES, SCHEMAS } from '@earshot-tools/earshot-shared'
import { zodToJsonSchema } from 'zod-to-json-schema'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PATH_PARAM_REGEX = /:([a-zA-Z]\w*)/g

function schemaNameFor(zodSchema) {
  for (const [name, candidate] of Object.entries(SCHEMAS)) {
    if (candidate === zodSchema) return name
  }
  return null
}

function refFor(zodSchema) {
  const name = schemaNameFor(zodSchema)
  if (name === null) {
    throw new Error(`schema is not registered in SCHEMAS — add it to shared/src/routes/index.ts`)
  }
  return { $ref: `#/components/schemas/${name}` }
}

function expressPathToOpenApi(expressPath) {
  return expressPath.replace(PATH_PARAM_REGEX, (_match, key) => `{${key}}`)
}

function pathParamNames(expressPath) {
  return [...expressPath.matchAll(PATH_PARAM_REGEX)].map((m) => m[1])
}

export function buildOpenApi() {
  const components = { schemas: {} }
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    components.schemas[name] = zodToJsonSchema(schema, { target: 'openApi3' })
  }

  const problemContent = {
    'application/problem+json': { schema: refFor(SCHEMAS.ProblemDetails) },
  }

  const paths = {}
  for (const [routeName, route] of Object.entries(API_ROUTES)) {
    const examples = ROUTE_EXAMPLES[routeName] ?? {}
    const successStatus = route.status ?? 200
    const isNoContent = route.response === NoContentSchema

    const successResponse = isNoContent
      ? { description: 'No Content' }
      : (() => {
          const responseContent = { 'application/json': { schema: refFor(route.response) } }
          if (examples.response !== undefined) {
            responseContent['application/json'].examples = {
              default: { value: examples.response },
            }
          }
          return { description: 'OK', content: responseContent }
        })()

    const operation = {
      operationId: routeName,
      tags: ['API'],
      summary: route.description ?? '',
      description: route.description ?? '',
      responses: {
        [String(successStatus)]: successResponse,
        400: { description: 'Bad Request — RFC 7807 Problem Details', content: problemContent },
        406: { description: 'Not Acceptable — RFC 7807 Problem Details', content: problemContent },
        500: {
          description: 'Internal Server Error — RFC 7807 Problem Details',
          content: problemContent,
        },
      },
    }

    const params = pathParamNames(route.path)
    if (params.length > 0) {
      operation.parameters = params.map((p) => ({
        name: p,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      }))
    }

    if (route.body) {
      const requestContent = { 'application/json': { schema: refFor(route.body) } }
      if (examples.request !== undefined) {
        requestContent['application/json'].examples = {
          default: { value: examples.request },
        }
      }
      operation.requestBody = { required: true, content: requestContent }
    }

    const openApiPath = expressPathToOpenApi(route.path)
    paths[openApiPath] ??= {}
    paths[openApiPath][route.method.toLowerCase()] = operation
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'earshot',
      version: '0.1.0',
      description:
        'Local-only botless meeting capture, transcription, and speaker labeling for Obsidian on macOS.',
      contact: { name: 'Inoyatov Khamidulla' },
      license: { name: 'MIT' },
    },
    servers: [{ url: '/', description: 'Same-origin (default)' }],
    tags: [{ name: 'API', description: 'Default API surface' }],
    components,
    paths,
  }
}

export const OPENAPI_PATH = path.join(REPO_ROOT, 'openapi.json')

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) {
  writeFileSync(OPENAPI_PATH, `${JSON.stringify(buildOpenApi(), null, 2)}\n`)
  console.log(`[generate-openapi] wrote ${path.relative(REPO_ROOT, OPENAPI_PATH)}`)
}
