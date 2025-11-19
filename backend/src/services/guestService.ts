import { Client } from 'pg';
import { randomUUID } from 'crypto';
import { CreateGuestRequest, UpdateGuestRequest } from '../types';

const dbClient = new Client(process.env.DATABASE_URL);

export class GuestService {
  private async getDbClient() {
    try {
      await dbClient.connect();
    } catch (error) {
      // Connection already exists or other connection error
    }
    return dbClient;
  }

  async createGuest(userId: string, data: CreateGuestRequest) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(data.eventId, userId);
    
    const guestId = randomUUID();
    
    // Insert guest
    await client.query(
      `INSERT INTO guests (
        id, event_id, name, last_name, email, phone, "guestType", 
        primary_guest_id, dietary_restrictions, allergies, current_group, 
        side, added_by_user, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
      [
        guestId,
        data.eventId,
        data.name,
        data.lastName || null,
        data.email || null,
        data.phone || null,
        data.guestType || 'primary',
        data.primaryGuestId || null,
        data.dietaryRestrictions || [],
        data.allergies || null,
        data.currentGroup || null,
        data.side || null,
        userId
      ]
    );

    // Get created guest
    const guestResult = await client.query(
      `SELECT 
        id, event_id, name, last_name, email, phone, "guestType",
        primary_guest_id, dietary_restrictions, allergies, current_group,
        side, "rsvpStatus", added_by_user, approved, notes,
        created_at, updated_at
       FROM guests WHERE id = $1`,
      [guestId]
    );

    return this.formatGuest(guestResult.rows[0]);
  }

  async getEventGuests(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);
    
    const result = await client.query(
      `SELECT 
        g.id, g.event_id, g.name, g.last_name, g.email, g.phone, g."guestType",
        g.primary_guest_id, g.dietary_restrictions, g.allergies, g.current_group,
        g.side, g."rsvpStatus", g.added_by_user, g.approved, g.notes,
        g.created_at, g.updated_at,
        u.display_name as added_by_name,
        pg.name as primary_guest_name
       FROM guests g
       LEFT JOIN users u ON g.added_by_user = u.id
       LEFT JOIN guests pg ON g.primary_guest_id = pg.id
       WHERE g.event_id = $1
       ORDER BY g.created_at DESC`,
      [eventId]
    );

    return result.rows.map(row => this.formatGuest(row));
  }

  async getGuestById(guestId: string, userId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      `SELECT 
        g.id, g.event_id, g.name, g.last_name, g.email, g.phone, g."guestType",
        g.primary_guest_id, g.dietary_restrictions, g.allergies, g.current_group,
        g.side, g."rsvpStatus", g.added_by_user, g.approved, g.notes,
        g.created_at, g.updated_at,
        u.display_name as added_by_name,
        pg.name as primary_guest_name
       FROM guests g
       LEFT JOIN users u ON g.added_by_user = u.id
       LEFT JOIN guests pg ON g.primary_guest_id = pg.id
       WHERE g.id = $1`,
      [guestId]
    );

    if (result.rows.length === 0) {
      throw new Error('Guest not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(result.rows[0].event_id, userId);

    return this.formatGuest(result.rows[0]);
  }

  async updateGuest(guestId: string, userId: string, updates: UpdateGuestRequest) {
    const client = await this.getDbClient();
    
    // Get current guest to verify access
    const currentGuest = await this.getGuestById(guestId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentGuest.eventId, userId);
    const canEdit = permissionCheck.isOwner || permissionCheck.isAdmin || permissionCheck.isEditor;
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to update guest');
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.lastName !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(updates.lastName);
    }
    if (updates.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.phone !== undefined) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(updates.phone);
    }
    if (updates.guestType !== undefined) {
      updateFields.push(`"guestType" = $${paramCount++}`);
      values.push(updates.guestType);
    }
    if (updates.primaryGuestId !== undefined) {
      updateFields.push(`primary_guest_id = $${paramCount++}`);
      values.push(updates.primaryGuestId);
    }
    if (updates.dietaryRestrictions !== undefined) {
      updateFields.push(`dietary_restrictions = $${paramCount++}`);
      values.push(updates.dietaryRestrictions);
    }
    if (updates.allergies !== undefined) {
      updateFields.push(`allergies = $${paramCount++}`);
      values.push(updates.allergies);
    }
    if (updates.currentGroup !== undefined) {
      updateFields.push(`current_group = $${paramCount++}`);
      values.push(updates.currentGroup);
    }
    if (updates.side !== undefined) {
      updateFields.push(`side = $${paramCount++}`);
      values.push(updates.side);
    }
    if (updates.rsvpStatus !== undefined) {
      updateFields.push(`"rsvpStatus" = $${paramCount++}`);
      values.push(updates.rsvpStatus);
    }
    if (updates.approved !== undefined) {
      updateFields.push(`approved = $${paramCount++}`);
      values.push(updates.approved);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(guestId);

    const query = `UPDATE guests SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await client.query(query, values);

    // Return updated guest
    return this.getGuestById(guestId, userId);
  }

  async deleteGuest(guestId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Get current guest to verify access
    const currentGuest = await this.getGuestById(guestId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentGuest.eventId, userId);
    const canDelete = permissionCheck.isOwner || permissionCheck.isAdmin;
    
    if (!canDelete) {
      throw new Error('Insufficient permissions to delete guest');
    }

    // Delete guest (this will also handle companion guests via cascade or manual cleanup)
    await client.query('DELETE FROM guests WHERE id = $1', [guestId]);

    return { deleted: true, guestId };
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    const accessCheck = await client.query(
      `SELECT e.owner_user_id, COALESCE(ec.role, 'none') as user_role
       FROM events e
       LEFT JOIN event_collaborators ec ON e.id = ec.event_id AND ec.user_id = $2
       WHERE e.id = $1 AND (e.owner_user_id = $2 OR ec.user_id = $2)`,
      [eventId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Event not found or access denied');
    }

    return accessCheck.rows[0];
  }

  private async getEventPermissions(eventId: string, userId: string) {
    const accessInfo = await this.verifyEventAccess(eventId, userId);
    
    return {
      isOwner: accessInfo.owner_user_id === userId,
      isAdmin: accessInfo.user_role === 'admin',
      isEditor: accessInfo.user_role === 'editor',
      isViewer: accessInfo.user_role === 'viewer'
    };
  }

  private formatGuest(row: Record<string, any>) {
    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      guestType: row.guestType,
      primaryGuestId: row.primary_guest_id,
      primaryGuestName: row.primary_guest_name,
      dietaryRestrictions: row.dietary_restrictions || [],
      allergies: row.allergies,
      currentGroup: row.current_group,
      side: row.side,
      rsvpStatus: row.rsvpStatus,
      addedByUser: row.added_by_user,
      addedByName: row.added_by_name,
      approved: row.approved,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}