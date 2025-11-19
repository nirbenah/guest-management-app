import { Client } from 'pg';
import { randomUUID } from 'crypto';
import { CreateGroupRequest, UpdateGroupRequest } from '../types';

const dbClient = new Client(process.env.DATABASE_URL);

export class GroupService {
  private async getDbClient() {
    try {
      await dbClient.connect();
    } catch (error) {
      // Connection already exists or other connection error
    }
    return dbClient;
  }

  async createGroup(userId: string, data: CreateGroupRequest) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(data.eventId, userId);
    
    const groupId = randomUUID();
    
    // Insert group
    await client.query(
      `INSERT INTO groups (
        id, event_id, name, color, "seatingPreference", 
        prefer_adjacent, priority, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        groupId,
        data.eventId,
        data.name,
        data.color || 'blue',
        data.seatingPreference || 'no_preference',
        data.preferAdjacent || false,
        data.priority || 'medium',
        data.notes || null
      ]
    );

    // Get created group with guest count
    const groupResult = await client.query(
      `SELECT 
        g.id, g.event_id, g.name, g.color, g."seatingPreference",
        g.prefer_adjacent, g.priority, g.notes, g.created_at,
        COUNT(gu.id) as guest_count
       FROM groups g
       LEFT JOIN guests gu ON g.id = gu.current_group
       WHERE g.id = $1
       GROUP BY g.id, g.event_id, g.name, g.color, g."seatingPreference",
                g.prefer_adjacent, g.priority, g.notes, g.created_at`,
      [groupId]
    );

    return this.formatGroup(groupResult.rows[0]);
  }

  async getEventGroups(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);
    
    const result = await client.query(
      `SELECT 
        g.id, g.event_id, g.name, g.color, g."seatingPreference",
        g.prefer_adjacent, g.priority, g.notes, g.created_at,
        COUNT(gu.id) as guest_count
       FROM groups g
       LEFT JOIN guests gu ON g.id = gu.current_group
       WHERE g.event_id = $1
       GROUP BY g.id, g.event_id, g.name, g.color, g."seatingPreference",
                g.prefer_adjacent, g.priority, g.notes, g.created_at
       ORDER BY g.created_at DESC`,
      [eventId]
    );

    return result.rows.map(row => this.formatGroup(row));
  }

  async getGroupById(groupId: string, userId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      `SELECT 
        g.id, g.event_id, g.name, g.color, g."seatingPreference",
        g.prefer_adjacent, g.priority, g.notes, g.created_at,
        COUNT(gu.id) as guest_count
       FROM groups g
       LEFT JOIN guests gu ON g.id = gu.current_group
       WHERE g.id = $1
       GROUP BY g.id, g.event_id, g.name, g.color, g."seatingPreference",
                g.prefer_adjacent, g.priority, g.notes, g.created_at`,
      [groupId]
    );

    if (result.rows.length === 0) {
      throw new Error('Group not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(result.rows[0].event_id, userId);

    return this.formatGroup(result.rows[0]);
  }

  async updateGroup(groupId: string, userId: string, updates: UpdateGroupRequest) {
    const client = await this.getDbClient();
    
    // Get current group to verify access
    const currentGroup = await this.getGroupById(groupId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentGroup.eventId, userId);
    const canEdit = permissionCheck.isOwner || permissionCheck.isAdmin || permissionCheck.isEditor;
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to update group');
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      updateFields.push(`color = $${paramCount++}`);
      values.push(updates.color);
    }
    if (updates.seatingPreference !== undefined) {
      updateFields.push(`"seatingPreference" = $${paramCount++}`);
      values.push(updates.seatingPreference);
    }
    if (updates.preferAdjacent !== undefined) {
      updateFields.push(`prefer_adjacent = $${paramCount++}`);
      values.push(updates.preferAdjacent);
    }
    if (updates.priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      values.push(updates.priority);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(groupId);
    const query = `UPDATE groups SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await client.query(query, values);

    // Return updated group
    return this.getGroupById(groupId, userId);
  }

  async deleteGroup(groupId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Get current group to verify access
    const currentGroup = await this.getGroupById(groupId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentGroup.eventId, userId);
    const canDelete = permissionCheck.isOwner || permissionCheck.isAdmin;
    
    if (!canDelete) {
      throw new Error('Insufficient permissions to delete group');
    }

    // Check if group has assigned guests
    const guestCheck = await client.query(
      'SELECT COUNT(*) as count FROM guests WHERE current_group = $1',
      [groupId]
    );

    if (parseInt(guestCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete group with assigned guests. Remove guests from group first.');
    }

    // Delete group
    await client.query('DELETE FROM groups WHERE id = $1', [groupId]);

    return { deleted: true, groupId };
  }

  async getGroupGuests(groupId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify access to group
    await this.getGroupById(groupId, userId);
    
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
       WHERE g.current_group = $1
       ORDER BY g.created_at DESC`,
      [groupId]
    );

    return result.rows.map(row => this.formatGuest(row));
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

  private formatGroup(row: Record<string, any>) {
    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      color: row.color,
      seatingPreference: row.seatingPreference,
      preferAdjacent: row.prefer_adjacent,
      priority: row.priority,
      notes: row.notes,
      guestCount: parseInt(row.guest_count) || 0,
      createdAt: row.created_at
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