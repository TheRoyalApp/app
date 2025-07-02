import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { authMiddleware, adminOrRoleMiddleware } from '../middleware/auth.middleware.js';
import { 
  createAppointment, 
  getAppointmentsByStatus, 
  updateAppointmentStatus, 
  getUserAppointments, 
  getBarberAppointments, 
  deleteAppointment, 
  rescheduleAppointment 
} from './apoinments.controller.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { getDatabase } from '../db/connection.js';
import { appointments, users, services } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const appointmentsRouter = new Hono();

// Custom middleware to allow internal secret
appointmentsRouter.use('/*', async (c, next) => {
  const internalSecret = c.req.header('x-internal-secret');
  if (internalSecret && internalSecret === process.env.INTERNAL_API_SECRET) {
    // Bypass auth for internal requests
    return next();
  }
  // Otherwise, require auth
  return authMiddleware(c, next);
});

// Middleware wrapper for adminOrRoleMiddleware
const staffOrAdminMiddleware = async (c: Context, next: Next) => {
    return adminOrRoleMiddleware(c, next, 'staff');
};

// Create a new appointment
appointmentsRouter.post('/', async (c: Context) => {
    try {
        const appointmentData = await c.req.json();
        
        if (!appointmentData.userId || !appointmentData.barberId || !appointmentData.serviceId || !appointmentData.appointmentDate || !appointmentData.timeSlot) {
            return c.json(errorResponse(400, 'Missing required fields'), 400);
        }

        const { data, error } = await createAppointment(appointmentData);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 
                              error.includes('not available') ? 409 : 
                              error.includes('Invalid date format') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to create appointment'), 500);
        }

        return c.json(successResponse(201, data), 201);
    } catch (error) {
        console.error('Error creating appointment:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});



// Update appointment status (staff/admin only)
appointmentsRouter.put('/:id/status', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { id: rawId } = c.req.param();
        const id = rawId || '';
        const { status } = await c.req.json();
        
        if (!id) {
            return c.json(errorResponse(400, 'Appointment ID is required'), 400);
        }

        if (!status) {
            return c.json(errorResponse(400, 'Status is required'), 400);
        }

        const { data, error } = await updateAppointmentStatus(id, status);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 
                              error.includes('Invalid status') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to update appointment status'), 500);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error updating appointment status:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get appointments for the current authenticated user
appointmentsRouter.get('/user/me', authMiddleware, async (c: Context) => {
    try {
        const user = c.get('user');
        
        if (!user || !user.id) {
            return c.json(errorResponse(401, 'User not authenticated'), 401);
        }

        const { data, error } = await getUserAppointments(user.id);

        if (error) {
            return c.json(errorResponse(500, error), 500);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No appointments found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get appointments for a specific user
appointmentsRouter.get('/user/:userId', authMiddleware, async (c: Context) => {
    try {
        const { userId } = c.req.param();
        
        if (!userId) {
            return c.json(errorResponse(400, 'User ID is required'), 400);
        }

        const { data, error } = await getUserAppointments(userId);

        if (error) {
            return c.json(errorResponse(500, error), 500);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No appointments found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching user appointments:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get appointments for a specific barber
appointmentsRouter.get('/barber/:barberId', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { barberId } = c.req.param();
        
        if (!barberId) {
            return c.json(errorResponse(400, 'Barber ID is required'), 400);
        }

        const { data, error } = await getBarberAppointments(barberId);

        if (error) {
            return c.json(errorResponse(500, error), 500);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No appointments found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching barber appointments:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get appointment by ID (user can only access their own appointments, admin can access any)
appointmentsRouter.get('/:id', authMiddleware, async (c: Context) => {
    try {
        const { id: rawId } = c.req.param();
        const id = rawId || '';
        const user = c.get('user');

        if (!id) {
            return c.json(errorResponse(400, 'Appointment ID is required'), 400);
        }

        if (!user || !user.id) {
            return c.json(errorResponse(401, 'User not authenticated'), 401);
        }

        // Fetch the appointment from the DB
        const db = await getDatabase();
        const existingAppointment = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);

        if (existingAppointment.length === 0) {
            return c.json(errorResponse(404, 'Appointment not found'), 404);
        }

        // Check if the user is the owner or admin
        if (!existingAppointment[0] || (existingAppointment[0].userId !== user.id && !user.isAdmin)) {
            return c.json(errorResponse(403, 'Access denied'), 403);
        }

        // Get appointment with related data
        const appointmentWithDetails = await db
            .select({
                id: appointments.id,
                userId: appointments.userId,
                barberId: appointments.barberId,
                serviceId: appointments.serviceId,
                appointmentDate: appointments.appointmentDate,
                timeSlot: appointments.timeSlot,
                status: appointments.status,
                notes: appointments.notes,
                rescheduleCount: appointments.rescheduleCount,
                createdAt: appointments.createdAt,
                updatedAt: appointments.updatedAt,
                barberName: users.firstName,
                barberLastName: users.lastName,
                serviceName: services.name,
                servicePrice: services.price
            })
            .from(appointments)
            .leftJoin(users, eq(appointments.barberId, users.id))
            .leftJoin(services, eq(appointments.serviceId, services.id))
            .where(eq(appointments.id, id))
            .limit(1);

        if (appointmentWithDetails.length === 0 || !appointmentWithDetails[0]) {
            return c.json(errorResponse(404, 'Appointment not found'), 404);
        }

        return c.json(successResponse(200, appointmentWithDetails[0]), 200);
    } catch (error) {
        console.error('Error fetching appointment by ID:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Delete appointment (staff/admin only)
appointmentsRouter.delete('/:id', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { id: rawId } = c.req.param();
        const id = rawId || '';
        
        if (!id) {
            return c.json(errorResponse(400, 'Appointment ID is required'), 400);
        }

        const { data, error } = await deleteAppointment(id);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to delete appointment'), 500);
        }

        return c.json(successResponse(200, { message: 'Appointment deleted successfully' }), 200);
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Reschedule appointment (user only, max 1 time)
appointmentsRouter.put('/:id/reschedule', authMiddleware, async (c: Context) => {
    try {
        const { id: rawId } = c.req.param();
        const id = rawId || '';
        const { appointmentDate, timeSlot } = await c.req.json();
        const user = c.get('user'); // get the authenticated user

        console.log('🔍 RESCHEDULE DEBUG:', {
            appointmentId: id,
            userId: user.id,
            userIsAdmin: user.isAdmin,
            appointmentDate,
            timeSlot
        });

        // Fetch the appointment from the DB
        const db = await getDatabase();
        const existingAppointment = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);

        console.log('🔍 Appointment from DB:', {
            found: existingAppointment.length > 0,
            appointment: existingAppointment[0] ? {
                id: existingAppointment[0].id,
                userId: existingAppointment[0].userId,
                barberId: existingAppointment[0].barberId,
                status: existingAppointment[0].status
            } : null
        });

        if (existingAppointment.length === 0) {
            return c.json(errorResponse(404, 'Appointment not found'), 404);
        }

        // Check if the user is the owner or admin
        if (!existingAppointment[0] || (existingAppointment[0].userId !== user.id && !user.isAdmin)) {
            console.log('❌ ACCESS DENIED:', {
                appointmentUserId: existingAppointment[0]?.userId,
                currentUserId: user.id,
                userIsAdmin: user.isAdmin,
                ownershipCheck: existingAppointment[0]?.userId !== user.id,
                adminCheck: !user.isAdmin
            });
            return c.json(errorResponse(403, 'Access denied'), 403);
        }

        const { data, error } = await rescheduleAppointment(id, appointmentDate, timeSlot);

        if (error) {
            const statusCode = error.includes('not found') ? 404 : 
                              error.includes('not available') ? 409 : 
                              error.includes('limit reached') ? 403 :
                              error.includes('Invalid date format') ? 400 : 500;
            return c.json(errorResponse(statusCode, error), statusCode);
        }

        if (!data) {
            return c.json(errorResponse(500, 'Failed to reschedule appointment'), 500);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

// Get appointments by status (staff/admin only) - must be last to avoid conflicts
appointmentsRouter.get('/:status', authMiddleware, staffOrAdminMiddleware, async (c: Context) => {
    try {
        const { status } = c.req.param();
        
        if (!status) {
            return c.json(errorResponse(400, 'Status is required'), 400);
        }

        const { data, error } = await getAppointmentsByStatus(status);

        if (error) {
            return c.json(errorResponse(500, error), 500);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No appointments found'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error fetching appointments by status:', error);
        return c.json(errorResponse(500, 'Internal server error'), 500);
    }
});

export default appointmentsRouter;
