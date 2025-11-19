import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { TableService } from '../services/tableService';
import { validateData, createTableSchema, updateTableSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();
const tableService = new TableService();

// Apply authentication to all table routes
router.use(authenticateToken);

// POST /api/tables - Create new table
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const validatedData = validateData(createTableSchema, req.body);
    const table = await tableService.createTable(req.user.id, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: { table },
    });
  })
);

// GET /api/tables/version/:versionId - Get all tables for a version
router.get(
  '/version/:versionId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const tables = await tableService.getVersionTables(req.params.versionId!, req.user.id);
      
      res.json({
        success: true,
        data: { tables },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Version not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/tables/:id - Get table details
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const table = await tableService.getTableById(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { table },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Table not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/tables/:id/assignments - Get table guest assignments
router.get(
  '/:id/assignments',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const assignments = await tableService.getTableAssignments(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { assignments },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Table not found or access denied', 404);
      }
      throw error;
    }
  })
);

// POST /api/tables/:id/assign - Assign guest to table
router.post(
  '/:id/assign',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const { guestId, seatNumber } = req.body;
      
      if (!guestId) {
        throw createError('Guest ID is required', 400);
      }

      const assignment = await tableService.assignGuestToTable(
        req.params.id!, 
        guestId, 
        req.user.id, 
        seatNumber
      );
      
      res.status(201).json({
        success: true,
        message: 'Guest assigned to table successfully',
        data: { assignment },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Table or guest not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to assign guests', 403);
        }
        if (error.message.includes('already assigned')) {
          throw createError('Guest is already assigned to a table', 400);
        }
        if (error.message.includes('already taken')) {
          throw createError('Seat number is already taken', 400);
        }
        if (error.message.includes('full capacity')) {
          throw createError('Table is at full capacity', 400);
        }
        if (error.message.includes('does not belong to this event')) {
          throw createError('Guest does not belong to this event', 400);
        }
      }
      throw error;
    }
  })
);

// PUT /api/tables/:id - Update table
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const validatedData = validateData(updateTableSchema, req.body);
      const table = await tableService.updateTable(req.params.id!, req.user.id, validatedData);
      
      res.json({
        success: true,
        message: 'Table updated successfully',
        data: { table },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Table not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to update table', 403);
        }
        if (error.message.includes('already exists')) {
          throw createError('Table number already exists in this version', 400);
        }
      }
      throw error;
    }
  })
);

// DELETE /api/tables/:id - Delete table
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const result = await tableService.deleteTable(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        message: 'Table deleted successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Table not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to delete table', 403);
        }
        if (error.message.includes('Cannot delete table with assigned guests')) {
          throw createError('Cannot delete table with assigned guests', 400);
        }
      }
      throw error;
    }
  })
);

export default router;