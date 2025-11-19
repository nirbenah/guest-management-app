import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { EventService } from '../services/eventService';
import { validateData, createEventSchema, updateEventSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();
const eventService = new EventService();

// Apply authentication to all event routes
router.use(authenticateToken);

// GET /api/events - Get user's events
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const events = await eventService.getUserEvents(req.user.id);
    
    res.json({
      success: true,
      data: { events },
    });
  })
);

// POST /api/events - Create new event
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const validatedData = validateData(createEventSchema, req.body);
    const event = await eventService.createEvent(req.user.id, validatedData);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event },
    });
  })
);

// GET /api/events/:id - Get event details
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const event = await eventService.getEventById(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { event },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Event not found or access denied', 404);
      }
      throw error;
    }
  })
);

// GET /api/events/:id/stats - Get event statistics
router.get(
  '/:id/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const stats = await eventService.getEventStats(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError('Event not found or access denied', 404);
      }
      throw error;
    }
  })
);

// PUT /api/events/:id - Update event
router.put(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const validatedData = validateData(updateEventSchema, req.body);
      const event = await eventService.updateEvent(req.params.id!, req.user.id, validatedData);
      
      res.json({
        success: true,
        message: 'Event updated successfully',
        data: { event },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Event not found', 404);
        }
        if (error.message.includes('Insufficient permissions')) {
          throw createError('Insufficient permissions to update event', 403);
        }
      }
      throw error;
    }
  })
);

// DELETE /api/events/:id - Delete event
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    try {
      const result = await eventService.deleteEvent(req.params.id!, req.user.id);
      
      res.json({
        success: true,
        message: 'Event deleted successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw createError('Event not found', 404);
        }
        if (error.message.includes('Only event owner')) {
          throw createError('Only event owner can delete the event', 403);
        }
      }
      throw error;
    }
  })
);

export default router;
