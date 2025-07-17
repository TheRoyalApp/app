// Test script to debug authentication issues
const API_BASE_URL = 'http://localhost:3001';

async function testAuth() {
  console.log('🔍 Testing API connectivity and authentication...');
  
  // Test 1: Check if API is running
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    console.log('✅ API Health Check:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    }
  } catch (error) {
    console.log('❌ API Health Check Failed:', error.message);
    console.log('Make sure the API is running on port 3001');
    return;
  }
  
  // Test 2: Test login with seeded credentials
  const testCredentials = [
    {
      email: 'barber@theroyalbarber.com',
      password: 'BarberPass123',
      name: 'Barber Account'
    },
    {
      email: 'admin@theroyalbarber.com',
      password: 'AdminPass123',
      name: 'Admin Account'
    },
    {
      email: 'staff@example.com',
      password: 'StaffPass123',
      name: 'Staff Account'
    }
  ];
  
  for (const cred of testCredentials) {
    console.log(`\n🔐 Testing login for ${cred.name}...`);
    
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password
        }),
        signal: AbortSignal.timeout(10000)
      });
      
      console.log(`Status: ${loginResponse.status}`);
      
      const loginData = await loginResponse.json();
      console.log('Response:', JSON.stringify(loginData, null, 2));
      
      if (loginResponse.ok) {
        console.log(`✅ ${cred.name} login successful!`);
        
        // Test 3: Test authenticated endpoint
        if (loginData.data?.accessToken) {
          console.log(`🔑 Testing authenticated endpoint with token...`);
          
          const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${loginData.data.accessToken}`
            },
            signal: AbortSignal.timeout(5000)
          });
          
          console.log(`Profile Status: ${profileResponse.status}`);
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Profile data:', JSON.stringify(profileData, null, 2));
          } else {
            const errorData = await profileResponse.json();
            console.log('Profile error:', errorData);
          }
        }
      } else {
        console.log(`❌ ${cred.name} login failed:`, loginData.message || loginData.error);
      }
      
    } catch (error) {
      console.log(`❌ ${cred.name} login error:`, error.message);
    }
  }
  
  // Test 4: Test with invalid credentials
  console.log('\n🔐 Testing with invalid credentials...');
  
  try {
    const invalidResponse = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`Invalid credentials status: ${invalidResponse.status}`);
    const invalidData = await invalidResponse.json();
    console.log('Invalid credentials response:', JSON.stringify(invalidData, null, 2));
    
  } catch (error) {
    console.log('Invalid credentials test error:', error.message);
  }
}

// Run the test
testAuth().catch(console.error); 