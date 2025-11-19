import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { CollaboratorService } from '../services/collaboratorService';
import { validateData, createCollaboratorSchema, updateCollaboratorSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();
const collaboratorService = new CollaboratorService();

// Apply authentication to all collaborator routes
router.use(authenticateToken);

// POST /api/collaborators - Invite new collaborator
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const validatedData = validateData(createCollaboratorSchema, req.body);
      const collaborator = await collaboratorService.inviteCollaborator(req.user.id, validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Collaborator invited successfully',
        data: { collaborator },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Only event owners and admins')) {
          throw createError('Only event owners and admins can invite collaborators', 403);
        }
        if (error.message.includes('User not found')) {
          throw createError('User not found with this email address', 404);
        }
        if (error.message.includes('Event owner cannot be added')) {
          throw createError('Event owner cannot be added as a collaborator', 400);
        }
        if (error.message.includes('already a collaborator')) {
          throw createError('User is already a collaborator on this event', 400);
        }
        if (error.message.includes('not found or access denied')) {
          throw createError('Event not found or access denied', 404);
        }
      }
      throw error;
    }
  })
);

// GET /api/collaborators/event/:eventId - Get all collaborators for an event
router.get(
  '/event/:eventId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const collaborators = await collaboratorService.getEventCollaborators(req.params.eventId!, req.user.id);
      
      res.json({
        success: true,
        data: { collaborators },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Event not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/collaborators/my-events - Get user's collaborations
router.get(
  '/my-events',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const collaborations = await collaboratorService.getUserCollaborations(req.user.id);
    
    res.json({
      success: true,
      data: { collaborations },
    });
  })
);

// GET /api/collaborators/:id - Get collaborator details
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const collaborator = await collaboratorService.getCollaboratorById(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { collaborator },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Collaborator not found or access denied', 404);
      }
      throw error;
    }
  })
);

// PUT /api/collaborators/:id - Update collaborator role
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const validatedData = validateData(updateCollaboratorSchema, req.body);
      const collaborator = await collaboratorService.updateCollaborator(req.params.id!, req.user.id, validatedData);
      
      res.json({
        success: true,
        message: 'Collaborator updated successfully',
        data: { collaborator },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Collaborator not found', 404);
        }
        if (error.message.includes('Only event owners and admins')) {
          throw createError('Only event owners and admins can update collaborator roles', 403);
        }
        if (error.message.includes('Cannot modify event owner')) {
          throw createError('Cannot modify event owner permissions', 400);
        }
      }
      throw error;
    }
  })
);

// DELETE /api/collaborators/:id - Remove collaborator
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const result = await collaboratorService.removeCollaborator(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        message: 'Collaborator removed successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Collaborator not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to remove collaborator', 403);
        }
        if (error.message.includes('Cannot remove event owner')) {
          throw createError('Cannot remove event owner', 400);
        }
      }
      throw error;
    }
  })
);

export default router;