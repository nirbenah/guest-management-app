import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { AuthService } from '../services/authService.simple';
import { validateData, createUserSchema, loginSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const router = Router();
const authService = new AuthService();

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    try {
      // Validate input
      const validatedData = validateData(createUserSchema, req.body);
      
      // Register user
      const result = await authService.register(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw createError('Email already registered', 400);
      }
      throw error;
    }
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    try {
      // Validate input
      const validatedData = validateData(loginSchema, req.body);
      
      // Login user
      const result = await authService.login(validatedData);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid credentials')) {
        throw createError('Invalid email or password', 401);
      }
      throw error;
    }
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const user = await authService.getUserById(req.user.id);
    
    res.json({
      success: true,
      data: { user },
    });
  })
);

export default router;
