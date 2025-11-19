import { TestClient } from './testClient';
import { clearTestData } from '../setup/database';
import { TEST_USERS, TEST_EVENT, TEST_GUESTS, TEST_GROUP, TEST_VERSION, TEST_TABLES, TEST_COLLABORATOR } from '../setup/fixtures';

export class TestFactory {
  private client: TestClient;

  constructor(client: TestClient) {
    this.client = client;
  }

  // Clear all test data
  async reset() {
    await clearTestData();
    this.client.clearToken();
  }

  // User creation and authentication
  async createOwner() {
    return this.client.register(TEST_USERS.owner);
  }

  async createCollaborator() {
    return this.client.register(TEST_USERS.collaborator);
  }

  async createGuestUser() {
    return this.client.register(TEST_USERS.guest);
  }

  async loginAsOwner() {
    return this.client.login({
      email: TEST_USERS.owner.email,
      password: TEST_USERS.owner.password,
    });
  }

  async loginAsCollaborator() {
    return this.client.login({
      email: TEST_USERS.collaborator.email,
      password: TEST_USERS.collaborator.password,
    });
  }

  async loginAsGuest() {
    return this.client.login({
      email: TEST_USERS.guest.email,
      password: TEST_USERS.guest.password,
    });
  }

  // Event setup
  async createTestEvent() {
    return this.client.createEvent(TEST_EVENT);
  }

  async createEventWithOwner() {
    await this.createOwner();
    return this.createTestEvent();
  }

  // Guest creation
  async createTestGuest(eventId: string, guestOverrides?: Partial<typeof TEST_GUESTS[0]>) {
    const guestData = { ...TEST_GUESTS[0], eventId, ...guestOverrides };
    return this.client.createGuest(guestData);
  }

  async createMultipleGuests(eventId: string) {
    const guests = [];
    for (const guestTemplate of TEST_GUESTS) {
      const response = await this.client.createGuest({ ...guestTemplate, eventId });
      guests.push(response);
    }
    return guests;
  }

  async createCompanionGuest(eventId: string, primaryGuestId: string) {
    return this.client.createGuest({
      ...TEST_GUESTS[1],
      eventId,
      primaryGuestId,
    });
  }

  // Group creation
  async createTestGroup(eventId: string, groupOverrides?: Partial<typeof TEST_GROUP>) {
    const groupData = { ...TEST_GROUP, eventId, ...groupOverrides };
    return this.client.createGroup(groupData);
  }

  // Version creation
  async createTestVersion(eventId: string, versionOverrides?: Partial<typeof TEST_VERSION>) {
    const versionData = { ...TEST_VERSION, eventId, ...versionOverrides };
    return this.client.createVersion(versionData);
  }

  // Table creation
  async createTestTable(versionId: string, eventId: string, tableOverrides?: Partial<typeof TEST_TABLES[0]>) {
    const tableData = { ...TEST_TABLES[0], versionId, eventId, ...tableOverrides };
    return this.client.createTable(tableData);
  }

  async createMultipleTables(versionId: string, eventId: string) {
    const tables = [];
    for (const tableTemplate of TEST_TABLES) {
      const response = await this.client.createTable({ ...tableTemplate, versionId, eventId });
      tables.push(response);
    }
    return tables;
  }

  // Collaborator invitation
  async inviteTestCollaborator(eventId: string, email: string = TEST_USERS.collaborator.email, role: string = 'editor') {
    return this.client.inviteCollaborator({
      eventId,
      email,
      role,
    });
  }

  // Complete test scenario setups
  async createCompleteEvent() {
    await this.createOwner();
    const event = await this.createTestEvent();
    const eventId = event.data.event.id;

    const guests = await this.createMultipleGuests(eventId);
    const group = await this.createTestGroup(eventId);
    const version = await this.createTestVersion(eventId);
    const versionId = version.data.version.id;
    const tables = await this.createMultipleTables(versionId, eventId);

    return {
      event: event.data.event,
      guests: guests.map(g => g.data.guest),
      group: group.data.group,
      version: version.data.version,
      tables: tables.map(t => t.data.table),
    };
  }

  async createEventWithCollaboration() {
    await this.createOwner();
    await this.createCollaborator();
    
    const event = await this.createTestEvent();
    const eventId = event.data.event.id;
    
    const collaboration = await this.inviteTestCollaborator(eventId);

    return {
      event: event.data.event,
      collaboration: collaboration.data.collaborator,
    };
  }

  async createEventWithSeating() {
    const setup = await this.createCompleteEvent();
    const { version, tables, guests } = setup;

    // Activate version
    await this.client.activateVersion(version.id);

    // Assign guests to tables
    const assignments = [];
    for (let i = 0; i < Math.min(guests.length, tables.length); i++) {
      const assignment = await this.client.assignGuestToTable(tables[i].id, guests[i].id, i + 1);
      assignments.push(assignment.data.assignment);
    }

    return {
      ...setup,
      assignments,
    };
  }

  // Permission scenarios
  async setupPermissionScenario() {
    // Create owner and event
    await this.createOwner();
    const event = await this.createTestEvent();
    const eventId = event.data.event.id;

    // Create collaborator and invite them
    await this.createCollaborator();
    const collaboration = await this.inviteTestCollaborator(eventId, TEST_USERS.collaborator.email, 'editor');

    // Create an uninvited user
    await this.createGuestUser();

    return {
      event: event.data.event,
      collaboration: collaboration.data.collaborator,
      ownerCredentials: { email: TEST_USERS.owner.email, password: TEST_USERS.owner.password },
      collaboratorCredentials: { email: TEST_USERS.collaborator.email, password: TEST_USERS.collaborator.password },
      uninvitedCredentials: { email: TEST_USERS.guest.email, password: TEST_USERS.guest.password },
    };
  }
}