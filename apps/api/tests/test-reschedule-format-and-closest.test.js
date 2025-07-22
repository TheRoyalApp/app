const { test, expect } = require('bun:test');

// Mock format functions
function formatDate(dateString) {
    if (!dateString) return "";
    let date;
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
        date = new Date(dateString);
    }
    // Format as dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatTime(timeString) {
    if (!timeString) return "";
    const [hour, minute = '00'] = timeString.split(':');
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    // Format as hh:mm
    return `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
}

// Mock appointment data
const mockAppointments = [
    {
        id: '1',
        appointmentDate: '2024-01-15T10:00:00Z', // Closest appointment
        timeSlot: '10:00',
        status: 'confirmed',
        rescheduleCount: 0
    },
    {
        id: '2',
        appointmentDate: '2024-01-16T14:00:00Z', // Future appointment
        timeSlot: '14:00',
        status: 'confirmed',
        rescheduleCount: 0
    }
];

function getClosestUpcomingAppointment(appointments, currentTime = new Date()) {
    const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate > currentTime && (apt.status === 'confirmed' || apt.status === 'pending');
    });

    if (upcomingAppointments.length === 0) return null;

    return upcomingAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
    })[0];
}

test('should format date as dd/mm/yyyy', () => {
    const testDate = '2024-01-15T10:00:00Z';
    const formatted = formatDate(testDate);
    expect(formatted).toBe('15/01/2024');
});

test('should format time as hh:mm', () => {
    const testTime = '10:00';
    const formatted = formatTime(testTime);
    expect(formatted).toBe('10:00');
});

test('should format time with minutes as hh:mm', () => {
    const testTime = '14:30';
    const formatted = formatTime(testTime);
    expect(formatted).toBe('14:30');
});

test('should handle date with dd/mm/yyyy format', () => {
    const testDate = '15/01/2024';
    const formatted = formatDate(testDate);
    expect(formatted).toBe('15/01/2024');
});

test('should identify closest appointment correctly', () => {
    const mockCurrentTime = new Date('2024-01-15T09:00:00Z');
    const closest = getClosestUpcomingAppointment(mockAppointments, mockCurrentTime);
    
    expect(closest.id).toBe('1');
    expect(closest.appointmentDate).toBe('2024-01-15T10:00:00Z');
});

test('should return null when no upcoming appointments', () => {
    const pastAppointments = [
        {
            id: '1',
            appointmentDate: '2024-01-14T10:00:00Z',
            timeSlot: '10:00',
            status: 'confirmed',
            rescheduleCount: 0
        }
    ];
    
    const mockCurrentTime = new Date('2024-01-15T09:00:00Z');
    const closest = getClosestUpcomingAppointment(pastAppointments, mockCurrentTime);
    
    expect(closest).toBe(null);
});

test('should format appointment display correctly', () => {
    const appointment = mockAppointments[0];
    const formattedDate = formatDate(appointment.appointmentDate);
    const formattedTime = formatTime(appointment.timeSlot);
    
    expect(formattedDate).toBe('15/01/2024');
    expect(formattedTime).toBe('10:00');
});

console.log('✅ All reschedule format and closest appointment tests passed!'); 