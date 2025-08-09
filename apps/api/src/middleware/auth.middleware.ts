import type { Context, Next } from 'hono';
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import type { User } from '../users/users.d.js';
import { generateToken, verifyRefreshToken, verifyToken, verifyTokenWithUser } from '../auth/auth.controller.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: User;
  }
}

function validateJWTToken(token: string): User | null {
  const user = verifyToken(token);

  if (!user) {
    return null;
  }

  return user;
}

async function validateJWTTokenWithUser(token: string): Promise<User | null> {
  const user = await verifyTokenWithUser(token);

  if (!user) {
    return null;
  }

  return user;
}

async function validateRefreshToken(refreshToken: string): Promise<User | null> {
  const user = await verifyRefreshToken(refreshToken);

  if (!user) {
    return null;
  }

  return user;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const refreshToken = c.req.header('Refresh-Token');

  if (!authHeader) {
    return c.json(errorResponse(401, 'Authorization header is required'), 401);
  }

  // Verify suffix (Bearer)
  if (!authHeader.startsWith('Bearer ')) {
    return c.json(errorResponse(401, 'Invalid authorization header format. Use: Bearer <token>'), 401);
  }

  const token = authHeader.substring(7);

  let user = await validateJWTTokenWithUser(token);

  if (!user) {
    if (!refreshToken) {
      return c.json(errorResponse(401, 'Refresh token is required'), 401);
    }

    user = await validateRefreshToken(refreshToken);

    if (!user) {
      return c.json(errorResponse(401, 'Invalid refresh token'), 401);
    }

    const newJWT = generateToken(user);

    // Patch user object for admin
    user.isAdmin = !!user.isAdmin;
    if (user.isAdmin) user.role = 'admin' as any;

    c.set('user', user);
    return c.json(successResponse(200, { token: newJWT }), 200);
  }

  // Patch user object for admin
  user.isAdmin = !!user.isAdmin;
  if (user.isAdmin) user.role = 'admin' as any;

  c.set('user', user);
  await next();
}

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.get('user');

  if (!user) {
    return c.json(errorResponse(401, 'User not authenticated'), 401);
  }

  if (!user.isAdmin) {
    return c.json(errorResponse(403, 'Admin access required'), 403);
  }

  await next();
}

// Validate if user has required role 
export async function roleMiddleware(c: Context, next: Next, role: string) {
  const user = c.get('user');

  if (!user) {
    return c.json(errorResponse(401, 'User not authenticated'), 401);
  }

  if (user.role !== role) {
    return c.json(errorResponse(403, 'Access denied'), 403);
  }

  await next();
}

// either admin or role middleware
export async function adminOrRoleMiddleware(c: Context, next: Next, role: string) {
  const user = c.get('user');

  if (!user) {
    return c.json(errorResponse(401, 'User not authenticated'), 401);
  }

  // Allow if user is the required role OR is admin
  if (user.role !== role && !user.isAdmin) {
    return c.json(errorResponse(403, 'Access denied'), 403);
  }

  await next();
}