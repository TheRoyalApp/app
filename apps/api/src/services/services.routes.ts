import { Hono } from 'hono';
import type { Context } from 'hono';
import { 
  createService, 
  listServices, 
  getServiceById, 
  updateService, 
  deleteService 
} from './services.controller.js';
import { authMiddleware, adminOrRoleMiddleware } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

const servicesRouter = new Hono();

// Middleware wrapper for staff/admin only
const staffOrAdminMiddleware = async (c: Context, next: any) => {
    return adminOrRoleMiddleware(c, next, 'staff');
};

// Create a new service (staff/admin only)
servicesRouter.post('/', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const serviceData = await c.req.json();
        
        if (!serviceData.name || !serviceData.price || !serviceData.duration) {
            return c.json(errorResponse(400, 'Missing required fields'), 400);
        }

        const { data, error } = await createService(serviceData);

        if (error) {
            const statusCode = error.includes('Missing required fields') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to create service'), 500);
        }

        return c.json(successResponse(201, data), 201);
    } catch (error) {
        console.error('Error creating service:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// List all services
servicesRouter.get('/', async (c: Context) => {
    try {
        const { data, error } = await listServices();

        if (error) {
            return c.json(errorResponse(500, error), 500);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No services found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error listing services:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get service by ID
servicesRouter.get('/:id', async (c: Context) => {
    try {
        const { id } = c.req.param();
        
        if (!id) {
            return c.json(errorResponse(400, 'Service ID is required'), 400);
        }

        const { data, error } = await getServiceById(id);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 
                              error.includes('required') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(404, 'Service not found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error getting service:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Update service (staff/admin only)
servicesRouter.put('/:id', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { id } = c.req.param();
        const updateData = await c.req.json();
        
        if (!id) {
            return c.json(errorResponse(400, 'Service ID is required'), 400);
        }

        const { data, error } = await updateService(id, updateData);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 
                              error.includes('required') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to update service'), 500);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error updating service:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Deactivate service (staff/admin only)
servicesRouter.delete('/:id', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { id } = c.req.param();
        
        if (!id) {
            return c.json(errorResponse(400, 'Service ID is required'), 400);
        }

        const { data, error } = await deleteService(id);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 
                              error.includes('required') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to deactivate service'), 500);
        }

        return c.json(successResponse(200, { message: 'Service deactivated successfully' }), 200);
    } catch (error) {
        console.error('Error deactivating service:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

export default servicesRouter; 