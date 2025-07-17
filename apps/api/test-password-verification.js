// Test password verification
import { getDatabase } from './src/db/connection.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function testPasswordVerification() {
  try {
    console.log('🔍 Testing password verification...');
    
    const db = await getDatabase();
    
    // Test with the seeded users
    const testUsers = [
      {
        email: 'barber@theroyalbarber.com',
        password: 'BarberPass123',
        name: 'Barber'
      },
      {
        email: 'admin@theroyalbarber.com',
        password: 'AdminPass123',
        name: 'Admin'
      },
      {
        email: 'staff@example.com',
        password: 'StaffPass123',
        name: 'Staff'
      }
    ];
    
    for (const testUser of testUsers) {
      console.log(`\n🔐 Testing ${testUser.name} account...`);
      
      // Get user from database
      const userResult = await db.select().from(users).where(eq(users.email, testUser.email)).limit(1);
      
      if (userResult.length === 0) {
        console.log(`❌ User ${testUser.email} not found in database`);
        continue;
      }
      
      const user = userResult[0];
      console.log(`✅ Found user: ${user.email}`);
      console.log(`📋 User details:`, {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isAdmin: user.isAdmin,
        hasPassword: !!user.password,
        passwordLength: user.password?.length || 0
      });
      
      // Test password verification
      console.log(`🔑 Testing password verification...`);
      const isValidPassword = await bcrypt.compare(testUser.password, user.password);
      console.log(`Password verification result: ${isValidPassword}`);
      
      if (isValidPassword) {
        console.log(`✅ Password verification successful for ${testUser.name}`);
      } else {
        console.log(`❌ Password verification failed for ${testUser.name}`);
        
        // Let's see what the password looks like
        console.log(`🔍 Password analysis:`);
        console.log(`- Input password: ${testUser.password}`);
        console.log(`- Stored password hash: ${user.password}`);
        console.log(`- Hash starts with: ${user.password?.substring(0, 10)}...`);
        
        // Test if the password was hashed correctly during seeding
        const testHash = await bcrypt.hash(testUser.password, 10);
        console.log(`- Test hash for same password: ${testHash.substring(0, 10)}...`);
        
        // Compare the hashes
        const hashComparison = await bcrypt.compare(testUser.password, testHash);
        console.log(`- Test hash comparison: ${hashComparison}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Password verification test failed:', error);
  }
}

testPasswordVerification(); 