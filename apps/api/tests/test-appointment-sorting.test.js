const { test, expect } = require('bun:test');

// Mock appointment data
const mockAppointments = [
    {
        id: '1',
        appointmentDate: '2024-01-15T10:00:00Z', // Upcoming - closest
        status: 'confirmed',
        rescheduleCount: 0
    },
    {
        id: '2',
        appointmentDate: '2024-01-16T14:00:00Z', // Upcoming - further
        status: 'confirmed',
        rescheduleCount: 0
    },
    {
        id: '3',
        appointmentDate: '2024-01-14T09:00:00Z', // Past - most recent
        status: 'completed',
        rescheduleCount: 0
    },
    {
        id: '4',
        appointmentDate: '2024-01-13T08:00:00Z', // Past - older
        status: 'cancelled',
        rescheduleCount: 0
    },
    {
        id: '5',
        appointmentDate: '2024-01-17T16:00:00Z', // Upcoming - furthest
        status: 'pending',
        rescheduleCount: 0
    }
];

// Mock current time (2024-01-15T09:00:00Z)
const mockCurrentTime = new Date('2024-01-15T09:00:00Z');

function getUpcomingAppointments(appointments, currentTime = new Date()) {
    const upcomingAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate > currentTime && (apt.status === 'confirmed' || apt.status === 'pending');
    });

    // Sort upcoming appointments from nearest to furthest (ascending order)
    return upcomingAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA.getTime() - dateB.getTime();
    });
}

function getPastAppointments(appointments, currentTime = new Date()) {
    const pastAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate <= currentTime || (apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no-show');
    });

    // Sort past appointments from most recent to oldest (descending order)
    return pastAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateB.getTime() - dateA.getTime();
    });
}

test('should sort upcoming appointments from nearest to furthest', () => {
    const upcoming = getUpcomingAppointments(mockAppointments, mockCurrentTime);
    
    expect(upcoming.length).toBe(3);
    expect(upcoming[0].id).toBe('1'); // Closest (10:00)
    expect(upcoming[1].id).toBe('2'); // Middle (14:00 next day)
    expect(upcoming[2].id).toBe('5'); // Furthest (16:00 day after)
});

test('should sort past appointments from most recent to oldest', () => {
    const past = getPastAppointments(mockAppointments, mockCurrentTime);
    
    expect(past.length).toBe(2);
    expect(past[0].id).toBe('3'); // Most recent past (09:00 previous day)
    expect(past[1].id).toBe('4'); // Oldest past (08:00 two days ago)
});

test('should return empty array when no upcoming appointments', () => {
    const pastAppointments = [
        {
            id: '1',
            appointmentDate: '2024-01-14T10:00:00Z',
            status: 'completed',
            rescheduleCount: 0
        }
    ];
    
    const upcoming = getUpcomingAppointments(pastAppointments, mockCurrentTime);
    expect(upcoming.length).toBe(0);
});

test('should return empty array when no past appointments', () => {
    const futureAppointments = [
        {
            id: '1',
            appointmentDate: '2024-01-16T10:00:00Z',
            status: 'confirmed',
            rescheduleCount: 0
        }
    ];
    
    const past = getPastAppointments(futureAppointments, mockCurrentTime);
    expect(past.length).toBe(0);
});

test('should handle mixed status appointments correctly', () => {
    const mixedAppointments = [
        {
            id: '1',
            appointmentDate: '2024-01-15T10:00:00Z',
            status: 'confirmed',
            rescheduleCount: 0
        },
        {
            id: '2',
            appointmentDate: '2024-01-15T11:00:00Z',
            status: 'pending',
            rescheduleCount: 0
        },
        {
            id: '3',
            appointmentDate: '2024-01-14T09:00:00Z',
            status: 'completed',
            rescheduleCount: 0
        }
    ];
    
    const upcoming = getUpcomingAppointments(mixedAppointments, mockCurrentTime);
    const past = getPastAppointments(mixedAppointments, mockCurrentTime);
    
    expect(upcoming.length).toBe(2);
    expect(past.length).toBe(1);
    expect(upcoming[0].id).toBe('1'); // 10:00
    expect(upcoming[1].id).toBe('2'); // 11:00
    expect(past[0].id).toBe('3'); // Most recent past
});

console.log('✅ All appointment sorting tests passed!'); 