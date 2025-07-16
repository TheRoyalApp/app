# 🚀 Environment Setup Guide

This guide will help you set up the environment variables for The Royal Barber application.

## 📁 File Structure

```
the_royal_barber/
├── apps/
│   ├── api/
│   │   └── env.example          # Backend environment variables
│   └── app/
│       └── env.example          # Frontend environment variables
└── ENVIRONMENT_SETUP.md         # This file
```

## 🔧 Backend Setup (API)

### 1. Copy Environment File
```bash
cd apps/api
cp env.example .env
```

### 2. Configure Database
```bash
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/the_royal_barber
```

### 3. Generate Secure Secrets
```bash
# Generate JWT secrets (run these commands)
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For REFRESH_SECRET
openssl rand -base64 32  # For INTERNAL_API_SECRET
```

### 4. Configure External Services

#### Stripe Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Settings > API keys
3. Update in `.env`:
```env
STRIPE_SECRET_KEY=sk_live_your_actual_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Twilio Configuration
1. Go to [Twilio Console](https://console.twilio.com/)
2. Get your Account SID and Auth Token
3. Update in `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_actual_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 5. Environment-Specific Settings

#### Development
```env
NODE_ENV=development
DISABLE_SMS=true
DEBUG_MODE=true
LOG_SMS_CODES=true
```

#### Production
```env
NODE_ENV=production
DISABLE_SMS=false
DEBUG_MODE=false
LOG_SMS_CODES=false
```

## 📱 Frontend Setup (App)

### 1. Copy Environment File
```bash
cd apps/app
cp env.example .env
```

### 2. Configure API URL
```env
# Development
EXPO_PUBLIC_API_URL=http://localhost:8080

# Production
EXPO_PUBLIC_API_URL=https://api.theroyalbarber.com
```

### 3. Configure Stripe (Frontend)
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

## 🔒 Security Checklist

### Backend Security
- [ ] JWT_SECRET is at least 32 characters long
- [ ] REFRESH_SECRET is at least 32 characters long
- [ ] INTERNAL_API_SECRET is unique and secure
- [ ] DATABASE_URL uses strong password
- [ ] All secrets are different from example values

### Frontend Security
- [ ] EXPO_PUBLIC_API_URL points to correct environment
- [ ] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is correct
- [ ] No sensitive data in frontend environment variables

## 🧪 Testing Configuration

### Test Database
```env
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/the_royal_barber_test
```

### Test Stripe Keys
```env
STRIPE_SECRET_KEY=sk_test_your_test_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
```

## 🚀 Production Deployment

### 1. Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db
JWT_SECRET=your_production_jwt_secret
REFRESH_SECRET=your_production_refresh_secret
STRIPE_SECRET_KEY=sk_live_your_live_key
EXPO_PUBLIC_API_URL=https://api.theroyalbarber.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### 2. Database Setup
```bash
# Run migrations
bun run db:migrate

# Verify schema
bun run db:studio
```

### 3. External Services
- [ ] Stripe webhooks configured
- [ ] Twilio phone number verified
- [ ] SSL certificates installed
- [ ] Domain DNS configured

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. Stripe Webhooks
```bash
# Test webhook endpoint
curl -X POST https://your-api.com/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### 3. Twilio SMS
```bash
# Test SMS sending
curl -X POST https://your-api.com/auth/send-sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

### Debug Mode
```env
# Enable debug logging
LOG_LEVEL=debug
DEBUG_MODE=true
```

## 📋 Environment Variables Reference

### Backend Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `REFRESH_SECRET` | ✅ | Refresh token secret |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ✅ | Twilio phone number |
| `NODE_ENV` | ✅ | Environment (dev/prod) |
| `PORT` | ❌ | Server port (default: 8080) |

### Frontend Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | ✅ | API base URL |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |
| `EXPO_PUBLIC_DEBUG_MODE` | ❌ | Debug mode flag |

## 🆘 Support

If you encounter issues:

1. Check the logs: `bun run dev` and look for error messages
2. Verify environment variables: `echo $VARIABLE_NAME`
3. Test database connection
4. Check external service credentials
5. Review the troubleshooting section above

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/) 