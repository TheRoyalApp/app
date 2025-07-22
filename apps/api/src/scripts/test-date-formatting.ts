#!/usr/bin/env bun

import { 
  formatDateForMexico, 
  formatDateWithDayName, 
  formatTimeForMexico, 
  formatAppointmentDateTime,
  isToday 
} from '../helpers/date.helper.js';

console.log('🧪 Testing Date Formatting for Mexican Users\n');

// Test date formatting
const testDate = new Date('2025-07-29T06:00:00');
console.log('📅 Test Date:', testDate.toISOString());

console.log('\n📋 Date Formatting Tests:');
console.log('• DD/MM/YYYY format:', formatDateForMexico(testDate));
console.log('• With day name:', formatDateWithDayName(testDate));

console.log('\n⏰ Time Formatting Tests:');
console.log('• 09:00 →', formatTimeForMexico('09:00'));
console.log('• 14:30 →', formatTimeForMexico('14:30'));
console.log('• 23:45 →', formatTimeForMexico('23:45'));
console.log('• 00:15 →', formatTimeForMexico('00:15'));

console.log('\n📅 Appointment DateTime Tests:');
console.log('• Full format:', formatAppointmentDateTime(testDate, '14:30'));

console.log('\n✅ Today Check:');
console.log('• Is today:', isToday(new Date()));
console.log('• Is test date today:', isToday(testDate));

console.log('\n🎯 Expected Output for WhatsApp Messages:');
console.log('• Date: 29/07/2025');
console.log('• Time: 2:30 PM');
console.log('• Full: Martes, 29 de Julio de 2025 a las 2:30 PM');

console.log('\n✅ All date formatting tests completed!'); 