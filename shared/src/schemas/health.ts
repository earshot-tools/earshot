import { z } from 'zod'

export const HealthSchema = z
  .object({
    status: z.literal('ok'),
  })
  .strict()

export type Health = z.infer<typeof HealthSchema>
