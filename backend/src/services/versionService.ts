import { Client } from 'pg';
import { randomUUID } from 'crypto';
import { CreateVersionRequest, UpdateVersionRequest } from '../types';

const dbClient = new Client(process.env.DATABASE_URL);

export class VersionService {
  private async getDbClient() {
    try {
      await dbClient.connect();
    } catch (error) {
      // Connection already exists or other connection error
    }
    return dbClient;
  }

  async createVersion(userId: string, data: CreateVersionRequest) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(data.eventId, userId);
    
    const versionId = randomUUID();
    
    // Get next version number for this event
    const versionCountResult = await client.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_number FROM versions WHERE event_id = $1',
      [data.eventId]
    );
    const versionNumber = versionCountResult.rows[0].next_number;
    
    // Insert version
    await client.query(
      `INSERT INTO versions (
        id, event_id, version_number, name, description, is_active,
        hall_dimensions, created_by_user, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        versionId,
        data.eventId,
        versionNumber,
        data.name,
        data.description || null,
        false, // New versions start as inactive
        data.hallDimensions ? JSON.stringify(data.hallDimensions) : null,
        userId
      ]
    );

    // Get created version with table count
    const versionResult = await client.query(
      `SELECT 
        v.id, v.event_id, v.version_number, v.name, v.description, v.is_active,
        v.hall_dimensions, v.created_by_user, v.created_at, v.updated_at,
        u.display_name as created_by_name,
        COUNT(t.id) as table_count
       FROM versions v
       LEFT JOIN users u ON v.created_by_user = u.id
       LEFT JOIN tables t ON v.id = t.version_id
       WHERE v.id = $1
       GROUP BY v.id, v.event_id, v.version_number, v.name, v.description, v.is_active,
                v.hall_dimensions, v.created_by_user, v.created_at, v.updated_at, u.display_name`,
      [versionId]
    );

    return this.formatVersion(versionResult.rows[0]);
  }

  async getEventVersions(eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(eventId, userId);
    
    const result = await client.query(
      `SELECT 
        v.id, v.event_id, v.version_number, v.name, v.description, v.is_active,
        v.hall_dimensions, v.created_by_user, v.created_at, v.updated_at,
        u.display_name as created_by_name,
        COUNT(t.id) as table_count
       FROM versions v
       LEFT JOIN users u ON v.created_by_user = u.id
       LEFT JOIN tables t ON v.id = t.version_id
       WHERE v.event_id = $1
       GROUP BY v.id, v.event_id, v.version_number, v.name, v.description, v.is_active,
                v.hall_dimensions, v.created_by_user, v.created_at, v.updated_at, u.display_name
       ORDER BY v.version_number DESC`,
      [eventId]
    );

    return result.rows.map(row => this.formatVersion(row));
  }

  async getVersionById(versionId: string, userId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      `SELECT 
        v.id, v.event_id, v.version_number, v.name, v.description, v.is_active,
        v.hall_dimensions, v.created_by_user, v.created_at, v.updated_at,
        u.display_name as created_by_name,
        COUNT(t.id) as table_count
       FROM versions v
       LEFT JOIN users u ON v.created_by_user = u.id
       LEFT JOIN tables t ON v.id = t.version_id
       WHERE v.id = $1
       GROUP BY v.id, v.event_id, v.version_number, v.name, v.description, v.is_active,
                v.hall_dimensions, v.created_by_user, v.created_at, v.updated_at, u.display_name`,
      [versionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Version not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(result.rows[0].event_id, userId);

    return this.formatVersion(result.rows[0]);
  }

  async updateVersion(versionId: string, userId: string, updates: UpdateVersionRequest) {
    const client = await this.getDbClient();
    
    // Get current version to verify access
    const currentVersion = await this.getVersionById(versionId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentVersion.eventId, userId);
    const canEdit = permissionCheck.isOwner || permissionCheck.isAdmin || permissionCheck.isEditor;
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to update version');
    }

    // Handle setting active version (only one can be active per event)
    if (updates.isActive === true) {
      // Deactivate all other versions for this event
      await client.query(
        'UPDATE versions SET is_active = false WHERE event_id = $1 AND id != $2',
        [currentVersion.eventId, versionId]
      );
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }
    if (updates.hallDimensions !== undefined) {
      updateFields.push(`hall_dimensions = $${paramCount++}`);
      values.push(updates.hallDimensions ? JSON.stringify(updates.hallDimensions) : null);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(versionId);

    const query = `UPDATE versions SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await client.query(query, values);

    // Return updated version
    return this.getVersionById(versionId, userId);
  }

  async deleteVersion(versionId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Get current version to verify access
    const currentVersion = await this.getVersionById(versionId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentVersion.eventId, userId);
    const canDelete = permissionCheck.isOwner || permissionCheck.isAdmin;
    
    if (!canDelete) {
      throw new Error('Insufficient permissions to delete version');
    }

    // Check if version is active
    if (currentVersion.isActive) {
      throw new Error('Cannot delete active version. Please activate another version first.');
    }

    // Check if version has tables
    const tableCheck = await client.query(
      'SELECT COUNT(*) as count FROM tables WHERE version_id = $1',
      [versionId]
    );

    if (parseInt(tableCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete version with existing tables. Delete tables first.');
    }

    // Delete version
    await client.query('DELETE FROM versions WHERE id = $1', [versionId]);

    return { deleted: true, versionId };
  }

  async activateVersion(versionId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Get current version to verify access
    const currentVersion = await this.getVersionById(versionId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentVersion.eventId, userId);
    const canEdit = permissionCheck.isOwner || permissionCheck.isAdmin || permissionCheck.isEditor;
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to activate version');
    }

    // Deactivate all other versions for this event
    await client.query(
      'UPDATE versions SET is_active = false WHERE event_id = $1',
      [currentVersion.eventId]
    );

    // Activate this version
    await client.query(
      'UPDATE versions SET is_active = true, updated_at = NOW() WHERE id = $1',
      [versionId]
    );

    // Return updated version
    return this.getVersionById(versionId, userId);
  }

  async duplicateVersion(versionId: string, userId: string, newName?: string) {
    const client = await this.getDbClient();
    
    // Get current version to verify access and copy data
    const currentVersion = await this.getVersionById(versionId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentVersion.eventId, userId);
    const canEdit = permissionCheck.isOwner || permissionCheck.isAdmin || permissionCheck.isEditor;
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to duplicate version');
    }

    const newVersionId = randomUUID();
    
    // Get next version number for this event
    const versionCountResult = await client.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 as next_number FROM versions WHERE event_id = $1',
      [currentVersion.eventId]
    );
    const versionNumber = versionCountResult.rows[0].next_number;

    // Create new version
    await client.query(
      `INSERT INTO versions (
        id, event_id, version_number, name, description, is_active,
        hall_dimensions, created_by_user, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        newVersionId,
        currentVersion.eventId,
        versionNumber,
        newName || `${currentVersion.name} (Copy)`,
        currentVersion.description,
        false, // Duplicated versions start as inactive
        currentVersion.hallDimensions,
        userId
      ]
    );

    // Copy all tables from original version
    const tablesResult = await client.query(
      'SELECT * FROM tables WHERE version_id = $1',
      [versionId]
    );

    for (const table of tablesResult.rows) {
      const newTableId = randomUUID();
      await client.query(
        `INSERT INTO tables (
          id, version_id, event_id, name, number, total_seats, shape,
          section, position, color, adjacent_tables, is_reserved, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
        [
          newTableId,
          newVersionId,
          table.event_id,
          table.name,
          table.number,
          table.total_seats,
          table.shape,
          table.section,
          table.position,
          table.color,
          table.adjacent_tables,
          table.is_reserved,
          table.notes
        ]
      );
    }

    // Return new version
    return this.getVersionById(newVersionId, userId);
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

  private formatVersion(row: Record<string, any>) {
    return {
      id: row.id,
      eventId: row.event_id,
      versionNumber: row.version_number,
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      hallDimensions: row.hall_dimensions,
      createdByUser: row.created_by_user,
      createdByName: row.created_by_name,
      tableCount: parseInt(row.table_count) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}