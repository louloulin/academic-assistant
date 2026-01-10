// Validation utilities
import { z } from 'zod';

export async function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.message}`);
    }
    throw error;
  }
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
