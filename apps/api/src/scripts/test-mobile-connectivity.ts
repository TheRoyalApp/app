#!/usr/bin/env bun

/**
 * Test script to verify mobile app connectivity
 * This script tests the same endpoints that the mobile app uses
 */

const API_BASE_URL = 'http://192.168.1.198:3001';

async function testEndpoint(endpoint: string, description: string) {
  try {
    console.log(`\n🧪 Testing ${description}...`);
    console.log(`📍 URL: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log(`📡 Status: ${response.status}`);
    console.log(`📡 Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.log(`❌ Failed: HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Success:`, data);
    return true;
  } catch (error) {
    console.log(`❌ Error:`, error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting mobile app connectivity tests...\n');
  
  const tests = [
    { endpoint: '/health', description: 'Health Check' },
    { endpoint: '/users/staff', description: 'Staff Users' },
    { endpoint: '/services', description: 'Services' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await testEndpoint(test.endpoint, test.description);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Mobile app should be able to connect.');
  } else {
    console.log('\n⚠️ Some tests failed. Check network configuration.');
  }
}

runTests().catch(console.error); 