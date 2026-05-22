/**
 * Public API of @earshot-tools/earshot-shared.
 *
 * Consumers (server, web, app) import from this barrel only. Deep imports
 * into `./schemas/`, `./errors/`, `./routes/` are blocked by the dependency
 * cruiser rule.
 */

export { HelloSchema, type Hello, hello } from './schemas/hello.js'
export { HealthSchema, type Health } from './schemas/health.js'
export {
  EchoRequestSchema,
  EchoResponseSchema,
  type EchoRequest,
  type EchoResponse,
} from './schemas/echo.js'
export { ProblemDetailsSchema, type ProblemDetails } from './errors/problem-details.js'
export {
  API_ROUTES,
  NoContentSchema,
  ROUTE_EXAMPLES,
  SCHEMAS,
  type ApiRouteName,
  type HttpMethod,
  type RouteDef,
  type SchemaName,
} from './routes/index.js'
