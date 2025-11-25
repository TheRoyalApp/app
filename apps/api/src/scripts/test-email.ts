#!/usr/bin/env bun
/**
 * Email Configuration Test Script
 * 
 * This script tests your Resend email configuration.
 * Run this to verify that emails can be sent successfully.
 * 
 * Usage:
 *   bun run src/scripts/test-email.ts your-email@example.com
 */

import { sendPasswordResetEmail, getEmailStatus } from '../helpers/email.helper.js';
import winstonLogger from '../helpers/logger.js';

const testEmail = async (recipientEmail: string) => {
  console.log('\n🧪 Testing Email Configuration\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check configuration
  console.log('\n📋 Step 1: Checking Email Configuration...\n');
  const status = getEmailStatus();
  
  console.log(`  RESEND_API_KEY:     ${status.hasApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  RESEND_FROM_EMAIL:  ${status.hasFromEmail ? '✅ Set' : '❌ Missing'}`);
  console.log(`  From Email:         ${status.fromEmail}`);
  console.log(`  Status:             ${status.configured ? '✅ Configured' : '❌ Not Configured'}`);
  
  if (status.error) {
    console.log(`  Error:              ❌ ${status.error}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (!status.configured) {
    console.log('\n❌ Email is NOT properly configured.');
    console.log('\n📝 To fix this, set the following environment variables:');
    console.log('   RESEND_API_KEY=re_your_api_key_here');
    console.log('   RESEND_FROM_EMAIL=noreply@yourdomain.com');
    console.log('\n💡 See docs/EMAIL_TROUBLESHOOTING.md for more help.');
    process.exit(1);
  }
  
  console.log('\n✅ Email configuration looks good!');
  
  // Step 2: Send test email
  console.log('\n📧 Step 2: Sending Test Email...\n');
  console.log(`  To:      ${recipientEmail}`);
  console.log(`  From:    ${status.fromEmail}`);
  console.log(`  Subject: Restablece tu Contraseña - The Royal Barber`);
  console.log('\n  Sending...');
  
  try {
    const testToken = 'TEST123';
    const testName = 'Test User';
    
    const success = await sendPasswordResetEmail(recipientEmail, testToken, testName);
    
    console.log('\n' + '=' .repeat(60));
    
    if (success) {
      console.log('\n✅ SUCCESS! Email sent successfully.');
      console.log('\n📬 Next steps:');
      console.log('   1. Check your inbox at', recipientEmail);
      console.log('   2. Look for spam/junk folder if not in inbox');
      console.log('   3. Verify the email contains the test token: TEST123');
      console.log('\n🎉 Your email configuration is working correctly!');
    } else {
      console.log('\n❌ FAILED! Email was not sent.');
      console.log('\n🔍 Check the logs above for error details.');
      console.log('💡 Common issues:');
      console.log('   - Domain not verified in Resend');
      console.log('   - Invalid API key');
      console.log('   - Rate limit exceeded');
      console.log('\n📝 See docs/EMAIL_TROUBLESHOOTING.md for help.');
      process.exit(1);
    }
  } catch (error: any) {
    console.log('\n' + '=' .repeat(60));
    console.log('\n❌ ERROR! An exception occurred:');
    console.log('\n', error.message || error);
    if (error.stack) {
      console.log('\nStack trace:');
      console.log(error.stack);
    }
    process.exit(1);
  }
};

// Main execution
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('\n❌ Error: Please provide a recipient email address\n');
  console.error('Usage:');
  console.error('  bun run src/scripts/test-email.ts your-email@example.com\n');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error('\n❌ Error: Invalid email address format\n');
  console.error('Please provide a valid email address like: user@example.com\n');
  process.exit(1);
}

testEmail(recipientEmail)
  .then(() => {
    console.log('\n✨ Test completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  });

