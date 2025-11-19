import { Client } from 'pg';
import { randomUUID } from 'crypto';
import { CreateTableRequest, UpdateTableRequest } from '../types';

const dbClient = new Client(process.env.DATABASE_URL);

export class TableService {
  private async getDbClient() {
    try {
      await dbClient.connect();
    } catch (error) {
      // Connection already exists or other connection error
    }
    return dbClient;
  }

  async createTable(userId: string, data: CreateTableRequest) {
    const client = await this.getDbClient();
    
    // Verify user has access to the event
    await this.verifyEventAccess(data.eventId, userId);
    
    // Verify version exists and belongs to event
    await this.verifyVersionAccess(data.versionId, data.eventId, userId);
    
    // Check if table number is already used in this version
    const existingTable = await client.query(
      'SELECT id FROM tables WHERE version_id = $1 AND number = $2',
      [data.versionId, data.number]
    );
    
    if (existingTable.rows.length > 0) {
      throw new Error(`Table number ${data.number} already exists in this version`);
    }
    
    const tableId = randomUUID();
    
    // Insert table
    await client.query(
      `INSERT INTO tables (
        id, version_id, event_id, name, number, total_seats, shape,
        section, position, color, adjacent_tables, is_reserved, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        tableId,
        data.versionId,
        data.eventId,
        data.name,
        data.number,
        data.totalSeats,
        data.shape || 'Circle',
        data.section || null,
        JSON.stringify(data.position),
        data.color || null,
        data.adjacentTables || [],
        data.isReserved || false,
        data.notes || null
      ]
    );

    // Get created table with assignment count
    const tableResult = await client.query(
      `SELECT 
        t.id, t.version_id, t.event_id, t.name, t.number, t.total_seats,
        t.shape, t.section, t.position, t.color, t.adjacent_tables,
        t.is_reserved, t.notes, t.created_at,
        COUNT(ta.id) as assigned_guests
       FROM tables t
       LEFT JOIN table_assignments ta ON t.id = ta.table_id
       WHERE t.id = $1
       GROUP BY t.id, t.version_id, t.event_id, t.name, t.number, t.total_seats,
                t.shape, t.section, t.position, t.color, t.adjacent_tables,
                t.is_reserved, t.notes, t.created_at`,
      [tableId]
    );

    return this.formatTable(tableResult.rows[0]);
  }

  async getVersionTables(versionId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify version access (this will also verify event access)
    const version = await this.getVersionInfo(versionId);
    await this.verifyEventAccess(version.event_id, userId);
    
    const result = await client.query(
      `SELECT 
        t.id, t.version_id, t.event_id, t.name, t.number, t.total_seats,
        t.shape, t.section, t.position, t.color, t.adjacent_tables,
        t.is_reserved, t.notes, t.created_at,
        COUNT(ta.id) as assigned_guests
       FROM tables t
       LEFT JOIN table_assignments ta ON t.id = ta.table_id
       WHERE t.version_id = $1
       GROUP BY t.id, t.version_id, t.event_id, t.name, t.number, t.total_seats,
                t.shape, t.section, t.position, t.color, t.adjacent_tables,
                t.is_reserved, t.notes, t.created_at
       ORDER BY t.number`,
      [versionId]
    );

    return result.rows.map(row => this.formatTable(row));
  }

  async getTableById(tableId: string, userId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      `SELECT 
        t.id, t.version_id, t.event_id, t.name, t.number, t.total_seats,
        t.shape, t.section, t.position, t.color, t.adjacent_tables,
        t.is_reserved, t.notes, t.created_at,
        COUNT(ta.id) as assigned_guests
       FROM tables t
       LEFT JOIN table_assignments ta ON t.id = ta.table_id
       WHERE t.id = $1
       GROUP BY t.id, t.version_id, t.event_id, t.name, t.number, t.total_seats,
                t.shape, t.section, t.position, t.color, t.adjacent_tables,
                t.is_reserved, t.notes, t.created_at`,
      [tableId]
    );

    if (result.rows.length === 0) {
      throw new Error('Table not found');
    }

    // Verify user has access to the event
    await this.verifyEventAccess(result.rows[0].event_id, userId);

    return this.formatTable(result.rows[0]);
  }

  async updateTable(tableId: string, userId: string, updates: UpdateTableRequest) {
    const client = await this.getDbClient();
    
    // Get current table to verify access
    const currentTable = await this.getTableById(tableId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentTable.eventId, userId);
    const canEdit = permissionCheck.isOwner || permissionCheck.isAdmin || permissionCheck.isEditor;
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to update table');
    }

    // Check if updating table number and it conflicts
    if (updates.number !== undefined && updates.number !== currentTable.number) {
      const existingTable = await client.query(
        'SELECT id FROM tables WHERE version_id = $1 AND number = $2 AND id != $3',
        [currentTable.versionId, updates.number, tableId]
      );
      
      if (existingTable.rows.length > 0) {
        throw new Error(`Table number ${updates.number} already exists in this version`);
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.number !== undefined) {
      updateFields.push(`number = $${paramCount++}`);
      values.push(updates.number);
    }
    if (updates.totalSeats !== undefined) {
      updateFields.push(`total_seats = $${paramCount++}`);
      values.push(updates.totalSeats);
    }
    if (updates.shape !== undefined) {
      updateFields.push(`shape = $${paramCount++}`);
      values.push(updates.shape);
    }
    if (updates.section !== undefined) {
      updateFields.push(`section = $${paramCount++}`);
      values.push(updates.section);
    }
    if (updates.position !== undefined) {
      updateFields.push(`position = $${paramCount++}`);
      values.push(JSON.stringify(updates.position));
    }
    if (updates.color !== undefined) {
      updateFields.push(`color = $${paramCount++}`);
      values.push(updates.color);
    }
    if (updates.adjacentTables !== undefined) {
      updateFields.push(`adjacent_tables = $${paramCount++}`);
      values.push(updates.adjacentTables);
    }
    if (updates.isReserved !== undefined) {
      updateFields.push(`is_reserved = $${paramCount++}`);
      values.push(updates.isReserved);
    }
    if (updates.notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(tableId);
    const query = `UPDATE tables SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await client.query(query, values);

    // Return updated table
    return this.getTableById(tableId, userId);
  }

  async deleteTable(tableId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Get current table to verify access
    const currentTable = await this.getTableById(tableId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(currentTable.eventId, userId);
    const canDelete = permissionCheck.isOwner || permissionCheck.isAdmin;
    
    if (!canDelete) {
      throw new Error('Insufficient permissions to delete table');
    }

    // Check if table has assigned guests
    const assignmentCheck = await client.query(
      'SELECT COUNT(*) as count FROM table_assignments WHERE table_id = $1',
      [tableId]
    );

    if (parseInt(assignmentCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete table with assigned guests. Remove guest assignments first.');
    }

    // Delete table
    await client.query('DELETE FROM tables WHERE id = $1', [tableId]);

    return { deleted: true, tableId };
  }

  async getTableAssignments(tableId: string, userId: string) {
    const client = await this.getDbClient();
    
    // Verify access to table
    await this.getTableById(tableId, userId);
    
    const result = await client.query(
      `SELECT 
        ta.id, ta.version_id, ta.guest_id, ta.table_id, ta.seat_number,
        ta.is_attending, ta.assigned_at, ta.assigned_by,
        g.name as guest_name, g.last_name as guest_last_name,
        g.email as guest_email, g."guestType" as guest_type,
        u.display_name as assigned_by_name
       FROM table_assignments ta
       JOIN guests g ON ta.guest_id = g.id
       LEFT JOIN users u ON ta.assigned_by = u.id
       WHERE ta.table_id = $1
       ORDER BY ta.seat_number, ta.assigned_at`,
      [tableId]
    );

    return result.rows.map(row => ({
      id: row.id,
      versionId: row.version_id,
      guestId: row.guest_id,
      tableId: row.table_id,
      seatNumber: row.seat_number,
      isAttending: row.is_attending,
      assignedAt: row.assigned_at,
      assignedBy: row.assigned_by,
      assignedByName: row.assigned_by_name,
      guest: {
        id: row.guest_id,
        name: row.guest_name,
        lastName: row.guest_last_name,
        email: row.guest_email,
        guestType: row.guest_type
      }
    }));
  }

  async assignGuestToTable(tableId: string, guestId: string, userId: string, seatNumber?: number) {
    const client = await this.getDbClient();
    
    // Verify access to table
    const table = await this.getTableById(tableId, userId);
    
    // Check permissions for this event
    const permissionCheck = await this.getEventPermissions(table.eventId, userId);
    const canEdit = permissionCheck.isOwner || permissionCheck.isAdmin || permissionCheck.isEditor;
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to assign guests to table');
    }

    // Verify guest exists and belongs to same event
    const guestCheck = await client.query(
      'SELECT id FROM guests WHERE id = $1 AND event_id = $2',
      [guestId, table.eventId]
    );

    if (guestCheck.rows.length === 0) {
      throw new Error('Guest not found or does not belong to this event');
    }

    // Check if guest is already assigned to a table in this version
    const existingAssignment = await client.query(
      'SELECT table_id FROM table_assignments WHERE guest_id = $1 AND version_id = $2',
      [guestId, table.versionId]
    );

    if (existingAssignment.rows.length > 0) {
      throw new Error('Guest is already assigned to a table in this version');
    }

    // Check seat number conflicts if specified
    if (seatNumber !== undefined) {
      const seatCheck = await client.query(
        'SELECT id FROM table_assignments WHERE table_id = $1 AND seat_number = $2',
        [tableId, seatNumber]
      );

      if (seatCheck.rows.length > 0) {
        throw new Error(`Seat number ${seatNumber} is already taken at this table`);
      }
    }

    // Check table capacity
    const currentAssignments = await client.query(
      'SELECT COUNT(*) as count FROM table_assignments WHERE table_id = $1',
      [tableId]
    );

    if (parseInt(currentAssignments.rows[0].count) >= table.totalSeats) {
      throw new Error('Table is at full capacity');
    }

    const assignmentId = randomUUID();

    // Create assignment
    await client.query(
      `INSERT INTO table_assignments (
        id, version_id, guest_id, table_id, seat_number,
        is_attending, assigned_at, assigned_by
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [
        assignmentId,
        table.versionId,
        guestId,
        tableId,
        seatNumber || null,
        true,
        userId
      ]
    );

    // Return assignment details
    const assignmentResult = await client.query(
      `SELECT 
        ta.id, ta.version_id, ta.guest_id, ta.table_id, ta.seat_number,
        ta.is_attending, ta.assigned_at, ta.assigned_by,
        g.name as guest_name, g.last_name as guest_last_name,
        u.display_name as assigned_by_name
       FROM table_assignments ta
       JOIN guests g ON ta.guest_id = g.id
       LEFT JOIN users u ON ta.assigned_by = u.id
       WHERE ta.id = $1`,
      [assignmentId]
    );

    return {
      id: assignmentResult.rows[0].id,
      versionId: assignmentResult.rows[0].version_id,
      guestId: assignmentResult.rows[0].guest_id,
      tableId: assignmentResult.rows[0].table_id,
      seatNumber: assignmentResult.rows[0].seat_number,
      isAttending: assignmentResult.rows[0].is_attending,
      assignedAt: assignmentResult.rows[0].assigned_at,
      assignedBy: assignmentResult.rows[0].assigned_by,
      assignedByName: assignmentResult.rows[0].assigned_by_name,
      guestName: `${assignmentResult.rows[0].guest_name} ${assignmentResult.rows[0].guest_last_name || ''}`.trim()
    };
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

  private async verifyVersionAccess(versionId: string, eventId: string, userId: string) {
    const client = await this.getDbClient();
    
    const versionCheck = await client.query(
      'SELECT event_id FROM versions WHERE id = $1',
      [versionId]
    );

    if (versionCheck.rows.length === 0) {
      throw new Error('Version not found');
    }

    if (versionCheck.rows[0].event_id !== eventId) {
      throw new Error('Version does not belong to this event');
    }
  }

  private async getVersionInfo(versionId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      'SELECT event_id FROM versions WHERE id = $1',
      [versionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Version not found');
    }

    return result.rows[0];
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

  private formatTable(row: Record<string, any>) {
    return {
      id: row.id,
      versionId: row.version_id,
      eventId: row.event_id,
      name: row.name,
      number: row.number,
      totalSeats: row.total_seats,
      shape: row.shape,
      section: row.section,
      position: row.position,
      color: row.color,
      adjacentTables: row.adjacent_tables || [],
      isReserved: row.is_reserved,
      notes: row.notes,
      assignedGuests: parseInt(row.assigned_guests) || 0,
      createdAt: row.created_at
    };
  }
}