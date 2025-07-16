import winstonLogger from './logger.js';

/**
 * Phone number formatting utility for Twilio compatibility
 * Ensures all phone numbers are in E.164 format (+1234567890)
 */

export interface PhoneFormatResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Normalize phone number to E.164 format for Twilio compatibility
 * @param phone - Raw phone number input
 * @returns PhoneFormatResult with validation and formatting
 */
export function formatPhoneForTwilio(phone: string): PhoneFormatResult {
  try {
    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        formatted: '',
        error: 'Phone number is required'
      };
    }

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove all spaces, dashes, parentheses
    cleaned = cleaned.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with +, keep it
    if (cleaned.startsWith('+')) {
      // Remove the + temporarily for processing
      cleaned = cleaned.substring(1);
    } else {
      // If no country code, assume US (+1)
      cleaned = '1' + cleaned;
    }
    
    // Validate the cleaned number
    if (!/^\d{10,15}$/.test(cleaned)) {
      return {
        isValid: false,
        formatted: '',
        error: 'Phone number must be 10-15 digits (including country code)'
      };
    }
    
    // Add the + back
    const formatted = '+' + cleaned;
    
    // Additional validation for common country codes
    const countryCode = cleaned.substring(0, 3);
    const commonCountryCodes = ['1', '44', '33', '49', '34', '39', '81', '86', '91', '55', '57', '52'];
    
    if (cleaned.length < 10 || cleaned.length > 15) {
      return {
        isValid: false,
        formatted: '',
        error: 'Phone number length is invalid'
      };
    }
    
    // Log the formatting for debugging
    winstonLogger.info('Phone number formatted', {
      original: phone,
      formatted: formatted,
      length: cleaned.length
    });
    
    return {
      isValid: true,
      formatted: formatted
    };
    
  } catch (error) {
    winstonLogger.error('Error formatting phone number', {
      phone: phone,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      isValid: false,
      formatted: '',
      error: 'Failed to format phone number'
    };
  }
}

/**
 * Validate if a phone number is in correct E.164 format for Twilio
 * @param phone - Phone number to validate
 * @returns boolean indicating if valid
 */
export function isValidTwilioPhone(phone: string): boolean {
  const result = formatPhoneForTwilio(phone);
  return result.isValid;
}

/**
 * Get formatted phone number or throw error
 * @param phone - Raw phone number
 * @returns Formatted phone number
 * @throws Error if phone number is invalid
 */
export function getFormattedPhone(phone: string): string {
  const result = formatPhoneForTwilio(phone);
  if (!result.isValid) {
    throw new Error(result.error || 'Invalid phone number');
  }
  return result.formatted;
}

/**
 * Test function to validate phone number formatting
 */
export function testPhoneFormatting(): void {
  const testCases = [
    '+1234567890',
    '1234567890',
    '+1 (234) 567-8900',
    '+1 234 567 8900',
    '+44 20 7946 0958',
    '+57 300 123 4567',
    '+52 55 1234 5678',
    'invalid',
    '',
    '+123456789', // too short
    '+12345678901234567890' // too long
  ];
  
  console.log('Testing phone number formatting:');
  testCases.forEach(testCase => {
    const result = formatPhoneForTwilio(testCase);
    console.log(`${testCase} -> ${result.formatted} (valid: ${result.isValid})`);
  });
} 