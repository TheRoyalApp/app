# SMS Configuration Guide

## Overview

The Royal Barber app uses Twilio for SMS verification. This guide explains how to configure SMS settings for different environments.

## Environment Variables

### Required Variables
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### Optional Variables
```env
# SMS Configuration
DISABLE_SMS=false  # Set to 'true' to disable SMS sending
NODE_ENV=development  # Automatically disables SMS in development
```

## Development Setup

### Option 1: Disable SMS (Recommended for Development)
```env
DISABLE_SMS=true
```

When `DISABLE_SMS=true` or `NODE_ENV=development`:
- SMS codes are logged to console instead of being sent
- No Twilio charges incurred
- Perfect for development and testing

### Option 2: Use Twilio Trial Account
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note**: Trial accounts have daily limits (usually 1 message per day).

## Production Setup

### Full Twilio Configuration
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
DISABLE_SMS=false
NODE_ENV=production
```

## Error Handling

The system automatically handles common Twilio errors:

### Rate Limits
- **Daily limit exceeded**: Automatically falls back to development mode
- **Rate limit exceeded**: Logs warning and continues with fallback

### Invalid Phone Numbers
- **Unverified numbers**: Returns user-friendly error message
- **Invalid format**: Validates and provides guidance

### Service Issues
- **Network errors**: Retry mechanism with clear error messages
- **Insufficient credits**: Graceful degradation with user notification

## Testing

### Development Mode
```bash
# Codes are logged to console
[DEV/TEST] SMS verification code for +1234567890: 123456
```

### Production Testing
```bash
# Set environment variables
export DISABLE_SMS=true
export NODE_ENV=development

# Run the application
bun run start
```

## Troubleshooting

### Common Issues

1. **"Account exceeded daily messages limit"**
   - Solution: Set `DISABLE_SMS=true` for development
   - Or upgrade Twilio account for production

2. **"Invalid phone number"**
   - Ensure phone numbers start with country code (+1, +57, etc.)
   - Use Twilio's phone number validation

3. **"Twilio not configured"**
   - Check all required environment variables are set
   - Verify Twilio credentials are correct

### Debug Mode
```env
NODE_ENV=development
DISABLE_SMS=true
```

This will log all SMS codes to console for easy testing.

## Best Practices

1. **Development**: Always use `DISABLE_SMS=true`
2. **Testing**: Use test phone numbers with Twilio
3. **Production**: Monitor Twilio usage and set up alerts
4. **Error Handling**: Always provide user-friendly error messages
5. **Logging**: Monitor SMS delivery rates and errors

## Security Notes

- Never log SMS codes in production
- Use environment variables for all sensitive data
- Monitor Twilio usage to prevent abuse
- Implement rate limiting on SMS endpoints 