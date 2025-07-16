#!/usr/bin/env bun

import { formatPhoneForTwilio } from '../helpers/phone.helper.js';

/**
 * Test script to verify phone number formatting for Twilio compatibility
 */

const testCases = [
  // Valid US numbers
  '+1234567890',
  '1234567890',
  '+1 (234) 567-8900',
  '+1 234 567 8900',
  '(234) 567-8900',
  '234-567-8900',
  
  // Valid Colombian numbers
  '+57 300 123 4567',
  '+573001234567',
  '57 300 123 4567',
  '300 123 4567',
  
  // Valid Mexican numbers
  '+52 55 1234 5678',
  '+525512345678',
  '52 55 1234 5678',
  '55 1234 5678',
  
  // Valid UK numbers
  '+44 20 7946 0958',
  '+442079460958',
  '44 20 7946 0958',
  
  // Invalid numbers
  'invalid',
  '',
  '+123456789', // too short
  '+12345678901234567890', // too long
  'abc123def',
  '+1 234 567', // incomplete
];

console.log('🧪 Testing Phone Number Formatting for Twilio Compatibility\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase}"`);
  
  const result = formatPhoneForTwilio(testCase);
  
  if (result.isValid) {
    console.log(`✅ PASS: "${testCase}" -> "${result.formatted}"`);
    passed++;
  } else {
    console.log(`❌ FAIL: "${testCase}" -> Error: ${result.error}`);
    failed++;
  }
  
  console.log('');
});

console.log('📊 Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

// Test specific Twilio requirements
console.log('\n🔍 Testing Twilio-Specific Requirements:');

const twilioTests = [
  { input: '+1234567890', expected: '+1234567890', description: 'US number with +' },
  { input: '1234567890', expected: '+11234567890', description: 'US number without +' },
  { input: '+57 300 123 4567', expected: '+573001234567', description: 'Colombian number' },
  { input: '+52 55 1234 5678', expected: '+525512345678', description: 'Mexican number' },
];

let twilioPassed = 0;
let twilioFailed = 0;

twilioTests.forEach((test, index) => {
  console.log(`\nTwilio Test ${index + 1}: ${test.description}`);
  console.log(`Input: "${test.input}"`);
  
  const result = formatPhoneForTwilio(test.input);
  
  if (result.isValid && result.formatted === test.expected) {
    console.log(`✅ PASS: "${test.input}" -> "${result.formatted}"`);
    twilioPassed++;
  } else {
    console.log(`❌ FAIL: Expected "${test.expected}", got "${result.formatted}"`);
    console.log(`Error: ${result.error || 'Unknown error'}`);
    twilioFailed++;
  }
});

console.log('\n📊 Twilio Compatibility Results:');
console.log(`✅ Passed: ${twilioPassed}`);
console.log(`❌ Failed: ${twilioFailed}`);
console.log(`📈 Twilio Success Rate: ${((twilioPassed / (twilioPassed + twilioFailed)) * 100).toFixed(1)}%`);

if (twilioFailed === 0) {
  console.log('\n🎉 All Twilio compatibility tests passed! Phone numbers will work correctly with Twilio.');
} else {
  console.log('\n⚠️  Some Twilio compatibility tests failed. Please review the phone formatting logic.');
} 