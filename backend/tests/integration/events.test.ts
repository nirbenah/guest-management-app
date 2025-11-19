import { TestClient } from '../helpers/testClient';
import { TestFactory } from '../helpers/testFactory';
import { INVALID_DATA } from '../setup/fixtures';

describe('Events CRUD', () => {
  let client: TestClient;
  let factory: TestFactory;

  beforeEach(async () => {
    client = new TestClient();
    factory = new TestFactory(client);
    await factory.reset();
  });

  describe('Create Event', () => {
    it('should create event successfully', async () => {
      await factory.createOwner();
      const response = await factory.createTestEvent();

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event created successfully');
      expect(response.body.data.event).toEqual({
        id: expect.any(String),
        name: 'Test Wedding Event',
        date: '2025-12-31T19:00:00.000Z',
        location: 'Test Venue Hall',
        status: 'planning',
        ownerUserId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should require authentication', async () => {
      client.clearToken();
      const response = await factory.createTestEvent();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate event data', async () => {
      await factory.createOwner();
      const response = await client.createEvent(INVALID_DATA.event);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
    });
  });

  describe('Get Events', () => {
    it('should get user events', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.getEvents();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0].id).toBe(event.id);
    });

    it('should return empty array for new user', async () => {
      await factory.createOwner();
      const response = await client.getEvents();

      expect(response.status).toBe(200);
      expect(response.body.data.events).toEqual([]);
    });

    it('should include user role in response', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.getEvents();

      expect(response.body.data.events[0].userRole).toBe('owner');
    });
  });

  describe('Get Event by ID', () => {
    it('should get event details', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.getEvent(event.id);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event.id).toBe(event.id);
      expect(response.body.data.event.name).toBe('Test Wedding Event');
    });

    it('should return 404 for nonexistent event', async () => {
      await factory.createOwner();
      const response = await client.getEvent('00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should deny access to unauthorized users', async () => {
      // Create event with owner
      const { event } = await factory.createEventWithOwner();
      
      // Try to access with different user
      await factory.createGuestUser();
      const response = await client.getEvent(event.id);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found or access denied');
    });
  });

  describe('Update Event', () => {
    it('should update event successfully', async () => {
      const { event } = await factory.createEventWithOwner();
      const updates = {
        name: 'Updated Event Name',
        status: 'active',
      };

      const response = await client.updateEvent(event.id, updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event.name).toBe('Updated Event Name');
      expect(response.body.data.event.status).toBe('active');
    });

    it('should validate update data', async () => {
      const { event } = await factory.createEventWithOwner();
      const updates = {
        name: '', // Invalid empty name
        date: 'invalid-date',
      };

      const response = await client.updateEvent(event.id, updates);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Validation failed');
    });

    it('should deny update to non-owners', async () => {
      // Create event with owner
      const { event } = await factory.createEventWithOwner();
      
      // Try to update with different user
      await factory.createGuestUser();
      const response = await client.updateEvent(event.id, { name: 'Hacked Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('Delete Event', () => {
    it('should delete event successfully', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.deleteEvent(event.id);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      // Verify event is deleted
      const getResponse = await client.getEvent(event.id);
      expect(getResponse.status).toBe(404);
    });

    it('should only allow owners to delete', async () => {
      // Create event with owner
      const { event } = await factory.createEventWithOwner();
      
      // Try to delete with different user
      await factory.createGuestUser();
      const response = await client.deleteEvent(event.id);

      expect(response.status).toBe(404);
    });
  });

  describe('Event Statistics', () => {
    it('should get event stats', async () => {
      const { event } = await factory.createEventWithOwner();
      await factory.createTestGuest(event.id);

      const response = await client.getEventStats(event.id);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toEqual({
        eventId: event.id,
        totalGuests: 1,
        confirmedGuests: 1,
        versionsCount: 0,
        collaboratorsCount: 0,
      });
    });

    it('should return zero stats for new event', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.getEventStats(event.id);

      expect(response.status).toBe(200);
      expect(response.body.data.stats.totalGuests).toBe(0);
    });
  });

  describe('Event Access Control', () => {
    it('should allow collaborator access', async () => {
      const { event, collaboration } = await factory.createEventWithCollaboration();
      
      // Login as collaborator
      await factory.loginAsCollaborator();
      const response = await client.getEvent(event.id);

      expect(response.status).toBe(200);
      expect(response.body.data.event.userRole).toBe('editor');
    });

    it('should include owner information', async () => {
      const { event } = await factory.createEventWithOwner();
      const response = await client.getEvent(event.id);

      expect(response.body.data.event.ownerName).toBe('Event Owner');
    });
  });
});