import { apiClient, ApiResponse } from './api';

// Types
export interface TimeSlot {
  id: string;
  time: string; // Format: "HH:MM"
  isAvailable: boolean;
  isBooked: boolean;
}

export interface BarberSchedule {
  id: string;
  barberId: string;
  dayOfWeek: string; // 'sunday', 'monday', etc.
  availableTimeSlots: string[]; // Array of time strings
  createdAt: string;
  updatedAt: string;
  barber?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AvailabilityResponse {
  barberId: string;
  date: string;
  availableSlots: TimeSlot[];
  barber?: {
    id: string;
    name: string;
    email: string;
  };
}

// Backend response format (different from frontend)
export interface BackendAvailabilityResponse {
  barberId: string;
  dayOfWeek: string;
  date: string;
  availableSlots: string[];
  bookedSlots: string[];
}

export interface SetScheduleData {
  barberId: string;
  dayOfWeek: string;
  availableTimeSlots: string[];
}

// Schedules Service
export class SchedulesService {
  // Get availability for a specific barber and date
  static async getAvailability(barberId: string, date: string): Promise<ApiResponse<AvailabilityResponse>> {
    try {
      // Convert date from yyyy-mm-dd to dd/mm/yyyy format for backend
      console.log('Original date received:', date);
      
      // Parse the date string manually to avoid timezone issues
      const [year, month, day] = date.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const formattedDate = `${day}/${month}/${year}`;
      
      console.log('Formatted date for API:', formattedDate);
      
      const response = await apiClient.post<BackendAvailabilityResponse>('/schedules/availability', {
        barberId,
        date: formattedDate,
      });

      if (response.success && response.data) {
        // Transform backend response to frontend format
        const transformedResponse: AvailabilityResponse = {
          barberId: response.data.barberId,
          date: date, // Keep original format for frontend
          availableSlots: response.data.availableSlots.map((timeSlot, index) => ({
            id: `${barberId}-${date}-${timeSlot}`,
            time: timeSlot,
            isAvailable: true,
            isBooked: false,
          })),
        };

        return {
          success: true,
          data: transformedResponse,
        };
      }

             return {
         success: false,
         error: response.error || 'Failed to fetch availability',
       };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch availability',
      };
    }
  }

  // Get all schedules for a specific barber
  static async getBarberSchedules(barberId: string): Promise<ApiResponse<BarberSchedule[]>> {
    try {
      return await apiClient.get<BarberSchedule[]>(`/schedules/barber/${barberId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch barber schedules',
      };
    }
  }

  // Get all schedules (admin/staff only)
  static async getAllSchedules(): Promise<ApiResponse<BarberSchedule[]>> {
    try {
      return await apiClient.get<BarberSchedule[]>('/schedules');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch all schedules',
      };
    }
  }

  // Set barber schedule (admin/staff only)
  static async setBarberSchedule(data: SetScheduleData): Promise<ApiResponse<BarberSchedule>> {
    try {
      return await apiClient.post<BarberSchedule>('/schedules/set-schedule', data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set barber schedule',
      };
    }
  }

  // Update schedule (admin/staff only)
  static async updateSchedule(id: string, data: Partial<SetScheduleData>): Promise<ApiResponse<BarberSchedule>> {
    try {
      return await apiClient.put<BarberSchedule>(`/schedules/${id}`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update schedule',
      };
    }
  }

  // Delete schedule (admin/staff only)
  static async deleteSchedule(id: string): Promise<ApiResponse<void>> {
    try {
      return await apiClient.delete<void>(`/schedules/${id}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete schedule',
      };
    }
  }

  // Get available time slots for multiple barbers on a specific date
  static async getMultipleBarbersAvailability(barberIds: string[], date: string): Promise<ApiResponse<AvailabilityResponse[]>> {
    try {
      const promises = barberIds.map(barberId => this.getAvailability(barberId, date));
      const results = await Promise.all(promises);
      
      const successfulResults = results.filter(result => result.success && result.data);
      
      return {
        success: true,
        data: successfulResults.map(result => result.data!),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch multiple barbers availability',
      };
    }
  }

  // Get availability for a date range
  static async getAvailabilityForDateRange(
    barberId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ApiResponse<AvailabilityResponse[]>> {
    try {
      const promises = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        promises.push(this.getAvailability(barberId, dateString));
      }
      
      const results = await Promise.all(promises);
      const successfulResults = results.filter(result => result.success && result.data);
      
      return {
        success: true,
        data: successfulResults.map(result => result.data!),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch availability for date range',
      };
    }
  }

  // Helper method to get day name from day number
  static getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  }

  // Helper method to get day number from date
  static getDayOfWeek(date: string): number {
    return new Date(date).getDay();
  }

  // Helper method to format time slots for display
  static formatTimeSlot(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
} 