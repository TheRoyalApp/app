import { Hono } from 'hono';
import type { Context } from 'hono';
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { getAllUsers, getUserById, updateUser, deleteUser } from './users.controller.js';
import { createUser } from '../use-cases/create-user.js';
import type { User } from './users.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';

const usersRouter = new Hono();

// Get current user profile
usersRouter.get('/profile', authMiddleware, async (c: Context) => {
    try {
        const user = c.get('user');
        
        if (!user || !user.id) {
            return c.json(errorResponse(401, 'User not authenticated'), 401);
        }

        const { data, error } = await getUserById(user.id);

        if (error) {
            return c.json(errorResponse(404, 'User not found'), 404);
        }

        if (!data) {
            return c.json(errorResponse(404, 'User not found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return c.json(errorResponse(500, 'Failed to fetch user profile'), 500);
    }
});

// Get all users
usersRouter.get('/all', authMiddleware, adminMiddleware, async (c: Context) => {
    try {
        const { data, error } = await getAllUsers();

        if (error) {
            return c.json(errorResponse(404, 'No users found'), 404);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No users found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching users:', error);
        return c.json(errorResponse(500, 'Failed to fetch users'), 500);
    }
});

// Get user by id
usersRouter.get('/:id', authMiddleware, async (c: Context) => {
    const { id } = c.req.param();

    if (!id) {
        return c.json(errorResponse(400, 'User ID is required'), 400);
    }

    const { data, error } = await getUserById(id as string);

    if (error) {
        return c.json(errorResponse(404, 'User not found'), 404);
    }

    if (!data) {
        return c.json(errorResponse(404, 'User not found'), 404);
    }

    return c.json(successResponse(200, data), 200);
});

// Create user
usersRouter.post('/new', authMiddleware, adminMiddleware, async (c: Context) => {
    try {
        const body = await c.req.json();
        const { data, error } = await createUser(body as User);

        if (error) {
            return c.json(errorResponse(400, error), 400);
        }

        if (!data) {
            return c.json(errorResponse(400, 'Failed to create user'), 400);
        }

        return c.json(successResponse(201, data), 201);
    } catch (error) {
        console.error('Error creating user:', error);
        return c.json(errorResponse(500, 'Failed to create user'), 500);
    }
});

// Update user (users can edit their own profile, admins can edit any user)
usersRouter.put('/:id', authMiddleware, async (c: Context) => {
    try {
        const { id } = c.req.param();
        const body = await c.req.json();
        const user = c.get('user');

        if (!id) {
            return c.json(errorResponse(400, 'User ID is required'), 400);
        }

        // Check permissions: users can only edit their own profile, admins can edit any user
        if (user.id !== id && !user.isAdmin) {
            return c.json(errorResponse(403, 'You can only edit your own profile'), 403);
        }

        const { data, error } = await updateUser(id as string, body);

        if (error) {
            return c.json(errorResponse(400, error), 400);
        }

        if (!data) {
            return c.json(errorResponse(404, 'User not found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error updating user:', error);
        return c.json(errorResponse(500, 'Failed to update user'), 500);
    }
});

// Delete user (admin only)
usersRouter.delete('/:id', authMiddleware, adminMiddleware, async (c: Context) => {
    try {
        const { id } = c.req.param();
        const user = c.get('user');

        if (!id) {
            return c.json(errorResponse(400, 'User ID is required'), 400);
        }

        // Prevent admin from deleting themselves
        if (user.id === id) {
            return c.json(errorResponse(400, 'Cannot delete your own account'), 400);
        }

        const { data, error } = await deleteUser(id as string);

        if (error) {
            return c.json(errorResponse(400, error), 400);
        }

        if (!data) {
            return c.json(errorResponse(404, 'User not found'), 404);
        }

        return c.json(successResponse(200, { message: 'User deleted successfully' }), 200);
    } catch (error) {
        console.error('Error deleting user:', error);
        return c.json(errorResponse(500, 'Failed to delete user'), 500);
    }
});

export default usersRouter;