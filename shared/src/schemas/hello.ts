import { z } from 'zod'

export const HelloSchema = z
  .object({
    message: z.string().min(1),
  })
  .strict()

export type Hello = z.infer<typeof HelloSchema>

export const hello = (name: string): Hello => HelloSchema.parse({ message: `Hello, ${name}!` })
