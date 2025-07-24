# 🚀 Production Deployment Guide - The Royal Barber

## ⚠️ **CRITICAL: Pre-Deployment Checklist**

Before deploying to production, ensure all these issues are resolved:

### **1. Environment Variables Setup**
```bash
# API Environment Variables (Required)
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
REFRESH_SECRET=your-super-secure-refresh-secret-at-least-32-characters-long
INTERNAL_API_SECRET=your-internal-api-secret
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
NODE_ENV=production
PORT=3001
DISABLE_SMS=false
DEBUG_MODE=false
LOG_SMS_CODES=false

# Mobile App Environment Variables
EXPO_PUBLIC_API_URL=https://api.theroyalbarber.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_key
EXPO_PUBLIC_DEBUG_MODE=false
```

### **2. Database Setup**
```bash
# Run migrations on production database
cd apps/api
bun run db:migrate

# Verify database connection
bun run db:studio
```

### **3. External Services Configuration**

#### **Stripe Production Setup**
1. Switch to live mode in Stripe Dashboard
2. Update webhook endpoint: `https://api.theroyalbarber.com/payments/webhook`
3. Configure webhook events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`

#### **Twilio Production Setup**
1. Verify your Twilio phone number
2. Ensure sufficient credits for SMS
3. Test SMS delivery

#### **Domain Configuration**
1. Set up DNS for `api.theroyalbarber.com`
2. Configure SSL certificates
3. Set up CORS for your production domains

## 🚀 **Deployment Steps**

### **Option 1: Railway Deployment (Recommended)**

#### **1. Set Environment Variables in Railway**
```bash
# API Service Variables
railway variables set DATABASE_URL="your-production-database-url"
railway variables set JWT_SECRET="your-production-jwt-secret"
railway variables set REFRESH_SECRET="your-production-refresh-secret"
railway variables set INTERNAL_API_SECRET="your-production-internal-secret"
railway variables set STRIPE_SECRET_KEY="sk_live_your_live_key"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
railway variables set TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
railway variables set TWILIO_AUTH_TOKEN="your_twilio_auth_token"
railway variables set TWILIO_PHONE_NUMBER="+1234567890"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
railway variables set DISABLE_SMS="false"
railway variables set DEBUG_MODE="false"
railway variables set LOG_SMS_CODES="false"

# Website Service Variables
railway variables set REACT_APP_API_URL="https://api.theroyalbarber.com"
```

#### **2. Deploy Services**
```bash
# Deploy API
cd apps/api
railway up

# Deploy Website
cd apps/website
railway up
```

### **Option 2: Manual Deployment**

#### **1. Build and Deploy API**
```bash
cd apps/api
bun install
bun run db:migrate
bun run src/index.ts
```

#### **2. Build and Deploy Website**
```bash
cd apps/website
npm install
npm start
```

#### **3. Build Mobile App**
```bash
cd apps/app
expo build:ios
expo build:android
```

## 🔧 **Post-Deployment Verification**

### **1. Health Checks**
```bash
# API Health Check
curl https://api.theroyalbarber.com/health

# Website Health Check
curl https://theroyalbarber.com/
```

### **2. Database Verification**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### **3. Payment System Test**
```bash
# Test Stripe webhook
curl -X POST https://api.theroyalbarber.com/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### **4. SMS System Test**
```bash
# Test SMS sending
curl -X POST https://api.theroyalbarber.com/auth/send-sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

## 🛡️ **Security Checklist**

### **Backend Security**
- [ ] JWT_SECRET is at least 32 characters and unique
- [ ] REFRESH_SECRET is different from JWT_SECRET
- [ ] DATABASE_URL uses strong password
- [ ] All API keys are production keys (not test)
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] SSL certificates are installed

### **Frontend Security**
- [ ] No sensitive data in client-side code
- [ ] API URL points to production
- [ ] Stripe publishable key is live key
- [ ] Debug mode is disabled

### **Mobile App Security**
- [ ] Deep links are properly configured
- [ ] Payment callbacks work correctly
- [ ] Secure storage is used for tokens
- [ ] App signing is configured

## 📊 **Monitoring Setup**

### **1. Application Monitoring**
- Set up logging for all services
- Monitor API response times
- Track error rates

### **2. Payment Monitoring**
- Monitor Stripe webhook delivery
- Track payment success/failure rates
- Set up alerts for payment issues

### **3. SMS Monitoring**
- Monitor Twilio SMS delivery
- Track SMS costs
- Set up alerts for SMS failures

### **4. Database Monitoring**
- Monitor database connection health
- Track query performance
- Set up alerts for connection issues

## 🚨 **Troubleshooting**

### **Common Production Issues**

#### **1. Database Connection Issues**
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

#### **2. Payment Issues**
```bash
# Check Stripe webhook logs
stripe logs tail

# Test webhook endpoint
stripe listen --forward-to https://api.theroyalbarber.com/payments/webhook
```

#### **3. SMS Issues**
```bash
# Check Twilio logs
curl -X GET https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json \
  -u "AC...:auth_token"
```

#### **4. Mobile App Issues**
```bash
# Check deep link configuration
expo diagnostics

# Test deep links
expo start --tunnel
```

## 📞 **Support Contacts**

- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Railway Support**: [railway.app/support](https://railway.app/support)
- **Expo Support**: [docs.expo.dev](https://docs.expo.dev)

## 🔄 **Maintenance**

### **Regular Tasks**
- Monitor logs daily
- Check payment webhooks weekly
- Review SMS costs monthly
- Update dependencies quarterly
- Backup database daily

### **Updates**
- Keep all dependencies updated
- Monitor security advisories
- Test updates in staging first
- Deploy during low-traffic periods

---

**⚠️ IMPORTANT**: This deployment guide assumes you have resolved all the compatibility issues mentioned in the analysis. Make sure to test thoroughly in a staging environment before deploying to production. 