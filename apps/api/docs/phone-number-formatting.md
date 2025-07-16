# Phone Number Formatting for Twilio Compatibility

This document explains the phone number formatting implementation that ensures all phone numbers in the system are compatible with Twilio's E.164 format requirements.

## Overview

The Royal Barber app uses Twilio for SMS and WhatsApp notifications. Twilio requires phone numbers to be in E.164 format, which includes:
- A `+` prefix
- Country code (1-3 digits)
- National number (up to 12 digits)
- Total length: 10-15 digits

Example: `+1234567890` (US), `+573001234567` (Colombia), `+525512345678` (Mexico)

## Implementation

### Backend Phone Formatting (`apps/api/src/helpers/phone.helper.ts`)

The backend phone formatting utility provides:

```typescript
interface PhoneFormatResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}

function formatPhoneForTwilio(phone: string): PhoneFormatResult
function isValidTwilioPhone(phone: string): boolean
function getFormattedPhone(phone: string): string
```

**Features:**
- Normalizes various input formats to E.164
- Handles US (+1), Colombian (+57), Mexican (+52), and other country codes
- Removes spaces, dashes, parentheses
- Validates length (10-15 digits)
- Provides detailed error messages

### Frontend Phone Formatting (`apps/app/helpers/phoneFormatter.ts`)

The frontend utility provides real-time formatting:

```typescript
interface PhoneFormatResult {
  isValid: boolean;
  formatted: string;
  display: string;
  error?: string;
}

function formatPhoneNumber(phone: string): PhoneFormatResult
function formatPhoneAsTyping(phone: string): string
function isValidPhoneNumber(phone: string): boolean
function getTwilioFormattedPhone(phone: string): string
```

**Features:**
- Real-time formatting as user types
- Display formatting for better UX
- Validation for form submission
- Support for multiple country formats

## Integration Points

### 1. User Registration (`apps/api/src/auth/auth.controller.ts`)

Phone numbers are formatted during user registration:

```typescript
// Format phone number for Twilio compatibility
const phoneResult = formatPhoneForTwilio(validatedData.phone);
if (!phoneResult.isValid) {
  return c.json(errorResponse(400, phoneResult.error || 'Invalid phone number format'), 400);
}

// Create user with formatted phone number
const newUser = await db.insert(users).values({
  // ... other fields
  phone: phoneResult.formatted,
  // ... other fields
});
```

### 2. Profile Updates (`apps/api/src/users/users.controller.ts`)

Phone numbers are formatted when users update their profiles:

```typescript
// Format phone number if it's being updated
if (updateData.phone) {
  const phoneResult = formatPhoneForTwilio(updateData.phone);
  if (!phoneResult.isValid) {
    res.error = phoneResult.error || 'Invalid phone number format';
    return res;
  }
  formattedUpdateData.phone = phoneResult.formatted;
}
```

### 3. Validation Schema (`apps/api/src/helpers/validation.schemas.ts`)

The Zod validation schema automatically formats phone numbers:

```typescript
export const phoneSchema = z.string()
  .min(1, 'Phone number is required')
  .transform((val) => {
    const result = formatPhoneForTwilio(val);
    if (!result.isValid) {
      throw new Error(result.error || 'Invalid phone number format');
    }
    return result.formatted;
  })
  .refine((val) => {
    const result = formatPhoneForTwilio(val);
    return result.isValid;
  }, {
    message: 'Phone number must be in international format (e.g., +1234567890)'
  });
```

### 4. WhatsApp Notifications (`apps/api/src/helpers/whatsapp.helper.ts`)

Phone numbers are formatted before sending WhatsApp messages:

```typescript
// Format phone number for Twilio compatibility
const phoneResult = formatPhoneForTwilio(to);
if (!phoneResult.isValid) {
  return {
    success: false,
    error: phoneResult.error || 'Invalid phone number format'
  };
}

const formattedPhone = phoneResult.formatted;
const whatsappTo = `whatsapp:${formattedPhone}`;
```

### 5. Frontend Forms

#### Signup Screen (`apps/app/app/auth/signup.tsx`)

```typescript
// Real-time formatting
onChangeText={(text) => setPhone(formatPhoneAsTyping(text))}

// Validation before submission
if (!isValidPhoneNumber(phone)) {
  Alert.alert('Error', 'Por favor ingresa un número de teléfono válido en formato internacional (ej: +1234567890)');
  return;
}
```

#### Profile Screen (`apps/app/app/(tabs)/profile.tsx`)

```typescript
// Real-time formatting in edit mode
onChangeText={text =>
  setUserData({ ...userData, phone: formatPhoneAsTyping(text) })
}

// Validation before saving
if (!isValidPhoneNumber(userData.phone)) {
  Alert.alert('Error', 'Por favor ingresa un número de teléfono válido en formato internacional (ej: +1234567890)');
  return;
}
```

## Supported Formats

### Input Formats (Auto-detected and formatted)

| Input Format | Output (E.164) | Country |
|--------------|----------------|---------|
| `+1234567890` | `+1234567890` | US |
| `1234567890` | `+11234567890` | US |
| `+1 (234) 567-8900` | `+12345678900` | US |
| `+1 234 567 8900` | `+12345678900` | US |
| `(234) 567-8900` | `+12345678900` | US |
| `234-567-8900` | `+12345678900` | US |
| `+57 300 123 4567` | `+573001234567` | Colombia |
| `+573001234567` | `+573001234567` | Colombia |
| `300 123 4567` | `+13001234567` | Colombia (assumes US) |
| `+52 55 1234 5678` | `+525512345678` | Mexico |
| `+525512345678` | `+525512345678` | Mexico |
| `+44 20 7946 0958` | `+442079460958` | UK |

### Display Formats (Frontend only)

| E.164 Format | Display Format | Country |
|--------------|----------------|---------|
| `+1234567890` | `+1 (234) 567-8900` | US |
| `+573001234567` | `+57 300 123 4567` | Colombia |
| `+525512345678` | `+52 55 1234 5678` | Mexico |

## Error Handling

### Validation Errors

1. **Empty phone number**: "Phone number is required"
2. **Invalid characters**: "Phone number must be 10-15 digits (including country code)"
3. **Too short**: "Phone number must be 10-15 digits (including country code)"
4. **Too long**: "Phone number must be 10-15 digits (including country code)"

### Backend Error Responses

```json
{
  "success": false,
  "error": "Phone number must be in international format (e.g., +1234567890)"
}
```

### Frontend Error Messages

- Spanish: "Por favor ingresa un número de teléfono válido en formato internacional (ej: +1234567890)"
- English: "Please enter a valid phone number in international format (e.g., +1234567890)"

## Testing

### Test Script

Run the test script to verify formatting:

```bash
cd apps/api
bun run src/scripts/test-phone-formatting.ts
```

### Test Results

The test script validates:
- ✅ Valid phone numbers are formatted correctly
- ✅ Invalid phone numbers are rejected with appropriate errors
- ✅ Twilio E.164 compatibility is maintained
- ✅ Multiple country code formats are supported

## Best Practices

### For Developers

1. **Always use the formatting utilities** instead of manual phone number handling
2. **Validate on both frontend and backend** for better UX
3. **Use real-time formatting** in input fields for better user experience
4. **Log phone number transformations** for debugging

### For Users

1. **Enter phone numbers with country code** (e.g., +1 for US, +57 for Colombia)
2. **Use international format** for best compatibility
3. **Include the + prefix** when possible

## Migration Notes

### Existing Data

- Existing phone numbers in the database will be formatted when users update their profiles
- No automatic migration is needed
- Invalid phone numbers will be rejected during updates

### API Changes

- Phone number validation is now stricter
- All phone numbers are stored in E.164 format
- WhatsApp notifications use formatted phone numbers

## Troubleshooting

### Common Issues

1. **Phone number not working with Twilio**
   - Check if the number is in E.164 format
   - Verify the country code is correct
   - Ensure the number is not too short or long

2. **Frontend formatting not working**
   - Check if the phone formatter is imported correctly
   - Verify the onChangeText handler is using formatPhoneAsTyping
   - Ensure validation is called before form submission

3. **Backend validation errors**
   - Check the phone number format in the request
   - Verify the validation schema is being used
   - Look at the server logs for detailed error messages

### Debug Mode

Enable debug logging to see phone number transformations:

```typescript
// In phone.helper.ts
winstonLogger.info('Phone number formatted', {
  original: phone,
  formatted: formatted,
  length: cleaned.length
});
```

## Future Enhancements

1. **Phone number library integration** (e.g., `libphonenumber-js`)
2. **Automatic country detection** based on user location
3. **Phone number verification** via SMS/WhatsApp
4. **International phone number picker** component
5. **Support for more country formats** 