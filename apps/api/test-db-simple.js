// Simple database test
import { getDatabase } from './src/db/connection.js';
import { users } from './src/db/schema.js';
import { sql } from 'drizzle-orm';

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
    const userResults = await db.select().from(users).limit(1);
    console.log('✅ User query successful, found users:', userResults.length);
    
    if (userResults.length > 0) {
      console.log('📋 Sample user:', {
        id: userResults[0].id,
        email: userResults[0].email,
        firstName: userResults[0].firstName,
        lastName: userResults[0].lastName,
        role: userResults[0].role,
        isAdmin: userResults[0].isAdmin
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase(); 