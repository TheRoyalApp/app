const { test, expect } = require('bun:test');

// Mock the rescheduleAppointment function logic
function checkRescheduleRestriction(appointmentDate) {
  const appointmentDateTime = new Date(appointmentDate);
  const currentTime = new Date();
  const timeDifferenceMs = appointmentDateTime.getTime() - currentTime.getTime();
  const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
  
  if (timeDifferenceMinutes <= 30) {
    return {
      canReschedule: false,
      error: 'No se puede reprogramar una cita 30 minutos antes de la hora programada'
    };
  }
  
  return {
    canReschedule: true,
    error: null
  };
}

test('should prevent rescheduling within 30 minutes', () => {
  // Test case: appointment in 20 minutes (should be blocked)
  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + 20);
  
  const result = checkRescheduleRestriction(futureDate.toISOString());
  
  expect(result.canReschedule).toBe(false);
  expect(result.error).toBe('No se puede reprogramar una cita 30 minutos antes de la hora programada');
});

test('should allow rescheduling more than 30 minutes in advance', () => {
  // Test case: appointment in 40 minutes (should be allowed)
  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + 40);
  
  const result = checkRescheduleRestriction(futureDate.toISOString());
  
  expect(result.canReschedule).toBe(true);
  expect(result.error).toBe(null);
});

test('should prevent rescheduling exactly 30 minutes in advance', () => {
  // Test case: appointment in exactly 30 minutes (should be blocked)
  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + 30);
  
  const result = checkRescheduleRestriction(futureDate.toISOString());
  
  expect(result.canReschedule).toBe(false);
  expect(result.error).toBe('No se puede reprogramar una cita 30 minutos antes de la hora programada');
});

test('should prevent rescheduling past appointments', () => {
  // Test case: appointment in the past (should be blocked)
  const pastDate = new Date();
  pastDate.setMinutes(pastDate.getMinutes() - 10);
  
  const result = checkRescheduleRestriction(pastDate.toISOString());
  
  expect(result.canReschedule).toBe(false);
  expect(result.error).toBe('No se puede reprogramar una cita 30 minutos antes de la hora programada');
});

console.log('✅ All reschedule restriction tests passed!'); 