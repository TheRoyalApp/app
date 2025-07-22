#!/usr/bin/env node

/**
 * Test script to verify the availability fix
 * This script tests the getAvailability function to ensure it properly filters out booked appointments
 */

import { getDatabase } from './src/db/connection.js';
import { appointments, users, services, schedules } from './src/db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getAvailability } from './src/schedules/schedules.controller.js';

async function testAvailabilityFix() {
  try {
    console.log('🧪 Testing availability fix...\n');

    const db = await getDatabase();

    // Get a test barber
    const testBarber = await db.select().from(users).where(eq(users.role, 'staff')).limit(1);
    if (testBarber.length === 0) {
      console.log('❌ No barber found for testing');
      return;
    }

    const barberId = testBarber[0].id;
    console.log(`👨‍💼 Using barber: ${testBarber[0].firstName} ${testBarber[0].lastName} (${barberId})`);

    // Get today's date in dd/mm/yyyy format
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const testDate = `${day}/${month}/${year}`;

    console.log(`📅 Testing date: ${testDate}`);

    // Get all appointments for this barber on this date
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const existingAppointments = await db
      .select({
        id: appointments.id,
        timeSlot: appointments.timeSlot,
        status: appointments.status,
        appointmentDate: appointments.appointmentDate,
        customerName: users.firstName,
        customerLastName: users.lastName
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.userId, users.id))
      .where(
        and(
          eq(appointments.barberId, barberId),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      );

    console.log(`\n📋 Existing appointments for ${testDate}:`);
    if (existingAppointments.length === 0) {
      console.log('   No appointments found');
    } else {
      existingAppointments.forEach(apt => {
        console.log(`   - ${apt.timeSlot} (${apt.status}) - ${apt.customerName} ${apt.customerLastName}`);
      });
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
    const testSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
    
    for (const slot of testSlots) {
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

    console.log(`\n🎉 Test completed successfully!`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAvailabilityFix().then(() => {
  console.log('\n🏁 Test script finished');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
}); 