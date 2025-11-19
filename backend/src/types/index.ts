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
  phone?: string | undefined;
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
  date: string; // ISO date string
  location?: string | undefined;
}

export interface UpdateEventRequest {
  name?: string | undefined;
  date?: string | undefined; // ISO date string
  location?: string | undefined;
  status?: 'planning' | 'active' | 'completed' | 'archived' | undefined;
}

export interface EventResponse {
  id: string;
  name: string;
  date: Date;
  location?: string;
  status: string;
  ownerUserId: string;
  ownerName?: string;
  userRole: 'owner' | 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

// Guest types
export interface CreateGuestRequest {
  eventId: string;
  name: string;
  lastName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  guestType?: 'primary' | 'companion' | 'child' | undefined;
  primaryGuestId?: string | undefined;
  dietaryRestrictions?: string[] | undefined;
  allergies?: string | undefined;
  currentGroup?: string | undefined;
  side?: string | undefined;
}

export interface UpdateGuestRequest {
  name?: string | undefined;
  lastName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  guestType?: 'primary' | 'companion' | 'child' | undefined;
  primaryGuestId?: string | undefined;
  dietaryRestrictions?: string[] | undefined;
  allergies?: string | undefined;
  currentGroup?: string | undefined;
  side?: string | undefined;
  rsvpStatus?: 'pending' | 'confirmed' | 'declined' | 'maybe' | undefined;
  approved?: boolean | undefined;
  notes?: string | undefined;
}

// Group types
export interface CreateGroupRequest {
  eventId: string;
  name: string;
  color?: string | undefined;
  seatingPreference?: 'no_preference' | 'together' | 'separate' | 'vip' | undefined;
  preferAdjacent?: boolean | undefined;
  priority?: 'low' | 'medium' | 'high' | undefined;
  notes?: string | undefined;
}

export interface UpdateGroupRequest {
  name?: string | undefined;
  color?: string | undefined;
  seatingPreference?: 'no_preference' | 'together' | 'separate' | 'vip' | undefined;
  preferAdjacent?: boolean | undefined;
  priority?: 'low' | 'medium' | 'high' | undefined;
  notes?: string | undefined;
}

export interface GroupResponse {
  id: string;
  eventId: string;
  name: string;
  color: string;
  seatingPreference: string;
  preferAdjacent: boolean;
  priority: string;
  notes?: string;
  guestCount?: number;
  createdAt: Date;
}

// Version types
export interface CreateVersionRequest {
  eventId: string;
  name: string;
  description?: string | undefined;
  hallDimensions?: Record<string, any> | undefined;
}

export interface UpdateVersionRequest {
  name?: string | undefined;
  description?: string | undefined;
  isActive?: boolean | undefined;
  hallDimensions?: Record<string, any> | undefined;
}

export interface VersionResponse {
  id: string;
  eventId: string;
  versionNumber: number;
  name: string;
  description?: string;
  isActive: boolean;
  hallDimensions?: Record<string, any>;
  createdByUser: string;
  createdByName?: string;
  tableCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Table types
export interface CreateTableRequest {
  versionId: string;
  eventId: string;
  name: string;
  number: number;
  totalSeats: number;
  shape?: 'Circle' | 'Rectangle' | 'Square' | 'Oval' | undefined;
  section?: string | undefined;
  position: { x: number; y: number; width?: number | undefined; height?: number | undefined };
  color?: string | undefined;
  adjacentTables?: string[] | undefined;
  isReserved?: boolean | undefined;
  notes?: string | undefined;
}

export interface UpdateTableRequest {
  name?: string | undefined;
  number?: number | undefined;
  totalSeats?: number | undefined;
  shape?: 'Circle' | 'Rectangle' | 'Square' | 'Oval' | undefined;
  section?: string | undefined;
  position?: { x: number; y: number; width?: number | undefined; height?: number | undefined } | undefined;
  color?: string | undefined;
  adjacentTables?: string[] | undefined;
  isReserved?: boolean | undefined;
  notes?: string | undefined;
}

export interface TableResponse {
  id: string;
  versionId: string;
  eventId: string;
  name: string;
  number: number;
  totalSeats: number;
  shape: string;
  section?: string;
  position: { x: number; y: number; width?: number | undefined; height?: number | undefined };
  color?: string;
  adjacentTables: string[];
  isReserved: boolean;
  notes?: string;
  assignedGuests?: number;
  createdAt: Date;
}

// Collaborator types
export interface CreateCollaboratorRequest {
  eventId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UpdateCollaboratorRequest {
  role?: 'admin' | 'editor' | 'viewer' | undefined;
}

export interface CollaboratorResponse {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userDisplayName?: string;
  role: string;
  invitedBy: string;
  invitedByName?: string;
  invitedAt: Date;
  acceptedAt?: Date;
  status: string;
}
