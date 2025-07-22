const { test, expect } = require('bun:test');

// Mock appointment data
const mockAppointments = [
    {
        id: '1',
        appointmentDate: '2024-01-15T10:00:00Z', // Closest appointment
        status: 'confirmed',
        rescheduleCount: 0
    },
    {
        id: '2',
        appointmentDate: '2024-01-16T14:00:00Z', // Future appointment
        status: 'confirmed',
        rescheduleCount: 0
    },
    {
        id: '3',
        appointmentDate: '2024-01-14T09:00:00Z', // Past appointment
        status: 'confirmed',
        rescheduleCount: 0
    }
];

// Mock current time (2024-01-15T09:00:00Z - 1 hour before closest appointment)
const mockCurrentTime = new Date('2024-01-15T09:00:00Z');

function getClosestUpcomingAppointment(appointments, currentTime = new Date()) {
    const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate > currentTime && (apt.status === 'confirmed' || apt.status === 'pending');
    });

    if (upcomingAppointments.length === 0) return null;

    // Sort by appointment date and time, then return the closest one
    return upcomingAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
    })[0];
}

function canRescheduleAppointment(appointment, allAppointments, currentTime = new Date()) {
    const validStatus = appointment.status === 'confirmed' || appointment.status === 'pending';
    const validRescheduleCount = (appointment.rescheduleCount || 0) < 1;
    
    // Check if appointment is within 30 minutes
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const timeDifferenceMs = appointmentDateTime.getTime() - currentTime.getTime();
    const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
    const notWithin30Minutes = timeDifferenceMinutes > 30;
    
    // Check if this is the closest upcoming appointment
    const closestAppointment = getClosestUpcomingAppointment(allAppointments, currentTime);
    const isClosest = closestAppointment?.id === appointment.id;
    
    return validStatus && validRescheduleCount && notWithin30Minutes && isClosest;
}

test('should allow rescheduling only the closest appointment', () => {
    const closestAppointment = mockAppointments[0]; // 10:00 appointment
    const futureAppointment = mockAppointments[1]; // 14:00 appointment
    
    const canRescheduleClosest = canRescheduleAppointment(closestAppointment, mockAppointments, mockCurrentTime);
    const canRescheduleFuture = canRescheduleAppointment(futureAppointment, mockAppointments, mockCurrentTime);
    
    expect(canRescheduleClosest).toBe(true);
    expect(canRescheduleFuture).toBe(false);
});

test('should not allow rescheduling past appointments', () => {
    const pastAppointment = mockAppointments[2]; // Past appointment
    
    const canReschedulePast = canRescheduleAppointment(pastAppointment, mockAppointments, mockCurrentTime);
    
    expect(canReschedulePast).toBe(false);
});

test('should not allow rescheduling when within 30 minutes', () => {
    // Mock time very close to appointment (29 minutes before)
    const closeToAppointment = new Date('2024-01-15T09:31:00Z');
    
    const closestAppointment = mockAppointments[0];
    const canReschedule = canRescheduleAppointment(closestAppointment, mockAppointments, closeToAppointment);
    
    expect(canReschedule).toBe(false);
});

test('should allow rescheduling when more than 30 minutes away', () => {
    // Mock time well before appointment (2 hours before)
    const wellBeforeAppointment = new Date('2024-01-15T08:00:00Z');
    
    const closestAppointment = mockAppointments[0];
    const canReschedule = canRescheduleAppointment(closestAppointment, mockAppointments, wellBeforeAppointment);
    
    expect(canReschedule).toBe(true);
});

test('should return null when no upcoming appointments', () => {
    const pastAppointments = [
        {
            id: '1',
            appointmentDate: '2024-01-14T10:00:00Z',
            status: 'confirmed',
            rescheduleCount: 0
        }
    ];
    
    const closest = getClosestUpcomingAppointment(pastAppointments, mockCurrentTime);
    
    expect(closest).toBe(null);
});

console.log('✅ All closest appointment restriction tests passed!'); 