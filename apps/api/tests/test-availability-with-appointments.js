#!/usr/bin/env node

/**
 * Comprehensive test script to verify the availability fix with test appointments
 * This script creates test appointments and verifies they are properly excluded from available slots
 */

import { getDatabase } from './src/db/connection.js';
import { appointments, users, services, schedules } from './src/db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getAvailability } from './src/schedules/schedules.controller.js';

async function testAvailabilityWithAppointments() {
  try {
    console.log('🧪 Testing availability fix with test appointments...\n');

    const db = await getDatabase();

    // Get a test barber
    const testBarber = await db.select().from(users).where(eq(users.role, 'staff')).limit(1);
    if (testBarber.length === 0) {
      console.log('❌ No barber found for testing');
      return;
    }

    const barberId = testBarber[0].id;
    console.log(`👨‍💼 Using barber: ${testBarber[0].firstName} ${testBarber[0].lastName} (${barberId})`);

    // Get a test service
    const testService = await db.select().from(services).limit(1);
    if (testService.length === 0) {
      console.log('❌ No service found for testing');
      return;
    }

    const serviceId = testService[0].id;
    console.log(`💇‍♂️ Using service: ${testService[0].name} (${serviceId})`);

    // Get a test customer
    const testCustomer = await db.select().from(users).where(eq(users.role, 'customer')).limit(1);
    if (testCustomer.length === 0) {
      console.log('⚠️  No customer found, using first staff user as customer for testing...');
      const testCustomer = await db.select().from(users).limit(1);
      if (testCustomer.length === 0) {
        console.log('❌ No users found for testing');
        return;
      }
    }

    const customerId = testCustomer[0].id;
    console.log(`👤 Using customer: ${testCustomer[0].firstName} ${testCustomer[0].lastName} (${customerId})`);

    // Get tomorrow's date in dd/mm/yyyy format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.getDate().toString().padStart(2, '0');
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const year = tomorrow.getFullYear();
    const testDate = `${day}/${month}/${year}`;

    console.log(`📅 Testing date: ${testDate}`);

    // Create a test schedule for the barber
    const dayOfWeek = getDayOfWeek(tomorrow);
    console.log(`📅 Day of week: ${dayOfWeek}`);

    // Check if schedule exists, if not create one
    const existingSchedule = await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.barberId, barberId), eq(schedules.dayOfWeek, dayOfWeek)))
      .limit(1);

    if (existingSchedule.length === 0) {
      console.log(`📅 Creating schedule for ${dayOfWeek}...`);
      await db.insert(schedules).values({
        barberId,
        dayOfWeek,
        availableTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
        isActive: true
      });
      console.log(`✅ Schedule created for ${dayOfWeek}`);
    } else {
      console.log(`✅ Schedule already exists for ${dayOfWeek}`);
    }

    // Clean up any existing test appointments for tomorrow
    const startOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const endOfDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999);

    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.barberId, barberId),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      );

    if (existingAppointments.length > 0) {
      console.log(`🗑️  Cleaning up ${existingAppointments.length} existing appointments...`);
      for (const apt of existingAppointments) {
        await db.delete(appointments).where(eq(appointments.id, apt.id));
      }
      console.log(`✅ Cleaned up existing appointments`);
    }

    // Create test appointments
    console.log(`\n📝 Creating test appointments...`);
    
    const testAppointments = [
      { timeSlot: '10:00', status: 'confirmed' },
      { timeSlot: '12:00', status: 'pending' },
      { timeSlot: '14:00', status: 'completed' },
      { timeSlot: '16:00', status: 'cancelled' } // This should NOT block the slot
    ];

    for (const apt of testAppointments) {
      await db.insert(appointments).values({
        userId: customerId,
        barberId,
        serviceId,
        appointmentDate: startOfDay,
        timeSlot: apt.timeSlot,
        status: apt.status,
        notes: `Test appointment - ${apt.status}`
      });
      console.log(`   ✅ Created ${apt.timeSlot} (${apt.status})`);
    }

    // Test the getAvailability function
    console.log(`\n🔍 Testing getAvailability for ${testDate}...`);
    const availabilityResult = await getAvailability(barberId, testDate);

    if (availabilityResult.error) {
      console.log(`❌ Error: ${availabilityResult.error}`);
      return;
    }

    if (!availabilityResult.data) {
      console.log('❌ No availability data returned');
      return;
    }

    const { availableSlots, bookedSlots } = availabilityResult.data;

    console.log(`\n✅ Availability results:`);
    console.log(`   Available slots: ${availableSlots.length}`);
    availableSlots.forEach(slot => console.log(`     - ${slot}`));

    console.log(`\n   Booked slots: ${bookedSlots.length}`);
    bookedSlots.forEach(slot => console.log(`     - ${slot}`));

    // Verify that booked slots are not in available slots
    const conflictingSlots = availableSlots.filter(slot => bookedSlots.includes(slot));
    if (conflictingSlots.length > 0) {
      console.log(`\n❌ ERROR: Found conflicting slots that are both available and booked:`);
      conflictingSlots.forEach(slot => console.log(`   - ${slot}`));
    } else {
      console.log(`\n✅ SUCCESS: No conflicting slots found. All booked slots are properly excluded from available slots.`);
    }

    // Test specific time slots
    console.log(`\n🧪 Testing specific time slots...`);
    const expectedBooked = ['10:00', '12:00', '14:00']; // confirmed, pending, completed
    const expectedAvailable = ['09:00', '11:00', '13:00', '15:00', '16:00']; // not booked
    const expectedCancelled = ['16:00']; // cancelled should be available
    
    for (const slot of ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']) {
      const isBooked = bookedSlots.includes(slot);
      const isAvailable = availableSlots.includes(slot);
      
      if (isBooked && isAvailable) {
        console.log(`❌ ${slot}: CONFLICT - Both booked and available`);
      } else if (isBooked) {
        console.log(`✅ ${slot}: Correctly marked as booked`);
      } else if (isAvailable) {
        console.log(`✅ ${slot}: Correctly marked as available`);
      } else {
        console.log(`ℹ️  ${slot}: Not in schedule`);
      }
    }

    // Verify expected results
    console.log(`\n🔍 Verifying expected results...`);
    
    const unexpectedBooked = expectedBooked.filter(slot => !bookedSlots.includes(slot));
    const unexpectedAvailable = expectedAvailable.filter(slot => !availableSlots.includes(slot));
    
    if (unexpectedBooked.length > 0) {
      console.log(`❌ ERROR: Expected booked slots not found: ${unexpectedBooked.join(', ')}`);
    }
    
    if (unexpectedAvailable.length > 0) {
      console.log(`❌ ERROR: Expected available slots not found: ${unexpectedAvailable.join(', ')}`);
    }
    
    if (unexpectedBooked.length === 0 && unexpectedAvailable.length === 0) {
      console.log(`✅ SUCCESS: All expected results match!`);
    }

    // Clean up test appointments
    console.log(`\n🗑️  Cleaning up test appointments...`);
    const testAppointmentsToDelete = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.barberId, barberId),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      );

    for (const apt of testAppointmentsToDelete) {
      await db.delete(appointments).where(eq(appointments.id, apt.id));
    }
    console.log(`✅ Cleaned up ${testAppointmentsToDelete.length} test appointments`);

    console.log(`\n🎉 Test completed successfully!`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to get day of week
function getDayOfWeek(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Run the test
testAvailabilityWithAppointments().then(() => {
  console.log('\n🏁 Test script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
}); 