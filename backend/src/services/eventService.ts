import { Client } from 'pg';
import { randomUUID } from 'crypto';
import { CreateEventRequest, UpdateEventRequest } from '../types';

const dbClient = new Client(process.env.DATABASE_URL);

export class EventService {
  private async getDbClient() {
    try {
      await dbClient.connect();
    } catch (error) {
      // Connection already exists or other connection error
    }
    return dbClient;
  }

  async createEvent(userId: string, data: CreateEventRequest) {
    const client = await this.getDbClient();
    
    const eventId = randomUUID();
    const eventDate = new Date(data.date);
    
    // Create event
    await client.query(
      `INSERT INTO events (id, name, date, location, status, owner_user_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [eventId, data.name, eventDate, data.location || null, 'planning', userId]
    );

    // Get created event
    const eventResult = await client.query(
      `SELECT id, name, date, location, status, owner_user_id, created_at, updated_at 
       FROM events WHERE id = $1`,
      [eventId]
    );

    return this.formatEvent(eventResult.rows[0]);
  }

  async getUserEvents(userId: string) {
    const client = await this.getDbClient();
    
    // Get events owned by user or where user is collaborator
    const result = await client.query(
      `SELECT DISTINCT e.id, e.name, e.date, e.location, e.status, e.owner_user_id, 
              e.created_at, e.updated_at, u.display_name as owner_name,
              CASE WHEN e.owner_user_id = $1 THEN 'owner' 
                   ELSE COALESCE(ec.role, 'none') END as user_role
       FROM events e
       LEFT JOIN users u ON e.owner_user_id = u.id
       LEFT JOIN event_collaborators ec ON e.id = ec.event_id AND ec.user_id = $1
       WHERE e.owner_user_id = $1 OR ec.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => this.formatEvent(row));
  }

  async getEventById(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Check if user has access to this event
    const accessCheck = await client.query(
      `SELECT e.*, u.display_name as owner_name,
              CASE WHEN e.owner_user_id = $2 THEN 'owner' 
                   ELSE COALESCE(ec.role, 'none') END as user_role
       FROM events e
       LEFT JOIN users u ON e.owner_user_id = u.id
       LEFT JOIN event_collaborators ec ON e.id = ec.event_id AND ec.user_id = $2
       WHERE e.id = $1 AND (e.owner_user_id = $2 OR ec.user_id = $2)`,
      [eventId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Event not found or access denied');
    }

    return this.formatEvent(accessCheck.rows[0]);
  }

  async updateEvent(eventId: string, userId: string, updates: UpdateEventRequest) {
    const client = await this.getDbClient();
    
    // Check if user owns the event or is admin
    const permissionCheck = await client.query(
      `SELECT e.owner_user_id, COALESCE(ec.role, 'none') as user_role
       FROM events e
       LEFT JOIN event_collaborators ec ON e.id = ec.event_id AND ec.user_id = $2
       WHERE e.id = $1`,
      [eventId, userId]
    );

    if (permissionCheck.rows.length === 0) {
      throw new Error('Event not found');
    }

    const { owner_user_id, user_role } = permissionCheck.rows[0];
    const isOwner = owner_user_id === userId;
    const isAdmin = user_role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new Error('Insufficient permissions to update event');
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.date !== undefined) {
      updateFields.push(`date = $${paramCount++}`);
      values.push(new Date(updates.date));
    }
    if (updates.location !== undefined) {
      updateFields.push(`location = $${paramCount++}`);
      values.push(updates.location);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(eventId);

    const query = `UPDATE events SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await client.query(query, values);

    // Return updated event
    return this.getEventById(eventId, userId);
  }

  async deleteEvent(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Check if user owns the event (only owner can delete)
    const ownerCheck = await client.query(
      'SELECT owner_user_id FROM events WHERE id = $1',
      [eventId]
    );

    if (ownerCheck.rows.length === 0) {
      throw new Error('Event not found');
    }

    if (ownerCheck.rows[0].owner_user_id !== userId) {
      throw new Error('Only event owner can delete the event');
    }

    // Delete event (cascading deletes will handle related records)
    await client.query('DELETE FROM events WHERE id = $1', [eventId]);

    return { deleted: true, eventId };
  }

  async getEventStats(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify access first
    await this.getEventById(eventId, userId);
    
    const stats = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM guests WHERE event_id = $1) as total_guests,
        (SELECT COUNT(*) FROM guests WHERE event_id = $1) as confirmed_guests,
        (SELECT COUNT(*) FROM versions WHERE event_id = $1) as versions_count,
        (SELECT COUNT(*) FROM event_collaborators WHERE event_id = $1) as collaborators_count`,
      [eventId]
    );

    return {
      eventId,
      totalGuests: parseInt(stats.rows[0].total_guests),
      confirmedGuests: parseInt(stats.rows[0].confirmed_guests),
      versionsCount: parseInt(stats.rows[0].versions_count),
      collaboratorsCount: parseInt(stats.rows[0].collaborators_count)
    };
  }

  private formatEvent(row: Record<string, any>) {
    return {
      id: row.id,
      name: row.name,
      date: row.date,
      location: row.location,
      status: row.status,
      ownerUserId: row.owner_user_id,
      ownerName: row.owner_name,
      userRole: row.user_role,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}