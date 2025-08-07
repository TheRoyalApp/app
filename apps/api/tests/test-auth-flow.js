// Test the exact authentication flow
import { getDatabase } from './src/db/connection.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function testAuthFlow() {
  try {
    console.log('🔍 Testing exact authentication flow...');
    
    const db = await getDatabase();
    console.log('✅ Database connection successful');
    
    const testEmail = 'barber@theroyalbarber.com';
    const testPassword = 'BarberPass123';
    
    console.log(`\n🔐 Testing login for: ${testEmail}`);
    
    // Step 1: Find user by email (this is where the error occurs)
    console.log('📋 Step 1: Finding user by email...');
    try {
      const userResult = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
      console.log('✅ User query successful');
      console.log(`Found ${userResult.length} users`);
      
      if (userResult.length === 0) {
        console.log('❌ User not found');
        return;
      }
      
      const user = userResult[0];
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isAdmin: user.isAdmin
      });
      
      // Step 2: Verify password
      console.log('\n🔑 Step 2: Verifying password...');
      const isValidPassword = await bcrypt.compare(testPassword, user.password);
      console.log(`Password verification result: ${isValidPassword}`);
      
      if (isValidPassword) {
        console.log('✅ Authentication successful!');
      } else {
        console.log('❌ Password verification failed');
      }
      
    } catch (error) {
      console.error('❌ Error in authentication flow:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthFlow(); 