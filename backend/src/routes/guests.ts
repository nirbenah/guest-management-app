import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { GuestService } from '../services/guestService';
import { validateData, createGuestSchema, updateGuestSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();
const guestService = new GuestService();

// Apply authentication to all guest routes
router.use(authenticateToken);

// POST /api/guests - Create new guest
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const validatedData = validateData(createGuestSchema, req.body);
    const guest = await guestService.createGuest(req.user.id, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Guest created successfully',
      data: { guest },
    });
  })
);

// GET /api/guests/event/:eventId - Get all guests for an event
router.get(
  '/event/:eventId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const guests = await guestService.getEventGuests(req.params.eventId!, req.user.id);
      
      res.json({
        success: true,
        data: { guests },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Event not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/guests/:id - Get guest details
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const guest = await guestService.getGuestById(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { guest },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Guest not found or access denied', 404);
      }
      throw error;
    }
  })
);

// PUT /api/guests/:id - Update guest
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const validatedData = validateData(updateGuestSchema, req.body);
      const guest = await guestService.updateGuest(req.params.id!, req.user.id, validatedData);
      
      res.json({
        success: true,
        message: 'Guest updated successfully',
        data: { guest },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Guest not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to update guest', 403);
        }
      }
      throw error;
    }
  })
);

// DELETE /api/guests/:id - Delete guest
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const result = await guestService.deleteGuest(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        message: 'Guest deleted successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Guest not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to delete guest', 403);
        }
      }
      throw error;
    }
  })
);

export default router;
