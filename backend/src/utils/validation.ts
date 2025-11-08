import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Event validation schemas
export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  date: z.string().datetime('Invalid date format'),
  location: z.string().max(500).optional(),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
  status: z.enum(['planning', 'active', 'completed', 'archived']).optional(),
});

// Guest validation schemas
export const createGuestSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  name: z.string().min(1, 'Guest name is required').max(100),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  guestType: z.enum(['primary', 'companion', 'child']).default('primary'),
  primaryGuestId: z.string().uuid().optional(),
  dietaryRestrictions: z.array(z.string()).default([]),
  allergies: z.string().max(500).optional(),
  currentGroup: z.string().uuid().optional(),
  side: z.string().max(50).optional(),
});

// Utility function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}
