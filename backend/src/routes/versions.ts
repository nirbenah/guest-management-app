import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { VersionService } from '../services/versionService';
import { validateData, createVersionSchema, updateVersionSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();
const versionService = new VersionService();

// Apply authentication to all version routes
router.use(authenticateToken);

// POST /api/versions - Create new version
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const validatedData = validateData(createVersionSchema, req.body);
    const version = await versionService.createVersion(req.user.id, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Version created successfully',
      data: { version },
    });
  })
);

// GET /api/versions/event/:eventId - Get all versions for an event
router.get(
  '/event/:eventId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const versions = await versionService.getEventVersions(req.params.eventId!, req.user.id);
      
      res.json({
        success: true,
        data: { versions },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Event not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/versions/:id - Get version details
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const version = await versionService.getVersionById(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { version },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Version not found or access denied', 404);
      }
      throw error;
    }
  })
);

// PUT /api/versions/:id - Update version
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const validatedData = validateData(updateVersionSchema, req.body);
      const version = await versionService.updateVersion(req.params.id!, req.user.id, validatedData);
      
      res.json({
        success: true,
        message: 'Version updated successfully',
        data: { version },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Version not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to update version', 403);
        }
      }
      throw error;
    }
  })
);

// POST /api/versions/:id/activate - Activate version (set as active)
router.post(
  '/:id/activate',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const version = await versionService.activateVersion(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        message: 'Version activated successfully',
        data: { version },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Version not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to activate version', 403);
        }
      }
      throw error;
    }
  })
);

// POST /api/versions/:id/duplicate - Duplicate version
router.post(
  '/:id/duplicate',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const { name } = req.body;
      const version = await versionService.duplicateVersion(req.params.id!, req.user.id, name);
      
      res.status(201).json({
        success: true,
        message: 'Version duplicated successfully',
        data: { version },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Version not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to duplicate version', 403);
        }
      }
      throw error;
    }
  })
);

// DELETE /api/versions/:id - Delete version
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const result = await versionService.deleteVersion(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        message: 'Version deleted successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Version not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to delete version', 403);
        }
        if (error.message.includes('Cannot delete active version')) {
          throw createError('Cannot delete active version', 400);
        }
        if (error.message.includes('Cannot delete version with existing tables')) {
          throw createError('Cannot delete version with existing tables', 400);
        }
      }
      throw error;
    }
  })
);

export default router;