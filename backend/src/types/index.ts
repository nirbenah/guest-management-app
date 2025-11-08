// Common types for the application
import { Request } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// User types
export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  token: string;
}

// Event types
export interface CreateEventRequest {
  name: string;
  date: Date;
  location?: string;
}

export interface UpdateEventRequest {
  name?: string;
  date?: Date;
  location?: string;
  status?: string;
}

// Guest types
export interface CreateGuestRequest {
  eventId: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  guestType?: 'primary' | 'companion' | 'child';
  primaryGuestId?: string;
  dietaryRestrictions?: string[];
  allergies?: string;
  currentGroup?: string;
  side?: string;
}
