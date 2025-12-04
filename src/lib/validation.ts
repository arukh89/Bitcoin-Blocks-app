import type { NextRequest } from 'next/server'
import type { ZodTypeAny } from 'zod'

type Output<T extends ZodTypeAny> = T['_output']

export function validateInput<T extends ZodTypeAny>(schema: T) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validated = schema.parse(body)
      return { valid: true as const, data: validated as Output<T> }
    } catch (error) {
      return { valid: false as const, error }
    }
  }
}
