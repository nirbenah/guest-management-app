import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { GroupService } from '../services/groupService';
import { validateData, createGroupSchema, updateGroupSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();
const groupService = new GroupService();

// Apply authentication to all group routes
router.use(authenticateToken);

// POST /api/groups - Create new group
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const validatedData = validateData(createGroupSchema, req.body);
    const group = await groupService.createGroup(req.user.id, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group },
    });
  })
);

// GET /api/groups/event/:eventId - Get all groups for an event
router.get(
  '/event/:eventId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const groups = await groupService.getEventGroups(req.params.eventId!, req.user.id);
      
      res.json({
        success: true,
        data: { groups },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Event not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/groups/:id - Get group details
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const group = await groupService.getGroupById(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { group },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Group not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/groups/:id/guests - Get guests in group
router.get(
  '/:id/guests',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const guests = await groupService.getGroupGuests(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { guests },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Group not found or access denied', 404);
      }
      throw error;
    }
  })
);

// PUT /api/groups/:id - Update group
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const validatedData = validateData(updateGroupSchema, req.body);
      const group = await groupService.updateGroup(req.params.id!, req.user.id, validatedData);
      
      res.json({
        success: true,
        message: 'Group updated successfully',
        data: { group },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Group not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to update group', 403);
        }
      }
      throw error;
    }
  })
);

// DELETE /api/groups/:id - Delete group
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const result = await groupService.deleteGroup(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        message: 'Group deleted successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Group not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to delete group', 403);
        }
        if (error.message.includes('Cannot delete group with assigned guests')) {
          throw createError('Cannot delete group with assigned guests', 400);
        }
      }
      throw error;
    }
  })
);

export default router;