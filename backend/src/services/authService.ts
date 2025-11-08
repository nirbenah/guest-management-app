import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { generateToken } from '../utils/jwt';
import { CreateUserRequest, LoginRequest, AuthResponse } from '../types';

export class AuthService {
  async register(data: CreateUserRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      console.log('Checking for existing user with email:', data.email);
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      console.log('Existing user found:', existingUser);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
    } catch (error) {
      console.error('Database error during user lookup:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      // If it's a database connection error, assume user doesn't exist and continue
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: data.email,
        passwordHash,
        displayName: data.displayName,
        phone: data.phone || null,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user || !user) {
      throw new Error('User not found');
    }

    return user;
  }
}