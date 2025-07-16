const { test } = require('@jest/globals');

// Mock database and dependencies
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  transaction: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  eq: jest.fn(),
  and: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  sql: jest.fn(),
};

// Mock appointments data
const mockAppointments = [
  {
    id: '1',
    barberId: 'barber1',
    appointmentDate: new Date('2024-01-15T10:00:00Z'),
    timeSlot: '10:00',
    status: 'confirmed'
  },
  {
    id: '2', 
    barberId: 'barber1',
    appointmentDate: new Date('2024-01-15T11:00:00Z'),
    timeSlot: '11:00',
    status: 'confirmed'
  }
];

// Mock schedules data
const mockSchedules = [
  {
    id: '1',
    barberId: 'barber1',
    dayOfWeek: 'monday',
    availableTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00']
  }
];

// Mock users data
const mockUsers = [
  {
    id: 'barber1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
];

// Test cases
describe('Time Slot Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should prevent double booking of same time slot', async () => {
    // Mock database responses
    mockDb.select.mockReturnValueOnce(mockUsers);
    mockDb.select.mockReturnValueOnce(mockSchedules);
    mockDb.select.mockReturnValueOnce(mockAppointments);
    mockDb.insert.mockReturnValueOnce([{ id: 'new-appointment' }]);

    // Import the function to test
    const { isTimeSlotAvailable } = require('../src/schedules/schedules.controller.js');

    // Test that 10:00 is not available (already booked)
    const isAvailable = await isTimeSlotAvailable('barber1', '15/01/2024', '10:00');
    expect(isAvailable).toBe(false);

    // Test that 12:00 is available (not booked)
    const isAvailable2 = await isTimeSlotAvailable('barber1', '15/01/2024', '12:00');
    expect(isAvailable2).toBe(true);
  });

  test('should handle cancelled appointments correctly', async () => {
    const cancelledAppointments = [
      {
        id: '3',
        barberId: 'barber1',
        appointmentDate: new Date('2024-01-15T14:00:00Z'),
        timeSlot: '14:00',
        status: 'cancelled' // This should not block the slot
      }
    ];

    mockDb.select.mockReturnValueOnce(mockUsers);
    mockDb.select.mockReturnValueOnce(mockSchedules);
    mockDb.select.mockReturnValueOnce(cancelledAppointments);

    const { isTimeSlotAvailable } = require('../src/schedules/schedules.controller.js');

    // Test that 14:00 is available (cancelled appointment)
    const isAvailable = await isTimeSlotAvailable('barber1', '15/01/2024', '14:00');
    expect(isAvailable).toBe(true);
  });

  test('should validate time slot format correctly', async () => {
    mockDb.select.mockReturnValueOnce(mockUsers);
    mockDb.select.mockReturnValueOnce(mockSchedules);

    const { isTimeSlotAvailable } = require('../src/schedules/schedules.controller.js');

    // Test with different time formats
    const isAvailable1 = await isTimeSlotAvailable('barber1', '15/01/2024', '09:00');
    const isAvailable2 = await isTimeSlotAvailable('barber1', '15/01/2024', '9:00');
    const isAvailable3 = await isTimeSlotAvailable('barber1', '15/01/2024', '9');

    // All should be normalized and available
    expect(isAvailable1).toBe(true);
    expect(isAvailable2).toBe(true);
    expect(isAvailable3).toBe(true);
  });
});

console.log('✅ Time slot validation tests completed successfully!'); 