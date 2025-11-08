import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { generateToken } from '../utils/jwt';
import { CreateUserRequest, LoginRequest, AuthResponse } from '../types';

const dbClient = new Client(process.env.DATABASE_URL);

export class AuthService {
  private async getDbClient() {
    if (!dbClient._connected) {
      await dbClient.connect();
    }
    return dbClient;
  }

  async register(data: CreateUserRequest): Promise<AuthResponse> {
    const client = await this.getDbClient();
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const userId = randomUUID();
    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, phone, created_at, is_active) 
       VALUES ($1, $2, $3, $4, $5, NOW(), true)`,
      [userId, data.email, passwordHash, data.displayName, data.phone || null]
    );

    // Get created user
    const userResult = await client.query(
      'SELECT id, email, display_name FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
      token,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const client = await this.getDbClient();
    
    // Find user by email
    const userResult = await client.query(
      'SELECT id, email, password_hash, display_name, is_active FROM users WHERE email = $1',
      [data.email]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await client.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
      token,
    };
  }

  async getUserById(userId: string) {
    const client = await this.getDbClient();
    
    const result = await client.query(
      `SELECT id, email, display_name, phone, avatar_url, created_at, last_login_at 
       FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      displayName: result.rows[0].display_name,
      phone: result.rows[0].phone,
      avatarUrl: result.rows[0].avatar_url,
      createdAt: result.rows[0].created_at,
      lastLoginAt: result.rows[0].last_login_at,
    };
  }
}