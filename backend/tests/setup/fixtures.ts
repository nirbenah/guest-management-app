import { randomUUID } from 'crypto';

export const TEST_USERS = {
  owner: {
    id: randomUUID(),
    email: 'owner@test.com',
    password: 'TestPass123',
    displayName: 'Event Owner',
  },
  collaborator: {
    id: randomUUID(),
    email: 'collaborator@test.com',
    password: 'TestPass123',
    displayName: 'Collaborator User',
  },
  guest: {
    id: randomUUID(),
    email: 'guest@test.com',
    password: 'TestPass123',
    displayName: 'Guest User',
  },
};

export const TEST_EVENT = {
  id: randomUUID(),
  name: 'Test Wedding Event',
  date: '2025-12-31T19:00:00.000Z',
  location: 'Test Venue Hall',
  status: 'planning',
};

export const TEST_GUESTS = [
  {
    id: randomUUID(),
    name: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    phone: '+1234567890',
    guestType: 'primary',
    dietaryRestrictions: ['vegetarian'],
    allergies: 'nuts',
    side: 'bride',
  },
  {
    id: randomUUID(),
    name: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@test.com',
    guestType: 'companion',
    side: 'bride',
  },
  {
    id: randomUUID(),
    name: 'Bob',
    lastName: 'Smith',
    email: 'bob.smith@test.com',
    guestType: 'primary',
    side: 'groom',
  },
];

export const TEST_GROUP = {
  id: randomUUID(),
  name: 'Doe Family',
  color: 'blue',
  seatingPreference: 'together',
  preferAdjacent: true,
  priority: 'high',
  notes: 'Keep family together',
};

export const TEST_VERSION = {
  id: randomUUID(),
  versionNumber: 1,
  name: 'Main Layout',
  description: 'Primary seating arrangement',
  isActive: true,
  hallDimensions: { width: 800, height: 600 },
};

export const TEST_TABLES = [
  {
    id: randomUUID(),
    name: 'Table 1',
    number: 1,
    totalSeats: 8,
    shape: 'Circle',
    section: 'Main Hall',
    position: { x: 100, y: 150 },
    color: 'gold',
    isReserved: false,
  },
  {
    id: randomUUID(),
    name: 'Table 2',
    number: 2,
    totalSeats: 6,
    shape: 'Rectangle',
    section: 'Main Hall',
    position: { x: 300, y: 150 },
    color: 'silver',
    isReserved: false,
  },
];

export const TEST_COLLABORATOR = {
  id: randomUUID(),
  role: 'editor',
  invitedAt: new Date().toISOString(),
  acceptedAt: new Date().toISOString(),
  status: 'active',
};

// Invalid data for validation tests
export const INVALID_DATA = {
  user: {
    email: 'invalid-email',
    password: '123', // Too short
    displayName: '', // Empty required field
  },
  event: {
    name: '', // Empty required field
    date: 'invalid-date',
    location: 'x'.repeat(501), // Too long
  },
  guest: {
    eventId: 'invalid-uuid',
    name: '', // Empty required field
    email: 'invalid-email',
    guestType: 'invalid-type',
  },
  table: {
    versionId: 'invalid-uuid',
    eventId: 'invalid-uuid',
    name: '', // Empty required field
    number: 0, // Invalid number
    totalSeats: 0, // Invalid capacity
    position: { x: -1, y: -1 }, // Invalid position
  },
};