import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    const payload = verifyToken(token);
    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
      };
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
