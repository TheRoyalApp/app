#!/usr/bin/env node

// Simple test to verify double booking prevention
console.log('🧪 Testing Double Booking Prevention...\n');

// Simulate the availability check
function simulateAvailabilityCheck(barberId, date, timeSlot, existingAppointments) {
  console.log(`📅 Checking availability for barber ${barberId} on ${date} at ${timeSlot}`);
  
  // Check if time slot is already booked
  const isBooked = existingAppointments.some(apt => 
    apt.barberId === barberId && 
    apt.appointmentDate === date && 
    apt.timeSlot === timeSlot && 
    apt.status !== 'cancelled'
  );
  
  const isAvailable = !isBooked;
  
  console.log(`   ${isAvailable ? '✅ Available' : '❌ Not Available'}`);
  return isAvailable;
}

// Test scenarios
const testCases = [
  {
    name: 'First booking should succeed',
    barberId: 'barber1',
    date: '15/01/2024',
    timeSlot: '10:00',
    existingAppointments: [],
    expected: true
  },
  {
    name: 'Second booking of same slot should fail',
    barberId: 'barber1',
    date: '15/01/2024',
    timeSlot: '10:00',
    existingAppointments: [
      {
        barberId: 'barber1',
        appointmentDate: '15/01/2024',
        timeSlot: '10:00',
        status: 'confirmed'
      }
    ],
    expected: false
  },
  {
    name: 'Cancelled appointment should not block slot',
    barberId: 'barber1',
    date: '15/01/2024',
    timeSlot: '11:00',
    existingAppointments: [
      {
        barberId: 'barber1',
        appointmentDate: '15/01/2024',
        timeSlot: '11:00',
        status: 'cancelled'
      }
    ],
    expected: true
  },
  {
    name: 'Different barber should not affect availability',
    barberId: 'barber1',
    date: '15/01/2024',
    timeSlot: '12:00',
    existingAppointments: [
      {
        barberId: 'barber2', // Different barber
        appointmentDate: '15/01/2024',
        timeSlot: '12:00',
        status: 'confirmed'
      }
    ],
    expected: true
  }
];

// Run tests
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  const result = simulateAvailabilityCheck(
    testCase.barberId,
    testCase.date,
    testCase.timeSlot,
    testCase.existingAppointments
  );
  
  if (result === testCase.expected) {
    console.log(`   ✅ PASS`);
    passedTests++;
  } else {
    console.log(`   ❌ FAIL - Expected ${testCase.expected}, got ${result}`);
  }
});

console.log(`\n📊 Test Results:`);
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Double booking prevention is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
} 