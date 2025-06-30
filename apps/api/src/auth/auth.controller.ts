import type { Context } from 'hono';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { getValidatedBody } from '../middleware/validation.middleware.js';
import { createUserSchema, loginSchema, refreshTokenSchema } from '../helpers/validation.schemas.js';
import { getDatabase } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import winstonLogger from '../helpers/logger.js';
import type { CreateUserRequest, LoginRequest, RefreshTokenRequest } from './auth.d.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';

export function generateToken(user: any): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.isAdmin ? 'admin' : user.role,
    isAdmin: user.isAdmin
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(user: any): string {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'refresh'
  };

  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function verifyRefreshToken(refreshToken: string): Promise<any> {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
    
    // Verify the token type
    if (decoded.type !== 'refresh') {
      return null;
    }

    // Get user from database to ensure they still exist
    const db = await getDatabase();
    const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    
    if (user.length === 0) {
      return null;
    }

    return user[0];
  } catch (error) {
    return null;
  }
}

export async function signup(c: Context) {
  try {
    const validatedData = getValidatedBody<CreateUserRequest>(c);
    
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
    
    if (existingUser.length > 0) {
      winstonLogger.warn('Signup attempt with existing email', { email: validatedData.email });
      return c.json(errorResponse(409, 'User with this email already exists'), 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Handle role mapping - admin becomes staff with isAdmin=true
    const dbRole = validatedData.role === 'admin' ? 'staff' : validatedData.role;
    const isAdmin = validatedData.role === 'admin';

    // Create user
    const newUser = await db.insert(users).values({
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      role: dbRole,
      isAdmin: isAdmin
    }).returning();

    const user = newUser[0];
    
    if (!user) {
      winstonLogger.error('Failed to create user - no user returned');
      return c.json(errorResponse(500, 'Failed to create user'), 500);
    }

    // Ensure correct role in token
    if (user.isAdmin) user.role = 'admin' as any;

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    winstonLogger.info('User registered successfully', { 
      userId: user.id, 
      email: user.email, 
      role: validatedData.role // Use original role for logging
    });

    return c.json(successResponse(201, {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isAdmin: user.isAdmin,
        role: validatedData.role, // Return original role to client
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      accessToken: token,
      refreshToken
    }), 201);

  } catch (error) {
    winstonLogger.error('Signup error', error);
    return c.json(errorResponse(500, 'Failed to create user'), 500);
  }
}

export async function signin(c: Context) {
  try {
    const validatedData = getValidatedBody<LoginRequest>(c);
    
    const db = await getDatabase();
    
    // Find user by email
    const userResult = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
    
    if (userResult.length === 0) {
      winstonLogger.warn('Login attempt with non-existent email', { email: validatedData.email });
      return c.json(errorResponse(401, 'Invalid credentials'), 401);
    }

    const user = userResult[0];
    
    if (!user) {
      winstonLogger.error('User not found after database query');
      return c.json(errorResponse(401, 'Invalid credentials'), 401);
    }

    // Ensure correct role in token
    if (user.isAdmin) user.role = 'admin' as any;

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isValidPassword) {
      winstonLogger.warn('Login attempt with wrong password', { email: validatedData.email });
      return c.json(errorResponse(401, 'Invalid credentials'), 401);
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    winstonLogger.info('User logged in successfully', { 
      userId: user.id, 
      email: user.email 
    });

    return c.json(successResponse(200, {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isAdmin: user.isAdmin,
        role: user.role
      },
      accessToken: token,
      refreshToken
    }));

  } catch (error) {
    winstonLogger.error('Signin error', error);
    return c.json(errorResponse(500, 'Failed to authenticate'), 500);
  }
}

export async function refresh(c: Context) {
  try {
    const validatedData = getValidatedBody<RefreshTokenRequest>(c);
    
    const user = await verifyRefreshToken(validatedData.refreshToken);
    
    if (!user) {
      winstonLogger.warn('Invalid refresh token attempt');
      return c.json(errorResponse(401, 'Invalid refresh token'), 401);
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    winstonLogger.info('Token refreshed successfully', { userId: user.id });

    return c.json(successResponse(200, {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isAdmin: user.isAdmin,
        role: user.role
      },
      accessToken: newToken,
      refreshToken: newRefreshToken
    }));

  } catch (error) {
    winstonLogger.error('Token refresh error', error);
    return c.json(errorResponse(500, 'Failed to refresh token'), 500);
  }
}

export async function logout(c: Context) {
  try {
    const validatedData = getValidatedBody<RefreshTokenRequest>(c);
    
    // In a production environment, you might want to blacklist the refresh token
    // For now, we'll just return success since JWT tokens are stateless
    
    winstonLogger.info('User logged out successfully');

    return c.json(successResponse(200, {
      message: 'Logged out successfully'
    }));

  } catch (error) {
    winstonLogger.error('Logout error', error);
    return c.json(errorResponse(500, 'Failed to logout'), 500);
  }
}

export async function deleteOwnAccount(c: Context) {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json(errorResponse(401, 'User not authenticated'), 401);
    }
    const db = await getDatabase();
    const result = await db.delete(users).where(eq(users.id, user.id)).returning();
    if (!result || result.length === 0) {
      return c.json(errorResponse(404, 'User not found'), 404);
    }
    return c.json(successResponse(200, { message: 'Account deleted successfully' }), 200);
  } catch (error) {
    return c.json(errorResponse(500, 'Failed to delete account'), 500);
  }
}