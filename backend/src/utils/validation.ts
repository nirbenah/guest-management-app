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
  date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format'),
  location: z.string().max(500).optional(),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format').optional(),
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

export const updateGuestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  guestType: z.enum(['primary', 'companion', 'child']).optional(),
  primaryGuestId: z.string().uuid().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.string().max(500).optional(),
  currentGroup: z.string().uuid().optional(),
  side: z.string().max(50).optional(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe']).optional(),
  approved: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

// Group validation schemas
export const createGroupSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  name: z.string().min(1, 'Group name is required').max(100),
  color: z.string().max(20).default('blue'),
  seatingPreference: z.enum(['no_preference', 'together', 'separate', 'vip']).default('no_preference'),
  preferAdjacent: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().max(1000).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().max(20).optional(),
  seatingPreference: z.enum(['no_preference', 'together', 'separate', 'vip']).optional(),
  preferAdjacent: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().max(1000).optional(),
});

// Version validation schemas
export const createVersionSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  name: z.string().min(1, 'Version name is required').max(200),
  description: z.string().max(1000).optional(),
  hallDimensions: z.record(z.string(), z.any()).optional(),
});

export const updateVersionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  hallDimensions: z.record(z.string(), z.any()).optional(),
});

// Table validation schemas
const positionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
});

export const createTableSchema = z.object({
  versionId: z.string().uuid('Invalid version ID'),
  eventId: z.string().uuid('Invalid event ID'),
  name: z.string().min(1, 'Table name is required').max(100),
  number: z.number().int().min(1, 'Table number must be at least 1'),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1').max(50),
  shape: z.enum(['Circle', 'Rectangle', 'Square', 'Oval']).default('Circle'),
  section: z.string().max(50).optional(),
  position: positionSchema,
  color: z.string().max(20).optional(),
  adjacentTables: z.array(z.string().uuid()).default([]),
  isReserved: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

export const updateTableSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  number: z.number().int().min(1).optional(),
  totalSeats: z.number().int().min(1).max(50).optional(),
  shape: z.enum(['Circle', 'Rectangle', 'Square', 'Oval']).optional(),
  section: z.string().max(50).optional(),
  position: positionSchema.optional(),
  color: z.string().max(20).optional(),
  adjacentTables: z.array(z.string().uuid()).optional(),
  isReserved: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

// Collaborator validation schemas
export const createCollaboratorSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'editor', 'viewer']).refine(
    (val) => ['admin', 'editor', 'viewer'].includes(val),
    { message: 'Role must be admin, editor, or viewer' }
  ),
});

export const updateCollaboratorSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
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
