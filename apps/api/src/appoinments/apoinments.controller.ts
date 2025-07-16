import type { Context } from 'hono';
import { getDatabase } from "../db/connection.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { appointments, users, services } from "../db/schema.js";
import type { Appointment, Status } from "./appoinments.d.js";
import { isTimeSlotAvailable } from "../schedules/schedules.controller.js";
import type { TimeSlot } from "../schedules/schedules.d.js";
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { sendAppointmentConfirmation } from "../notifications/notifications.controller.js";

// Helper function to convert dd/mm/yyyy to Date object
function parseDate(dateString: string): Date | null {
  const dateParts = dateString.split('/');
  if (dateParts.length !== 3) {
    return null;
  }
  
  const [day, month, year] = dateParts;
  if (!day || !month || !year) {
    return null;
  }
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

// Create a new appointment
export async function createAppointment(appointmentData: {
  userId: string;
  barberId: string;
  serviceId: string;
  appointmentDate: string;
  timeSlot: TimeSlot;
  notes?: string;
}) {
  const res = {
    data: null as Appointment | null,
    error: null as string | null,
  };

  try {
    const { userId, barberId, serviceId, appointmentDate, timeSlot, notes } = appointmentData;

    // Validate required fields with specific messages
    if (!userId || !barberId || !serviceId || !appointmentDate || !timeSlot) {
      const missingFields = [];
      if (!userId) missingFields.push('usuario');
      if (!barberId) missingFields.push('barbero');
      if (!serviceId) missingFields.push('servicio');
      if (!appointmentDate) missingFields.push('fecha');
      if (!timeSlot) missingFields.push('hora');
      
      res.error = `Campos requeridos faltantes: ${missingFields.join(', ')}`;
      return res;
    }

    // Convert dd/mm/yyyy to Date object for appointment creation
    const targetDate = parseDate(appointmentDate);
    if (!targetDate) {
      res.error = 'Formato de fecha inválido. Se espera dd/mm/yyyy';
      return res;
    }

    // Check if the time slot is available
    const isAvailable = await isTimeSlotAvailable(barberId, appointmentDate, timeSlot);

    if (!isAvailable) {
      res.error = 'El horario seleccionado no está disponible. Por favor, selecciona otro horario.';
      return res;
    }

    const db = await getDatabase();

    // Validate user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      res.error = 'Usuario no encontrado. Por favor, verifica tu sesión e intenta nuevamente.';
      return res;
    }

    // Validate barber exists
    const barber = await db.select().from(users).where(eq(users.id, barberId)).limit(1);
    if (barber.length === 0) {
      res.error = 'Barbero no encontrado. Por favor, selecciona otro barbero.';
      return res;
    }

    // Validate service exists
    const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
    if (service.length === 0) {
      res.error = 'Servicio no encontrado. Por favor, selecciona otro servicio.';
      return res;
    }

    // Create the appointment
    const newAppointment = await db.insert(appointments).values({
      userId,
      barberId,
      serviceId,
      appointmentDate: targetDate,
      timeSlot,
      status: 'pending',
      notes
    }).returning();

    if (!newAppointment[0]) {
      res.error = 'Error al crear la cita. Por favor, intenta nuevamente.';
      return res;
    }
    
    res.data = newAppointment[0] as any;
    return res;
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.error = 'Error interno del servidor. Por favor, intenta nuevamente más tarde.';
    return res;
  }
}

// Get appointments by status
export async function getAppointmentsByStatus(status: string) {
  const res = {
    data: null as any[] | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();

    let appointmentsList;
    
    if (status === 'all') {
      appointmentsList = await db
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
          barberName: users.firstName,
          barberLastName: users.lastName,
          serviceName: services.name,
          servicePrice: services.price
        })
        .from(appointments)
        .leftJoin(users, eq(appointments.userId, users.id))
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .orderBy(appointments.appointmentDate);
    } else {
      appointmentsList = await db
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
          barberName: users.firstName,
          barberLastName: users.lastName,
          serviceName: services.name,
          servicePrice: services.price
        })
        .from(appointments)
        .leftJoin(users, eq(appointments.userId, users.id))
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(eq(appointments.status, status))
        .orderBy(appointments.appointmentDate);
    }

    res.data = appointmentsList;
    return res;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Update appointment status
export async function updateAppointmentStatus(id: string, status: Status) {
  const res = {
    data: null as Appointment | null,
    error: null as string | null,
  };

  try {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      res.error = 'Invalid status';
      return res;
    }

    const db = await getDatabase();

    // If status is 'completed', reset rescheduleCount to 0
    let updateFields: any = {
      status,
      updatedAt: new Date()
    };
    if (status === 'completed') {
      updateFields.rescheduleCount = 0;
    }

    const updatedAppointment = await db
      .update(appointments)
      .set(updateFields)
      .where(eq(appointments.id, id))
      .returning();

    if (updatedAppointment.length === 0 || !updatedAppointment[0]) {
      res.error = 'Appointment not found';
      return res;
    }

    // Send WhatsApp confirmation if status is 'confirmed'
    if (status === 'confirmed') {
      try {
        const notificationResult = await sendAppointmentConfirmation(id);
        if (!notificationResult.success) {
          console.warn('Failed to send WhatsApp confirmation:', notificationResult.error);
        }
      } catch (error) {
        console.error('Error sending WhatsApp confirmation:', error);
        // Don't fail the appointment update if notification fails
      }
    }

    res.data = updatedAppointment[0] ? updatedAppointment[0] as any : null;
    return res;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get appointments for a specific user
export async function getUserAppointments(userId: string) {
  const res = {
    data: null as any[] | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();

    const userAppointments = await db
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
      .where(eq(appointments.userId, userId))
      .orderBy(appointments.appointmentDate);

    res.data = userAppointments;
    return res;
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get appointments for a specific barber
export async function getBarberAppointments(barberId: string) {
  const res = {
    data: null as any[] | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();

    const barberAppointments = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        serviceId: appointments.serviceId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        customerName: users.firstName,
        customerLastName: users.lastName,
        serviceName: services.name,
        servicePrice: services.price
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.barberId, barberId))
      .orderBy(appointments.appointmentDate);

    res.data = barberAppointments;
    return res;
  } catch (error) {
    console.error('Error fetching barber appointments:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Delete appointment
export async function deleteAppointment(id: string) {
  const res = {
    data: null as Appointment | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();
    
    // Check if appointment exists
    const existingAppointment = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    if (existingAppointment.length === 0) {
      res.error = 'Appointment not found';
      return res;
    }

    await db.delete(appointments).where(eq(appointments.id, id));
    
    res.data = existingAppointment[0] ? existingAppointment[0] as any : null; // Return the deleted appointment data
    return res;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Reschedule appointment
export async function rescheduleAppointment(id: string, newDate: string, newTimeSlot: TimeSlot) {
  const res = {
    data: null as Appointment | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();
    
    // Check if appointment exists
    const existingAppointment = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    if (existingAppointment.length === 0) {
      res.error = 'Appointment not found';
      return res;
    }

    // Check reschedule limit (max 1 time)
    if (existingAppointment[0] && existingAppointment[0].rescheduleCount >= 1) {
      res.error = 'Maximum reschedule limit reached (1 time)';
      return res;
    }

    // Parse new date
    const targetDate = parseDate(newDate);
    if (!targetDate) {
      res.error = 'Invalid date format. Expected dd/mm/yyyy';
      return res;
    }

    // Normalize time slot to 'HH:00' format
    let normalizedTimeSlot = newTimeSlot;
    if (/^\d{1,2}$/.test(newTimeSlot)) {
      normalizedTimeSlot = (`${newTimeSlot.padStart(2, '0')}:00`) as TimeSlot;
    }

    // Check if the new time slot is available
    const isAvailable = await isTimeSlotAvailable(
      existingAppointment[0]?.barberId || '',
      newDate,
      normalizedTimeSlot,
      existingAppointment[0]?.id
    );
    if (!isAvailable) {
      res.error = 'New time slot is not available';
      return res;
    }

    // Update appointment
    const updatedAppointment = await db
      .update(appointments)
      .set({
        appointmentDate: targetDate,
        timeSlot: normalizedTimeSlot as TimeSlot,
        rescheduleCount: (existingAppointment[0]?.rescheduleCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, id))
      .returning();

    if (!updatedAppointment[0]) {
      res.error = 'Failed to reschedule appointment';
      return res;
    }

    res.data = updatedAppointment[0] ? updatedAppointment[0] as any : null;
    return res;
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.error = 'Internal server error';
    return res;
  }
}
