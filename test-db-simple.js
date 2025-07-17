// Simple database test
import { getDatabase } from './apps/api/src/db/connection.js';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    const db = await getDatabase();
    console.log('✅ Database connection successful');
    
    // Test if users table exists
    console.log('🔍 Checking if users table exists...');
    const result = await db.execute(sql`SELECT COUNT(*) FROM users`);
    console.log('✅ Users table exists, count:', result[0].count);
    
    // Test if we can query users
    console.log('🔍 Testing user query...');
    const users = await db.select().from(users).limit(1);
    console.log('✅ User query successful, found users:', users.length);
    
    if (users.length > 0) {
      console.log('📋 Sample user:', {
        id: users[0].id,
        email: users[0].email,
        firstName: users[0].firstName,
        lastName: users[0].lastName,
        role: users[0].role,
        isAdmin: users[0].isAdmin
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase(); 