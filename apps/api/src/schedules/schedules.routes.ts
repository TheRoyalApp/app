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
import { getDatabase } from '../db/connection.js';
import { appointments, users, services } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

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
            // Map error messages to appropriate HTTP status codes
            let statusCode = 500;
            if (error.includes('no encontrado') || error.includes('not found')) {
                statusCode = 404;
            } else if (error.includes('Formato de fecha inválido') || error.includes('Invalid date format')) {
                statusCode = 400;
            } else if (error.includes('Fecha inválida')) {
                statusCode = 400;
            } else if (error.includes('fechas pasadas')) {
                statusCode = 400;
            } else if (error.includes('Error interno del servidor') || error.includes('Internal server error')) {
                statusCode = 500;
            }
            
            return c.json(errorResponse(statusCode, error), statusCode as any);
        }

        if (!data) {
            return c.json(errorResponse(404, 'No se encontró disponibilidad para esta fecha'), 404);
        }

        return c.json(successResponse(200, data), 200);
    } catch (error) {
        console.error('Error getting availability:', error);
        return c.json(errorResponse(500, 'Error interno del servidor. Por favor, intenta nuevamente más tarde.'), 500);
    }
});

// Debug endpoint to show all appointments for a specific date
schedulesRouter.post('/debug-appointments', authMiddleware, async (c: Context) => {
    try {
        const { barberId, date } = await c.req.json();
        
        if (!barberId || !date) {
            return c.json(errorResponse(400, 'Barber ID and date are required'), 400);
        }

        const db = await getDatabase();
        
        // Convert dd/mm/yyyy to Date object
        const dateParts = date.split('/');
        if (dateParts.length !== 3) {
            return c.json(errorResponse(400, 'Formato de fecha inválido. Se espera dd/mm/yyyy'), 400);
        }
        
        const [day, month, year] = dateParts;
        if (!day || !month || !year) {
            return c.json(errorResponse(400, 'Formato de fecha inválido. Se espera dd/mm/yyyy'), 400);
        }
        
        const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Check if date is valid
        if (isNaN(targetDate.getTime())) {
            return c.json(errorResponse(400, 'Fecha inválida'), 400);
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const appointmentsList = await db
            .select({
                id: appointments.id,
                userId: appointments.userId,
                barberId: appointments.barberId,
                serviceId: appointments.serviceId,
                appointmentDate: appointments.appointmentDate,
                timeSlot: appointments.timeSlot,
                status: appointments.status,
                notes: appointments.notes,
                createdAt: appointments.createdAt,
                updatedAt: appointments.updatedAt,
                customerName: users.firstName,
                customerLastName: users.lastName,
                serviceName: services.name
            })
            .from(appointments)
            .leftJoin(users, eq(appointments.userId, users.id))
            .leftJoin(services, eq(appointments.serviceId, services.id))
            .where(
                and(
                    eq(appointments.barberId, barberId),
                    gte(appointments.appointmentDate, startOfDay),
                    lte(appointments.appointmentDate, endOfDay)
                )
            )
            .orderBy(appointments.timeSlot);

        return c.json(successResponse(200, {
            date,
            barberId,
            totalAppointments: appointmentsList.length,
            appointments: appointmentsList
        }), 200);
    } catch (error) {
        console.error('Error getting debug appointments:', error);
        return c.json(errorResponse(500, 'Error interno del servidor. Por favor, intenta nuevamente más tarde.'), 500);
    }
});

// Temporary debug endpoint to find all appointments
schedulesRouter.post('/debug-all-appointments', authMiddleware, async (c: Context) => {
    try {
        const { barberId } = await c.req.json();
        
        if (!barberId) {
            return c.json(errorResponse(400, 'Barber ID is required'), 400);
        }

        const db = await getDatabase();
        
        // Get all appointments for this barber
        const allAppointments = await db
            .select({
                id: appointments.id,
                userId: appointments.userId,
                barberId: appointments.barberId,
                serviceId: appointments.serviceId,
                appointmentDate: appointments.appointmentDate,
                timeSlot: appointments.timeSlot,
                status: appointments.status,
                notes: appointments.notes,
                createdAt: appointments.createdAt,
                updatedAt: appointments.updatedAt,
                customerName: users.firstName,
                customerLastName: users.lastName,
                serviceName: services.name
            })
            .from(appointments)
            .leftJoin(users, eq(appointments.userId, users.id))
            .leftJoin(services, eq(appointments.serviceId, services.id))
            .where(eq(appointments.barberId, barberId))
            .orderBy(appointments.appointmentDate, appointments.timeSlot);

        return c.json(successResponse(200, {
            barberId,
            totalAppointments: allAppointments.length,
            appointments: allAppointments
        }), 200);
    } catch (error) {
        console.error('Error getting all appointments:', error);
        return c.json(errorResponse(500, 'Error interno del servidor. Por favor, intenta nuevamente más tarde.'), 500);
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
