import type { Context } from 'hono';
import { getDatabase } from "../db/connection.js";
import { schedules, appointments, users } from "../db/schema.js";
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import type { 
  Schedule, 
  CreateScheduleRequest, 
  UpdateScheduleRequest, 
  ScheduleAvailability,
  GetAvailabilityRequest,
  TimeSlot,
  DayOfWeek
} from './schedules.d.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

// Helper function to get day of week from date
function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()] || 'monday'; // fallback to monday if undefined
}

// Create or update a schedule for a barber
export async function setBarberSchedule(barberId: string, dayOfWeek: DayOfWeek, availableTimeSlots: TimeSlot[]) {
  const res = {
    data: null as Schedule | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();

    // Validate barber exists and is staff
    const barber = await db.select().from(users).where(eq(users.id, barberId)).limit(1);
    if (barber.length === 0) {
      res.error = 'Barber not found';
      return res;
    }

    if (barber[0]?.role !== 'staff') {
      res.error = 'User is not a barber';
      return res;
    }

    // Check if schedule already exists for this barber and day
    const existingSchedule = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.barberId, barberId), eq(schedules.dayOfWeek, dayOfWeek)))
      .limit(1);

    let result;
    if (existingSchedule.length > 0 && existingSchedule[0]?.id) {
      // Update existing schedule
      result = await db
        .update(schedules)
        .set({
          availableTimeSlots,
          updatedAt: new Date()
        })
        .where(eq(schedules.id, existingSchedule[0].id))
        .returning();
    } else {
      // Create new schedule
      result = await db.insert(schedules).values({
        barberId,
        dayOfWeek,
        availableTimeSlots,
        isActive: true
      }).returning();
    }

    if (!result[0]) {
      res.error = 'Failed to set schedule';
      return res;
    }
    
    res.data = result[0] as Schedule;
    return res;
  } catch (error) {
    console.error('Error setting barber schedule:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get all schedules for a barber
export async function getBarberSchedules(barberId: string) {
  const res = {
    data: null as Schedule[] | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();

    const barberSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.barberId, barberId))
      .orderBy(schedules.dayOfWeek);

    res.data = barberSchedules as Schedule[];
    return res;
  } catch (error) {
    console.error('Error fetching barber schedules:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get availability for a specific date
export async function getAvailability(barberId: string, date: string) {
  const res = {
    data: null as ScheduleAvailability | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();

    // Convert dd/mm/yyyy to Date object
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
      res.error = 'Invalid date format. Expected dd/mm/yyyy';
      return res;
    }
    
    const [day, month, year] = dateParts;
    if (!day || !month || !year) {
      res.error = 'Invalid date format. Expected dd/mm/yyyy';
      return res;
    }
    
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = getDayOfWeek(targetDate);

    // Get the barber's schedule for that day
    const schedule = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.barberId, barberId), eq(schedules.dayOfWeek, dayOfWeek)))
      .limit(1);

    if (schedule.length === 0) {
      const availability: ScheduleAvailability = {
        barberId,
        dayOfWeek,
        date,
        availableSlots: [],
        bookedSlots: []
      };
      res.data = availability;
      return res;
    }

    // Get all appointments for that barber on that date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsList = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.barberId, barberId),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      );

    // Get booked time slots
    const bookedSlots = appointmentsList
      .filter(apt => apt.status !== 'cancelled')
      .map(apt => apt.timeSlot as TimeSlot);

    // Calculate available slots
    const availableSlots = (schedule[0]?.availableTimeSlots || []).filter(
      slot => !bookedSlots.includes(slot as TimeSlot)
    ) as TimeSlot[];

    const availability: ScheduleAvailability = {
      barberId,
      dayOfWeek,
      date,
      availableSlots,
      bookedSlots
    };

    res.data = availability;
    return res;
  } catch (error) {
    console.error('Error getting availability:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get all schedules
export async function getAllSchedules() {
  const res = {
    data: null as Schedule[] | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();
    
    const allSchedules = await db
      .select()
      .from(schedules)
      .orderBy(schedules.barberId, schedules.dayOfWeek);

    res.data = allSchedules as Schedule[];
    return res;
  } catch (error) {
    console.error('Error fetching all schedules:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Check if a time slot is available for booking
export async function isTimeSlotAvailable(barberId: string, date: string, timeSlot: TimeSlot): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    // Convert dd/mm/yyyy to Date object
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
      return false;
    }
    
    const [day, month, year] = dateParts;
    if (!day || !month || !year) {
      return false;
    }
    
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = getDayOfWeek(targetDate);

    // Get the barber's schedule for that day
    const schedule = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.barberId, barberId), eq(schedules.dayOfWeek, dayOfWeek)))
      .limit(1);

    if (schedule.length === 0) {
      return false; // No schedule for this day
    }

    // Check if the time slot is in the available slots
    const availableSlots = schedule[0]?.availableTimeSlots || [];
    if (!availableSlots.includes(timeSlot)) {
      return false; // Time slot not available in schedule
    }

    // Check if the time slot is already booked
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.barberId, barberId),
          eq(appointments.timeSlot, timeSlot),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay),
          sql`${appointments.status} != 'cancelled'`
        )
      )
      .limit(1);

    return existingAppointment.length === 0; // Available if no existing appointment
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return false;
  }
}

// Update a schedule
export async function updateSchedule(scheduleId: string, updateData: Partial<Schedule>) {
  const res = {
    data: null as Schedule | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();
    
    // Check if schedule exists
    const existingSchedule = await db.select().from(schedules).where(eq(schedules.id, scheduleId)).limit(1);
    if (existingSchedule.length === 0) {
      res.error = 'Schedule not found';
      return res;
    }

    const [updatedSchedule] = await db
      .update(schedules)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(schedules.id, scheduleId))
      .returning();

    if (!updatedSchedule) {
      res.error = 'Failed to update schedule';
      return res;
    }

    res.data = updatedSchedule as Schedule;
    return res;
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Delete a schedule
export async function deleteSchedule(scheduleId: string) {
  const res = {
    data: null as Schedule | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();
    
    // Check if schedule exists
    const existingSchedule = await db.select().from(schedules).where(eq(schedules.id, scheduleId)).limit(1);
    if (existingSchedule.length === 0) {
      res.error = 'Schedule not found';
      return res;
    }

    await db.delete(schedules).where(eq(schedules.id, scheduleId));
    
    res.data = existingSchedule[0] as Schedule; // Return the deleted schedule data
    return res;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.error = 'Internal server error';
    return res;
  }
} 