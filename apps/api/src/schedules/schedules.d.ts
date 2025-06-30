export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type TimeSlot = '08:00' | '09:00' | '10:00' | '11:00' | '12:00' | '13:00' | '14:00' | '15:00' | '16:00' | '17:00' | '18:00' | '19:00' | '20:00' | '21:00' | '22:00';

export interface Schedule {
    id: string;
    barberId: string;
    dayOfWeek: DayOfWeek;
    availableTimeSlots: TimeSlot[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ScheduleAvailability {
    barberId: string;
    dayOfWeek: DayOfWeek;
    date: string; // dd/mm/yyyy format
    availableSlots: TimeSlot[];
    bookedSlots: TimeSlot[];
}

export interface CreateScheduleRequest {
    barberId: string;
    dayOfWeek: DayOfWeek;
    availableTimeSlots: TimeSlot[];
}

export interface UpdateScheduleRequest {
    availableTimeSlots?: TimeSlot[];
    isActive?: boolean;
}

export interface GetAvailabilityRequest {
    barberId: string;
    date: string; // dd/mm/yyyy format
}

export interface BookedSlot {
    timeSlot: TimeSlot;
    appointmentId: string;
    customerId: string;
}