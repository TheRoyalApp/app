#!/usr/bin/env node

/**
 * Test script to verify barber schedule filtering
 * This script tests the hasBarberSchedules function and the getAllUsers filtering
 */

import { getDatabase } from './src/db/connection.js';
import { users, schedules } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import { hasBarberSchedules } from './src/schedules/schedules.controller.js';
import { getAllUsers } from './src/users/users.controller.js';

async function testBarberScheduleFiltering() {
  try {
    console.log('🧪 Testing barber schedule filtering...\n');

    const db = await getDatabase();

    // Get all staff users
    const allStaff = await db.select().from(users).where(eq(users.role, 'staff'));
    console.log(`👥 Total staff users: ${allStaff.length}`);
    
    for (const staff of allStaff) {
      console.log(`\n👨‍💼 Staff: ${staff.firstName} ${staff.lastName} (${staff.id})`);
      
      // Check if they have schedules
      const hasSchedules = await hasBarberSchedules(staff.id);
      console.log(`   Has schedules: ${hasSchedules ? '✅ Yes' : '❌ No'}`);
      
      if (hasSchedules) {
        // Get their schedules
        const barberSchedules = await db.select().from(schedules).where(eq(schedules.barberId, staff.id));
        console.log(`   Schedule count: ${barberSchedules.length}`);
        barberSchedules.forEach(schedule => {
          console.log(`     - ${schedule.dayOfWeek}: ${schedule.availableTimeSlots.length} slots`);
        });
      }
    }

    // Test the getAllUsers function with staff role
    console.log('\n🔍 Testing getAllUsers with staff role...');
    const result = await getAllUsers('staff');
    
    if (result.success && result.data) {
      console.log(`✅ Filtered staff users: ${result.data.length}`);
      result.data.forEach(user => {
        console.log(`   - ${user.firstName} ${user.lastName}`);
      });
    } else {
      console.log(`❌ Error: ${result.error}`);
    }

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBarberScheduleFiltering(); 