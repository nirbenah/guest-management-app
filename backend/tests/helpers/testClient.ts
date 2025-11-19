import request from 'supertest';
import app from '../../src/server';

export class TestClient {
  private token?: string;

  async register(userData: any) {
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    this.token = response.body.data.token;
    return response.body;
  }

  async login(credentials: any) {
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
      .expect(200);

    this.token = response.body.data.token;
    return response.body;
  }

  async getMe() {
    return request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${this.token}`)
      .expect(200);
  }

  // Event endpoints
  async createEvent(eventData: any) {
    return request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${this.token}`)
      .send(eventData);
  }

  async getEvents() {
    return request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getEvent(eventId: string) {
    return request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async updateEvent(eventId: string, updates: any) {
    return request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(updates);
  }

  async deleteEvent(eventId: string) {
    return request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getEventStats(eventId: string) {
    return request(app)
      .get(`/api/events/${eventId}/stats`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  // Guest endpoints
  async createGuest(guestData: any) {
    return request(app)
      .post('/api/guests')
      .set('Authorization', `Bearer ${this.token}`)
      .send(guestData);
  }

  async getEventGuests(eventId: string) {
    return request(app)
      .get(`/api/guests/event/${eventId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getGuest(guestId: string) {
    return request(app)
      .get(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async updateGuest(guestId: string, updates: any) {
    return request(app)
      .put(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(updates);
  }

  async deleteGuest(guestId: string) {
    return request(app)
      .delete(`/api/guests/${guestId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  // Group endpoints
  async createGroup(groupData: any) {
    return request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${this.token}`)
      .send(groupData);
  }

  async getEventGroups(eventId: string) {
    return request(app)
      .get(`/api/groups/event/${eventId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getGroup(groupId: string) {
    return request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async updateGroup(groupId: string, updates: any) {
    return request(app)
      .put(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(updates);
  }

  async deleteGroup(groupId: string) {
    return request(app)
      .delete(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getGroupGuests(groupId: string) {
    return request(app)
      .get(`/api/groups/${groupId}/guests`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  // Version endpoints
  async createVersion(versionData: any) {
    return request(app)
      .post('/api/versions')
      .set('Authorization', `Bearer ${this.token}`)
      .send(versionData);
  }

  async getEventVersions(eventId: string) {
    return request(app)
      .get(`/api/versions/event/${eventId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getVersion(versionId: string) {
    return request(app)
      .get(`/api/versions/${versionId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async updateVersion(versionId: string, updates: any) {
    return request(app)
      .put(`/api/versions/${versionId}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(updates);
  }

  async deleteVersion(versionId: string) {
    return request(app)
      .delete(`/api/versions/${versionId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async activateVersion(versionId: string) {
    return request(app)
      .post(`/api/versions/${versionId}/activate`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async duplicateVersion(versionId: string, name?: string) {
    return request(app)
      .post(`/api/versions/${versionId}/duplicate`)
      .set('Authorization', `Bearer ${this.token}`)
      .send({ name });
  }

  // Table endpoints
  async createTable(tableData: any) {
    return request(app)
      .post('/api/tables')
      .set('Authorization', `Bearer ${this.token}`)
      .send(tableData);
  }

  async getVersionTables(versionId: string) {
    return request(app)
      .get(`/api/tables/version/${versionId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getTable(tableId: string) {
    return request(app)
      .get(`/api/tables/${tableId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async updateTable(tableId: string, updates: any) {
    return request(app)
      .put(`/api/tables/${tableId}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(updates);
  }

  async deleteTable(tableId: string) {
    return request(app)
      .delete(`/api/tables/${tableId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getTableAssignments(tableId: string) {
    return request(app)
      .get(`/api/tables/${tableId}/assignments`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async assignGuestToTable(tableId: string, guestId: string, seatNumber?: number) {
    return request(app)
      .post(`/api/tables/${tableId}/assign`)
      .set('Authorization', `Bearer ${this.token}`)
      .send({ guestId, seatNumber });
  }

  // Collaborator endpoints
  async inviteCollaborator(collaboratorData: any) {
    return request(app)
      .post('/api/collaborators')
      .set('Authorization', `Bearer ${this.token}`)
      .send(collaboratorData);
  }

  async getEventCollaborators(eventId: string) {
    return request(app)
      .get(`/api/collaborators/event/${eventId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getCollaborator(collaboratorId: string) {
    return request(app)
      .get(`/api/collaborators/${collaboratorId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async updateCollaborator(collaboratorId: string, updates: any) {
    return request(app)
      .put(`/api/collaborators/${collaboratorId}`)
      .set('Authorization', `Bearer ${this.token}`)
      .send(updates);
  }

  async removeCollaborator(collaboratorId: string) {
    return request(app)
      .delete(`/api/collaborators/${collaboratorId}`)
      .set('Authorization', `Bearer ${this.token}`);
  }

  async getMyCollaborations() {
    return request(app)
      .get('/api/collaborators/my-events')
      .set('Authorization', `Bearer ${this.token}`);
  }

  // Utility methods
  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | undefined {
    return this.token;
  }

  clearToken() {
    this.token = undefined;
  }
}