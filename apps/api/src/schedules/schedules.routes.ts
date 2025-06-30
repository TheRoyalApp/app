import { Hono } from 'hono';
import type { Context } from 'hono';
import { 
  setBarberSchedule, 
  getBarberSchedules, 
  getAllSchedules, 
  getAvailability, 
  updateSchedule, 
  deleteSchedule 
} from './schedules.controller.js';
import { authMiddleware, adminOrRoleMiddleware } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

const schedulesRouter = new Hono();

// Middleware wrapper for staff/admin only
const staffOrAdminMiddleware = async (c: Context, next: any) => {
    return adminOrRoleMiddleware(c, next, 'staff');
};

// Set barber schedule (staff/admin only)
schedulesRouter.post('/set-schedule', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { barberId, dayOfWeek, availableTimeSlots } = await c.req.json();
        
        if (!barberId || !dayOfWeek || !availableTimeSlots) {
            return c.json(errorResponse(400, 'Missing required fields'), 400);
        }

        const { data, error } = await setBarberSchedule(barberId, dayOfWeek, availableTimeSlots);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 
                              error.includes('not a barber') ? 403 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to set schedule'), 500);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error setting barber schedule:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get all schedules for a specific barber
schedulesRouter.get('/barber/:barberId', authMiddleware, async (c: Context) => {
    try {
        const { barberId } = c.req.param();
        
        if (!barberId) {
            return c.json(errorResponse(400, 'Barber ID is required'), 400);
        }

        const { data, error } = await getBarberSchedules(barberId);

        if (error) {
            return c.json(errorResponse(500, error), 500);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No schedules found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching barber schedules:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get all schedules (staff/admin only)
schedulesRouter.get('/', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { data, error } = await getAllSchedules();

        if (error) {
            return c.json(errorResponse(500, error), 500);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No schedules found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching all schedules:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get availability for a specific date
schedulesRouter.post('/availability', authMiddleware, async (c: Context) => {
    try {
        const { barberId, date } = await c.req.json();
        
        if (!barberId || !date) {
            return c.json(errorResponse(400, 'Barber ID and date are required'), 400);
        }

        const { data, error } = await getAvailability(barberId, date);

        if (error) {
            const statusCode = error.includes('Invalid date format') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(404, 'Availability not found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error getting availability:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Update schedule (staff/admin only)
schedulesRouter.put('/:id', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { id } = c.req.param();
        const updateData = await c.req.json();
        
        if (!id) {
            return c.json(errorResponse(400, 'Schedule ID is required'), 400);
        }

        const { data, error } = await updateSchedule(id, updateData);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to update schedule'), 500);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error updating schedule:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Delete schedule (staff/admin only)
schedulesRouter.delete('/:id', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { id } = c.req.param();
        
        if (!id) {
            return c.json(errorResponse(400, 'Schedule ID is required'), 400);
        }

        const { data, error } = await deleteSchedule(id);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to delete schedule'), 500);
        }

        return c.json(successResponse(200, { message: 'Schedule deleted successfully' }), 200);
    } catch (error) {
        console.error('Error deleting schedule:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

export default schedulesRouter;
