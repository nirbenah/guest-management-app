import { TestClient } from '../helpers/testClient';
import { TestFactory } from '../helpers/testFactory';
import { INVALID_DATA } from '../setup/fixtures';

describe('Guests CRUD', () => {
  let client: TestClient;
  let factory: TestFactory;

  beforeEach(async () => {
    client = new TestClient();
    factory = new TestFactory(client);
    await factory.reset();
  });

  describe('Create Guest', () => {
    it('should create guest successfully', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await factory.createTestGuest(event.id);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guest).toEqual({
        id: expect.any(String),
        eventId: event.id,
        name: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '+1234567890',
        guestType: 'primary',
        primaryGuestId: null,
        primaryGuestName: null,
        dietaryRestrictions: ['vegetarian'],
        allergies: 'nuts',
        currentGroup: null,
        side: 'bride',
        rsvpStatus: 'pending',
        addedByUser: expect.any(String),
        addedByName: 'Event Owner',
        approved: true,
        notes: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should validate guest data', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.createGuest({
        ...INVALID_DATA.guest,
        eventId: event.id,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should require event access', async () => {
      const { event } = await factory.createEventWithOwner();
      
      // Try with different user
      await factory.createGuestUser();
      const response = await factory.createTestGuest(event.id);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found or access denied');
    });

    it('should create companion guest', async () => {
      const { event } = await factory.createEventWithOwner();
      const primaryGuest = await factory.createTestGuest(event.id);
      const primaryGuestId = primaryGuest.body.data.guest.id;

      const response = await factory.createCompanionGuest(event.id, primaryGuestId);

      expect(response.status).toBe(201);
      expect(response.body.data.guest.guestType).toBe('companion');
      expect(response.body.data.guest.primaryGuestId).toBe(primaryGuestId);
      expect(response.body.data.guest.primaryGuestName).toBe('John');
    });
  });

  describe('Get Event Guests', () => {
    it('should get all guests for event', async () => {
      const { event, guests } = await factory.createCompleteEvent();
      const response = await client.getEventGuests(event.id);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guests).toHaveLength(guests.length);
    });

    it('should return empty array for event without guests', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.getEventGuests(event.id);

      expect(response.status).toBe(200);
      expect(response.body.data.guests).toEqual([]);
    });

    it('should include guest relationships', async () => {
      const { event } = await factory.createEventWithOwner();
      const primaryGuest = await factory.createTestGuest(event.id);
      const primaryGuestId = primaryGuest.body.data.guest.id;
      await factory.createCompanionGuest(event.id, primaryGuestId);

      const response = await client.getEventGuests(event.id);
      const companion = response.body.data.guests.find((g: any) => g.guestType === 'companion');

      expect(companion.primaryGuestName).toBe('John');
    });
  });

  describe('Get Guest by ID', () => {
    it('should get guest details', async () => {
      const { event, guests } = await factory.createCompleteEvent();
      const guestId = guests[0].id;
      const response = await client.getGuest(guestId);

      expect(response.status).toBe(200);
      expect(response.body.data.guest.id).toBe(guestId);
      expect(response.body.data.guest.name).toBe('John');
    });

    it('should return 404 for nonexistent guest', async () => {
      await factory.createEventWithOwner();
      const response = await client.getGuest('00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('Update Guest', () => {
    it('should update guest successfully', async () => {
      const { event, guests } = await factory.createCompleteEvent();
      const guestId = guests[0].id;
      const updates = {
        rsvpStatus: 'confirmed',
        notes: 'Updated guest notes',
        side: 'groom',
      };

      const response = await client.updateGuest(guestId, updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.guest.rsvpStatus).toBe('confirmed');
      expect(response.body.data.guest.notes).toBe('Updated guest notes');
      expect(response.body.data.guest.side).toBe('groom');
    });

    it('should validate update data', async () => {
      const { event, guests } = await factory.createCompleteEvent();
      const guestId = guests[0].id;
      const updates = {
        email: 'invalid-email',
        guestType: 'invalid-type',
      };

      const response = await client.updateGuest(guestId, updates);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should require editor permissions', async () => {
      const { event, collaboration } = await factory.createEventWithCollaboration();
      const guest = await factory.createTestGuest(event.id);
      
      // Test with viewer role (should fail)
      await client.updateCollaborator(collaboration.id, { role: 'viewer' });
      await factory.loginAsCollaborator();
      
      const response = await client.updateGuest(guest.body.data.guest.id, { name: 'Changed' });

      expect(response.status).toBe(403);
    });
  });

  describe('Delete Guest', () => {
    it('should delete guest successfully', async () => {
      const { event, guests } = await factory.createCompleteEvent();
      const guestId = guests[0].id;
      const response = await client.deleteGuest(guestId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      // Verify guest is deleted
      const getResponse = await client.getGuest(guestId);
      expect(getResponse.status).toBe(404);
    });

    it('should require admin permissions', async () => {
      const { event, collaboration } = await factory.createEventWithCollaboration();
      const guest = await factory.createTestGuest(event.id);
      
      // Login as editor (should fail)
      await factory.loginAsCollaborator();
      const response = await client.deleteGuest(guest.body.data.guest.id);

      expect(response.status).toBe(403);
    });
  });

  describe('RSVP Management', () => {
    it('should track RSVP status changes', async () => {
      const { event, guests } = await factory.createCompleteEvent();
      const guestId = guests[0].id;

      // Confirm RSVP
      await client.updateGuest(guestId, { rsvpStatus: 'confirmed' });
      
      // Decline RSVP
      const response = await client.updateGuest(guestId, { rsvpStatus: 'declined' });

      expect(response.body.data.guest.rsvpStatus).toBe('declined');
    });

    it('should handle dietary restrictions', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await factory.createTestGuest(event.id, {
        dietaryRestrictions: ['vegetarian', 'gluten-free'],
        allergies: 'shellfish, nuts',
      });

      expect(response.body.data.guest.dietaryRestrictions).toEqual(['vegetarian', 'gluten-free']);
      expect(response.body.data.guest.allergies).toBe('shellfish, nuts');
    });
  });

  describe('Guest Relationships', () => {
    it('should link companion guests to primary guests', async () => {
      const { event } = await factory.createEventWithOwner();
      const primary = await factory.createTestGuest(event.id);
      const companion = await factory.createCompanionGuest(event.id, primary.body.data.guest.id);

      expect(companion.body.data.guest.primaryGuestId).toBe(primary.body.data.guest.id);
      expect(companion.body.data.guest.primaryGuestName).toBe('John');
    });

    it('should handle child guests', async () => {
      const { event } = await factory.createEventWithOwner();
      const primary = await factory.createTestGuest(event.id);
      
      const child = await factory.createTestGuest(event.id, {
        name: 'Little Johnny',
        guestType: 'child',
        primaryGuestId: primary.body.data.guest.id,
      });

      expect(child.body.data.guest.guestType).toBe('child');
      expect(child.body.data.guest.primaryGuestId).toBe(primary.body.data.guest.id);
    });
  });

  describe('Guest Access Control', () => {
    it('should allow collaborator access', async () => {
      const { event, collaboration } = await factory.createEventWithCollaboration();
      const guest = await factory.createTestGuest(event.id);
      
      // Login as collaborator and access guest
      await factory.loginAsCollaborator();
      const response = await client.getGuest(guest.body.data.guest.id);

      expect(response.status).toBe(200);
    });

    it('should deny access to unauthorized users', async () => {
      const { event, guests } = await factory.createCompleteEvent();
      
      // Try to access with unauthorized user
      await factory.createGuestUser();
      const response = await client.getGuest(guests[0].id);

      expect(response.status).toBe(404);
    });
  });
});