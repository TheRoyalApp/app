import { getDatabase } from './connection.js';
import { schedules, users } from './schema.js';
import { eq } from 'drizzle-orm';

async function seedSchedules() {
  try {
    const db = await getDatabase();
    
    // Get all barbers (staff users)
    const barbers = await db.select().from(users).where(eq(users.role, 'staff'));
    
    if (barbers.length === 0) {
      console.log('⚠️ No barbers found. Please run seed-users first.');
      process.exit(1);
    }

    console.log('🌱 Seeding schedules...');
    
    const defaultTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30'
    ];

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekend = ['saturday', 'sunday'];
    
    for (const barber of barbers) {
      console.log(`📅 Creating schedules for barber: ${barber.firstName} ${barber.lastName}`);
      
      // Create weekday schedules (Monday to Friday)
      for (const day of weekdays) {
        try {
          await db.insert(schedules).values({
            barberId: barber.id,
            dayOfWeek: day as any,
            availableTimeSlots: defaultTimeSlots,
            isActive: true
          });
          console.log(`✅ Created ${day} schedule for ${barber.firstName}`);
        } catch (error) {
          console.error(`❌ Failed to create ${day} schedule for ${barber.firstName}:`, error);
        }
      }
      
      // Create weekend schedules (Saturday and Sunday) with reduced hours
      const weekendTimeSlots = [
        '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
      ];
      
      for (const day of weekend) {
        try {
          await db.insert(schedules).values({
            barberId: barber.id,
            dayOfWeek: day as any,
            availableTimeSlots: weekendTimeSlots,
            isActive: true
          });
          console.log(`✅ Created ${day} schedule for ${barber.firstName}`);
        } catch (error) {
          console.error(`❌ Failed to create ${day} schedule for ${barber.firstName}:`, error);
        }
      }
    }
    
    console.log('🎉 Schedules seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding schedules:', error);
  } finally {
    process.exit(0);
  }
}

seedSchedules(); 