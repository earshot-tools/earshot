import { z } from 'zod'

/**
 * RFC 7807 Problem Details — the wire shape the server emits via the
 * `problemDetailsErrorHandler` middleware. Clients parse error responses
 * with this schema so the error type is consistent across workspaces.
 */
export const ProblemDetailsSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .strict()

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>
