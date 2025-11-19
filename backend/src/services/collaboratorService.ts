import { Client } from 'pg';
import { randomUUID } from 'crypto';
import { CreateCollaboratorRequest, UpdateCollaboratorRequest } from '../types';

const dbClient = new Client(process.env.DATABASE_URL);

export class CollaboratorService {
  private async getDbClient() {
    try {
      await dbClient.connect();
    } catch (error) {
      // Connection already exists or other connection error
    }
    return dbClient;
  }

  async inviteCollaborator(userId: string, data: CreateCollaboratorRequest) {
    const client = await this.getDbClient();
    
    // Verify user is event owner or admin
    const permissionCheck = await this.getEventPermissions(data.eventId, userId);
    if (!permissionCheck.isOwner && !permissionCheck.isAdmin) {
      throw new Error('Only event owners and admins can invite collaborators');
    }

    // Find user by email
    const userResult = await client.query(
      'SELECT id, email, display_name FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found with this email address');
    }

    const targetUser = userResult.rows[0];

    // Check if user is the event owner
    const eventResult = await client.query(
      'SELECT owner_user_id FROM events WHERE id = $1',
      [data.eventId]
    );

    if (eventResult.rows[0].owner_user_id === targetUser.id) {
      throw new Error('Event owner cannot be added as a collaborator');
    }

    // Check if collaboration already exists
    const existingCollaboration = await client.query(
      'SELECT id, role, status FROM event_collaborators WHERE event_id = $1 AND user_id = $2',
      [data.eventId, targetUser.id]
    );

    if (existingCollaboration.rows.length > 0) {
      const existing = existingCollaboration.rows[0];
      if (existing.status === 'active') {
        throw new Error('User is already a collaborator on this event');
      } else {
        // Reactivate existing invitation with new role
        await client.query(
          `UPDATE event_collaborators 
           SET role = $1, status = 'active', invited_by = $2, invited_at = NOW()
           WHERE event_id = $3 AND user_id = $4`,
          [data.role, userId, data.eventId, targetUser.id]
        );
        return this.getCollaboratorById(existing.id, userId);
      }
    }

    const collaboratorId = randomUUID();

    // Create collaboration
    await client.query(
      `INSERT INTO event_collaborators (
        id, event_id, user_id, role, invited_by, invited_at, accepted_at, status
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), 'active')`,
      [
        collaboratorId,
        data.eventId,
        targetUser.id,
        data.role,
        userId
      ]
    );

    // Get created collaboration
    const collaboratorResult = await client.query(
      `SELECT 
        ec.id, ec.event_id, ec.user_id, ec.role, ec.invited_by,
        ec.invited_at, ec.accepted_at, ec.status,
        u.email as user_email, u.display_name as user_display_name,
        iu.display_name as invited_by_name
       FROM event_collaborators ec
       JOIN users u ON ec.user_id = u.id
       LEFT JOIN users iu ON ec.invited_by = iu.id
       WHERE ec.id = $1`,
      [collaboratorId]
    );

    return this.formatCollaborator(collaboratorResult.rows[0]);
  }

  async getEventCollaborators(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);
    
    const result = await client.query(
      `SELECT 
        ec.id, ec.event_id, ec.user_id, ec.role, ec.invited_by,
        ec.invited_at, ec.accepted_at, ec.status,
        u.email as user_email, u.display_name as user_display_name,
        iu.display_name as invited_by_name
       FROM event_collaborators ec
       JOIN users u ON ec.user_id = u.id
       LEFT JOIN users iu ON ec.invited_by = iu.id
       WHERE ec.event_id = $1 AND ec.status = 'active'
       ORDER BY ec.invited_at DESC`,
      [eventId]
    );

    return result.rows.map(row => this.formatCollaborator(row));
  }

  async getCollaboratorById(collaboratorId: string, userId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      `SELECT 
        ec.id, ec.event_id, ec.user_id, ec.role, ec.invited_by,
        ec.invited_at, ec.accepted_at, ec.status,
        u.email as user_email, u.display_name as user_display_name,
        iu.display_name as invited_by_name
       FROM event_collaborators ec
       JOIN users u ON ec.user_id = u.id
       LEFT JOIN users iu ON ec.invited_by = iu.id
       WHERE ec.id = $1`,
      [collaboratorId]
    );

    if (result.rows.length === 0) {
      throw new Error('Collaborator not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(result.rows[0].event_id, userId);

    return this.formatCollaborator(result.rows[0]);
  }

  async updateCollaborator(collaboratorId: string, userId: string, updates: UpdateCollaboratorRequest) {
    const client = await this.getDbClient();
    
    // Get current collaborator to verify access
    const currentCollaborator = await this.getCollaboratorById(collaboratorId, userId);
    
    // Check permissions for this event - only owners and admins can update roles
    const permissionCheck = await this.getEventPermissions(currentCollaborator.eventId, userId);
    if (!permissionCheck.isOwner && !permissionCheck.isAdmin) {
      throw new Error('Only event owners and admins can update collaborator roles');
    }

    // Prevent owner from being demoted (this shouldn't happen but safety check)
    if (currentCollaborator.userId === permissionCheck.ownerId) {
      throw new Error('Cannot modify event owner permissions');
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.role !== undefined) {
      updateFields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(collaboratorId);
    const query = `UPDATE event_collaborators SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await client.query(query, values);

    // Return updated collaborator
    return this.getCollaboratorById(collaboratorId, userId);
  }

  async removeCollaborator(collaboratorId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Get current collaborator to verify access
    const currentCollaborator = await this.getCollaboratorById(collaboratorId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentCollaborator.eventId, userId);
    
    // Only owners and admins can remove collaborators, OR users can remove themselves
    const canRemove = 
      permissionCheck.isOwner || 
      permissionCheck.isAdmin || 
      currentCollaborator.userId === userId;
    
    if (!canRemove) {
      throw new Error('Insufficient permissions to remove collaborator');
    }

    // Prevent owner from removing themselves (this shouldn't happen but safety check)
    if (currentCollaborator.userId === permissionCheck.ownerId) {
      throw new Error('Cannot remove event owner');
    }

    // Soft delete - mark as inactive instead of hard delete to maintain audit trail
    await client.query(
      `UPDATE event_collaborators 
       SET status = 'removed', accepted_at = NULL 
       WHERE id = $1`,
      [collaboratorId]
    );

    return { removed: true, collaboratorId };
  }

  async getUserCollaborations(userId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      `SELECT 
        ec.id, ec.event_id, ec.user_id, ec.role, ec.invited_by,
        ec.invited_at, ec.accepted_at, ec.status,
        e.name as event_name, e.date as event_date, e.location as event_location,
        e.owner_user_id, ou.display_name as owner_name,
        iu.display_name as invited_by_name
       FROM event_collaborators ec
       JOIN events e ON ec.event_id = e.id
       JOIN users ou ON e.owner_user_id = ou.id
       LEFT JOIN users iu ON ec.invited_by = iu.id
       WHERE ec.user_id = $1 AND ec.status = 'active'
       ORDER BY ec.invited_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      eventId: row.event_id,
      role: row.role,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at,
      invitedByName: row.invited_by_name,
      event: {
        id: row.event_id,
        name: row.event_name,
        date: row.event_date,
        location: row.event_location,
        ownerName: row.owner_name
      }
    }));
  }

  private async verifyEventAccess(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    const accessCheck = await client.query(
      `SELECT e.owner_user_id, COALESCE(ec.role, 'none') as user_role
       FROM events e
       LEFT JOIN event_collaborators ec ON e.id = ec.event_id AND ec.user_id = $2 AND ec.status = 'active'
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
      isViewer: accessInfo.user_role === 'viewer',
      ownerId: accessInfo.owner_user_id
    };
  }

  private formatCollaborator(row: Record<string, any>) {
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      userEmail: row.user_email,
      userDisplayName: row.user_display_name,
      role: row.role,
      invitedBy: row.invited_by,
      invitedByName: row.invited_by_name,
      invitedAt: row.invited_at,
      acceptedAt: row.accepted_at,
      status: row.status
    };
  }
}