import { validateData, createUserSchema, createEventSchema, createGuestSchema, createGroupSchema, createVersionSchema, createTableSchema, createCollaboratorSchema } from '../../src/utils/validation';
import { INVALID_DATA } from '../setup/fixtures';

describe('Validation', () => {
  describe('User Validation', () => {
    it('should validate correct user data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        phone: '+1234567890',
      };

      const result = validateData(createUserSchema, validUser);
      expect(result).toEqual(validUser);
    });

    it('should reject invalid email', () => {
      expect(() => {
        validateData(createUserSchema, { ...INVALID_DATA.user, password: 'validpass123', displayName: 'Valid Name' });
      }).toThrow('Validation failed');
    });

    it('should reject short password', () => {
      expect(() => {
        validateData(createUserSchema, { email: 'valid@test.com', password: '123', displayName: 'Valid Name' });
      }).toThrow('Password must be at least 8 characters');
    });

    it('should reject empty display name', () => {
      expect(() => {
        validateData(createUserSchema, { email: 'valid@test.com', password: 'validpass123', displayName: '' });
      }).toThrow('Display name is required');
    });
  });

  describe('Event Validation', () => {
    it('should validate correct event data', () => {
      const validEvent = {
        name: 'Test Event',
        date: '2025-12-31T19:00:00.000Z',
        location: 'Test Venue',
      };

      const result = validateData(createEventSchema, validEvent);
      expect(result).toEqual(validEvent);
    });

    it('should reject empty name', () => {
      expect(() => {
        validateData(createEventSchema, INVALID_DATA.event);
      }).toThrow('Validation failed');
    });

    it('should reject invalid date', () => {
      expect(() => {
        validateData(createEventSchema, { name: 'Valid Event', date: 'invalid-date' });
      }).toThrow('Invalid date format');
    });

    it('should handle optional location', () => {
      const eventWithoutLocation = {
        name: 'Test Event',
        date: '2025-12-31T19:00:00.000Z',
      };

      const result = validateData(createEventSchema, eventWithoutLocation);
      expect(result.location).toBeUndefined();
    });
  });

  describe('Guest Validation', () => {
    it('should validate correct guest data', () => {
      const validGuest = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '+1234567890',
        guestType: 'primary' as const,
        dietaryRestrictions: ['vegetarian'],
        allergies: 'nuts',
      };

      const result = validateData(createGuestSchema, validGuest);
      expect(result.guestType).toBe('primary');
      expect(result.dietaryRestrictions).toEqual(['vegetarian']);
    });

    it('should reject invalid UUID for eventId', () => {
      expect(() => {
        validateData(createGuestSchema, INVALID_DATA.guest);
      }).toThrow('Invalid event ID');
    });

    it('should reject invalid guest type', () => {
      expect(() => {
        validateData(createGuestSchema, {
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John',
          guestType: 'invalid-type',
        });
      }).toThrow('Validation failed');
    });

    it('should handle default values', () => {
      const minimalGuest = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John',
      };

      const result = validateData(createGuestSchema, minimalGuest);
      expect(result.guestType).toBe('primary');
      expect(result.dietaryRestrictions).toEqual([]);
    });
  });

  describe('Group Validation', () => {
    it('should validate correct group data', () => {
      const validGroup = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Family Group',
        color: 'blue',
        seatingPreference: 'together' as const,
        preferAdjacent: true,
        priority: 'high' as const,
        notes: 'Keep together',
      };

      const result = validateData(createGroupSchema, validGroup);
      expect(result).toEqual(validGroup);
    });

    it('should apply default values', () => {
      const minimalGroup = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Group',
      };

      const result = validateData(createGroupSchema, minimalGroup);
      expect(result.color).toBe('blue');
      expect(result.seatingPreference).toBe('no_preference');
      expect(result.preferAdjacent).toBe(false);
      expect(result.priority).toBe('medium');
    });

    it('should reject invalid seating preference', () => {
      expect(() => {
        validateData(createGroupSchema, {
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Group',
          seatingPreference: 'invalid-preference',
        });
      }).toThrow('Validation failed');
    });
  });

  describe('Version Validation', () => {
    it('should validate correct version data', () => {
      const validVersion = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Main Layout',
        description: 'Primary seating arrangement',
        hallDimensions: { width: 800, height: 600 },
      };

      const result = validateData(createVersionSchema, validVersion);
      expect(result).toEqual(validVersion);
    });

    it('should handle optional fields', () => {
      const minimalVersion = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Simple Layout',
      };

      const result = validateData(createVersionSchema, minimalVersion);
      expect(result.description).toBeUndefined();
      expect(result.hallDimensions).toBeUndefined();
    });
  });

  describe('Table Validation', () => {
    it('should validate correct table data', () => {
      const validTable = {
        versionId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Table 1',
        number: 1,
        totalSeats: 8,
        shape: 'Circle' as const,
        section: 'Main Hall',
        position: { x: 100, y: 150 },
        color: 'gold',
        adjacentTables: ['550e8400-e29b-41d4-a716-446655440002'],
        isReserved: false,
        notes: 'VIP table',
      };

      const result = validateData(createTableSchema, validTable);
      expect(result).toEqual(validTable);
    });

    it('should reject invalid table number', () => {
      expect(() => {
        validateData(createTableSchema, INVALID_DATA.table);
      }).toThrow('Validation failed');
    });

    it('should reject invalid position', () => {
      expect(() => {
        validateData(createTableSchema, {
          ...INVALID_DATA.table,
          versionId: '550e8400-e29b-41d4-a716-446655440000',
          eventId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Valid Table',
          number: 1,
          totalSeats: 8,
          position: { x: -1, y: -1 },
        });
      }).toThrow('Validation failed');
    });

    it('should enforce seat capacity limits', () => {
      expect(() => {
        validateData(createTableSchema, {
          versionId: '550e8400-e29b-41d4-a716-446655440000',
          eventId: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Huge Table',
          number: 1,
          totalSeats: 100, // Too many seats
          position: { x: 100, y: 150 },
        });
      }).toThrow('Validation failed');
    });

    it('should apply default values', () => {
      const minimalTable = {
        versionId: '550e8400-e29b-41d4-a716-446655440000',
        eventId: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Simple Table',
        number: 1,
        totalSeats: 6,
        position: { x: 100, y: 150 },
      };

      const result = validateData(createTableSchema, minimalTable);
      expect(result.shape).toBe('Circle');
      expect(result.adjacentTables).toEqual([]);
      expect(result.isReserved).toBe(false);
    });
  });

  describe('Collaborator Validation', () => {
    it('should validate correct collaborator data', () => {
      const validCollaborator = {
        eventId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'collaborator@example.com',
        role: 'editor' as const,
      };

      const result = validateData(createCollaboratorSchema, validCollaborator);
      expect(result).toEqual(validCollaborator);
    });

    it('should reject invalid role', () => {
      expect(() => {
        validateData(createCollaboratorSchema, {
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com',
          role: 'invalid-role',
        });
      }).toThrow('Validation failed');
    });

    it('should reject invalid email format', () => {
      expect(() => {
        validateData(createCollaboratorSchema, {
          eventId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'invalid-email',
          role: 'editor',
        });
      }).toThrow('Invalid email format');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      expect(() => {
        validateData(createUserSchema, null);
      }).toThrow('Validation failed');

      expect(() => {
        validateData(createUserSchema, undefined);
      }).toThrow('Validation failed');
    });

    it('should handle empty objects', () => {
      expect(() => {
        validateData(createEventSchema, {});
      }).toThrow('Validation failed');
    });

    it('should handle extra properties gracefully', () => {
      const userWithExtra = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        extraField: 'should be ignored',
      };

      const result = validateData(createUserSchema, userWithExtra);
      expect(result).not.toHaveProperty('extraField');
    });

    it('should preserve type safety', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      };

      const result = validateData(createUserSchema, validUser);
      
      // TypeScript should ensure these properties exist
      expect(typeof result.email).toBe('string');
      expect(typeof result.password).toBe('string');
      expect(typeof result.displayName).toBe('string');
    });
  });
});