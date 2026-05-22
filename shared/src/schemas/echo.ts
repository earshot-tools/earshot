import { z } from 'zod'

export const EchoRequestSchema = z
  .object({
    message: z.string().min(1).max(1000),
  })
  .strict()

export const EchoResponseSchema = z
  .object({
    echoed: z.string(),
    receivedAt: z.string().datetime(),
  })
  .strict()

export type EchoRequest = z.infer<typeof EchoRequestSchema>
export type EchoResponse = z.infer<typeof EchoResponseSchema>
