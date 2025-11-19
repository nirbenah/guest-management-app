import { TestClient } from '../helpers/testClient';
import { TestFactory } from '../helpers/testFactory';

describe('Integration Workflows', () => {
  let client: TestClient;
  let factory: TestFactory;

  beforeEach(async () => {
    client = new TestClient();
    factory = new TestFactory(client);
    await factory.reset();
  });

  describe('Complete Event Setup Workflow', () => {
    it('should create full event with seating arrangement', async () => {
      // 1. Create user and event
      await factory.createOwner();
      const event = await factory.createTestEvent();
      const eventId = event.body.data.event.id;

      // 2. Create guests
      const guest1 = await factory.createTestGuest(eventId);
      const guest2 = await factory.createTestGuest(eventId, { name: 'Jane', email: 'jane@test.com' });

      // 3. Create group and add guests
      const group = await factory.createTestGroup(eventId);
      const groupId = group.body.data.group.id;

      await client.updateGuest(guest1.body.data.guest.id, { currentGroup: groupId });
      await client.updateGuest(guest2.body.data.guest.id, { currentGroup: groupId });

      // 4. Create version and tables
      const version = await factory.createTestVersion(eventId);
      const versionId = version.body.data.version.id;

      const table = await factory.createTestTable(versionId, eventId);
      const tableId = table.body.data.table.id;

      // 5. Activate version
      await client.activateVersion(versionId);

      // 6. Assign guests to table
      await client.assignGuestToTable(tableId, guest1.body.data.guest.id, 1);
      await client.assignGuestToTable(tableId, guest2.body.data.guest.id, 2);

      // 7. Verify complete setup
      const finalEvent = await client.getEvent(eventId);
      const eventGuests = await client.getEventGuests(eventId);
      const eventVersions = await client.getEventVersions(eventId);
      const versionTables = await client.getVersionTables(versionId);
      const tableAssignments = await client.getTableAssignments(tableId);

      expect(finalEvent.body.data.event.status).toBe('planning');
      expect(eventGuests.body.data.guests).toHaveLength(2);
      expect(eventVersions.body.data.versions[0].isActive).toBe(true);
      expect(versionTables.body.data.tables).toHaveLength(1);
      expect(tableAssignments.body.data.assignments).toHaveLength(2);
    });
  });

  describe('Collaboration Workflow', () => {
    it('should handle multi-user collaboration', async () => {
      // 1. Owner creates event
      await factory.createOwner();
      const event = await factory.createTestEvent();
      const eventId = event.body.data.event.id;

      // 2. Owner invites collaborator
      await factory.createCollaborator();
      const collaboration = await factory.inviteTestCollaborator(eventId);

      // 3. Collaborator can access and modify event
      await factory.loginAsCollaborator();
      const eventAccess = await client.getEvent(eventId);
      expect(eventAccess.status).toBe(200);
      expect(eventAccess.body.data.event.userRole).toBe('editor');

      // 4. Collaborator creates guest
      const guest = await factory.createTestGuest(eventId);
      expect(guest.status).toBe(201);
      expect(guest.body.data.guest.addedByName).toBe('Collaborator User');

      // 5. Switch back to owner
      await factory.loginAsOwner();

      // 6. Owner can see collaborator's changes
      const guests = await client.getEventGuests(eventId);
      expect(guests.body.data.guests).toHaveLength(1);
      expect(guests.body.data.guests[0].addedByName).toBe('Collaborator User');

      // 7. Owner can modify collaborator role
      const roleUpdate = await client.updateCollaborator(collaboration.body.data.collaborator.id, { role: 'admin' });
      expect(roleUpdate.status).toBe(200);
      expect(roleUpdate.body.data.collaborator.role).toBe('admin');
    });

    it('should enforce permission levels', async () => {
      // Setup collaboration
      const { event, collaboration } = await factory.createEventWithCollaboration();
      const guest = await factory.createTestGuest(event.id);

      // Test viewer permissions
      await client.updateCollaborator(collaboration.id, { role: 'viewer' });
      await factory.loginAsCollaborator();

      // Viewer can read but not write
      const readResponse = await client.getEvent(event.id);
      expect(readResponse.status).toBe(200);

      const writeResponse = await client.updateEvent(event.id, { name: 'Changed' });
      expect(writeResponse.status).toBe(403);

      const deleteResponse = await client.deleteGuest(guest.body.data.guest.id);
      expect(deleteResponse.status).toBe(403);
    });
  });

  describe('Version Management Workflow', () => {
    it('should handle version lifecycle', async () => {
      const { event } = await factory.createEventWithOwner();
      const eventId = event.id;

      // 1. Create initial version
      const version1 = await factory.createTestVersion(eventId);
      const version1Id = version1.body.data.version.id;

      // 2. Add tables to version
      await factory.createTestTable(version1Id, eventId);
      await factory.createTestTable(version1Id, eventId, { name: 'Table 2', number: 2 });

      // 3. Activate version
      await client.activateVersion(version1Id);
      const activeCheck = await client.getVersion(version1Id);
      expect(activeCheck.body.data.version.isActive).toBe(true);

      // 4. Duplicate version
      const version2 = await client.duplicateVersion(version1Id, 'Alternative Layout');
      expect(version2.status).toBe(201);
      expect(version2.body.data.version.name).toBe('Alternative Layout');
      expect(version2.body.data.version.isActive).toBe(false);
      expect(version2.body.data.version.tableCount).toBe(2); // Tables were copied

      // 5. Activate new version (should deactivate old one)
      const version2Id = version2.body.data.version.id;
      await client.activateVersion(version2Id);

      const versionsCheck = await client.getEventVersions(eventId);
      const versions = versionsCheck.body.data.versions;
      
      const activeVersion = versions.find((v: any) => v.isActive);
      expect(activeVersion.id).toBe(version2Id);
      expect(versions.filter((v: any) => v.isActive)).toHaveLength(1); // Only one active
    });
  });

  describe('Table Assignment Workflow', () => {
    it('should handle complex table assignments', async () => {
      const setup = await factory.createEventWithSeating();
      const { event, version, tables, guests, assignments } = setup;

      // Verify initial assignments
      expect(assignments).toHaveLength(2);

      // Check table capacity enforcement
      const table1Id = tables[0].id;
      const extraGuest = await factory.createTestGuest(event.id, { name: 'Extra', email: 'extra@test.com' });
      
      // Should be able to assign within capacity
      const newAssignment = await client.assignGuestToTable(table1Id, extraGuest.body.data.guest.id, 3);
      expect(newAssignment.status).toBe(201);

      // Verify assignment shows up in table assignments
      const tableAssignments = await client.getTableAssignments(table1Id);
      expect(tableAssignments.body.data.assignments).toHaveLength(2); // Original + new

      // Test seat number conflict
      const conflictGuest = await factory.createTestGuest(event.id, { name: 'Conflict', email: 'conflict@test.com' });
      const conflictResponse = await client.assignGuestToTable(table1Id, conflictGuest.body.data.guest.id, 1); // Seat already taken
      expect(conflictResponse.status).toBe(400);
      expect(conflictResponse.body.message).toContain('already taken');
    });

    it('should prevent double assignment', async () => {
      const { event, tables, guests } = await factory.createCompleteEvent();
      const version = await factory.createTestVersion(event.id);
      const versionId = version.body.data.version.id;
      const table = await factory.createTestTable(versionId, event.id);

      // Assign guest to first table
      await client.assignGuestToTable(table.body.data.table.id, guests[0].id, 1);

      // Try to assign same guest to different table in same version
      const table2 = await factory.createTestTable(versionId, event.id, { name: 'Table 2', number: 2 });
      const doubleAssignment = await client.assignGuestToTable(table2.body.data.table.id, guests[0].id, 1);

      expect(doubleAssignment.status).toBe(400);
      expect(doubleAssignment.body.message).toContain('already assigned');
    });
  });

  describe('Group Management Workflow', () => {
    it('should handle group-based seating preferences', async () => {
      const { event } = await factory.createEventWithOwner();
      const eventId = event.id;

      // Create family group
      const familyGroup = await factory.createTestGroup(eventId, {
        name: 'Smith Family',
        seatingPreference: 'together',
        priority: 'high',
      });

      // Add family members to group
      const father = await factory.createTestGuest(eventId, { name: 'John', lastName: 'Smith' });
      const mother = await factory.createTestGuest(eventId, { name: 'Jane', lastName: 'Smith' });
      const child = await factory.createTestGuest(eventId, { 
        name: 'Tommy', 
        lastName: 'Smith',
        guestType: 'child',
        primaryGuestId: father.body.data.guest.id,
      });

      const groupId = familyGroup.body.data.group.id;
      await client.updateGuest(father.body.data.guest.id, { currentGroup: groupId });
      await client.updateGuest(mother.body.data.guest.id, { currentGroup: groupId });
      await client.updateGuest(child.body.data.guest.id, { currentGroup: groupId });

      // Verify group assignment
      const groupGuests = await client.getGroupGuests(groupId);
      expect(groupGuests.body.data.guests).toHaveLength(3);

      // Verify group details are updated
      const groupCheck = await client.getGroup(groupId);
      expect(groupCheck.body.data.group.guestCount).toBe(3);
    });

    it('should prevent deletion of groups with assigned guests', async () => {
      const { event, group, guests } = await factory.createCompleteEvent();
      
      // Assign guest to group
      await client.updateGuest(guests[0].id, { currentGroup: group.id });

      // Try to delete group with assigned guests
      const deleteResponse = await client.deleteGroup(group.id);
      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.body.message).toContain('Cannot delete group with assigned guests');

      // Remove guest from group then delete
      await client.updateGuest(guests[0].id, { currentGroup: null });
      const deleteResponse2 = await client.deleteGroup(group.id);
      expect(deleteResponse2.status).toBe(200);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle cascading deletions properly', async () => {
      const { event, version, tables, guests } = await factory.createEventWithSeating();

      // Delete event should handle all related data
      const deleteResponse = await client.deleteEvent(event.id);
      expect(deleteResponse.status).toBe(200);

      // Verify related data is inaccessible
      const guestCheck = await client.getGuest(guests[0].id);
      expect(guestCheck.status).toBe(404);

      const versionCheck = await client.getVersion(version.id);
      expect(versionCheck.status).toBe(404);
    });

    it('should handle invalid UUID parameters gracefully', async () => {
      await factory.createEventWithOwner();

      const responses = await Promise.all([
        client.getEvent('invalid-uuid'),
        client.getGuest('invalid-uuid'),
        client.getGroup('invalid-uuid'),
        client.getVersion('invalid-uuid'),
        client.getTable('invalid-uuid'),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(404);
      });
    });
  });
});