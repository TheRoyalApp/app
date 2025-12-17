# Email Troubleshooting Guide - Resend Integration

This guide will help you diagnose and fix email sending issues in production.

## 🔍 Quick Diagnosis

### Step 1: Check Your Health Endpoint

Visit your API health endpoint to check email configuration status:

```bash
curl https://your-api-domain.com/health
```

Expected response should include:
```json
{
  "status": "ok",
  "services": {
    "email": {
      "configured": true,
      "status": "operational"
    }
  }
}
```

If `configured: false`, continue to Step 2.

### Step 2: Check Your Logs

Check your application logs for email-related errors:

```bash
# Look for email configuration errors
grep -i "email" logs/error.log
grep -i "resend" logs/error.log
grep -i "password reset" logs/all.log
```

Common error messages:
- `RESEND_API_KEY not found in environment variables`
- `RESEND_FROM_EMAIL not found in environment variables`
- `Cannot send password reset email`

## 🔧 Common Issues & Solutions

### Issue 1: Missing RESEND_API_KEY

**Error in logs:**
```
Email configuration error: RESEND_API_KEY not found in environment variables
```

**Solution:**
1. Log in to your [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key or copy your existing one
3. Add it to your production environment variables:
   ```bash
   RESEND_API_KEY=re_your_actual_api_key_here
   ```
4. Restart your application

### Issue 2: Missing RESEND_FROM_EMAIL

**Error in logs:**
```
Email configuration error: RESEND_FROM_EMAIL not found in environment variables
```

**Solution:**
1. In Resend Dashboard, go to [Domains](https://resend.com/domains)
2. Add and verify your domain (e.g., `yourdomain.com`)
3. Set your from email to use the verified domain:
   ```bash
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
4. Restart your application

**Important:** You cannot use `onboarding@resend.dev` in production. You must use a verified domain.

### Issue 3: Domain Not Verified

**Error in Resend API:**
```
Error: Domain not verified
```

**Solution:**
1. Go to [Resend Domains](https://resend.com/domains)
2. Click on your domain
3. Add the required DNS records (SPF, DKIM, DMARC) to your domain DNS settings
4. Wait for DNS propagation (can take up to 48 hours, usually much faster)
5. Click "Verify" in the Resend dashboard

### Issue 4: Invalid API Key

**Error in logs:**
```
Resend API returned an error: Invalid API key
```

**Solution:**
1. The API key might be expired or revoked
2. Generate a new API key from [Resend Dashboard](https://resend.com/api-keys)
3. Update your environment variable with the new key
4. Restart your application

### Issue 5: Rate Limiting

**Error in Resend API:**
```
Error: Too many requests
```

**Solution:**
1. Check your Resend plan limits
2. Consider upgrading if you need higher limits
3. Implement request throttling on your end if needed

## 📋 Production Deployment Checklist

Before deploying to production, ensure:

- [ ] `RESEND_API_KEY` is set in production environment
- [ ] `RESEND_FROM_EMAIL` is set in production environment
- [ ] Your domain is added and verified in Resend
- [ ] DNS records (SPF, DKIM, DMARC) are properly configured
- [ ] API key has the correct permissions
- [ ] You've tested sending an email in your staging environment
- [ ] Logs are being monitored for email errors

## 🧪 Testing Email in Production

### Method 1: Using the API

Test password reset email:

```bash
curl -X POST https://your-api-domain.com/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

Check the logs for:
```
Password reset email sent successfully
```

### Method 2: Check Resend Dashboard

1. Go to [Resend Emails](https://resend.com/emails)
2. You should see your sent emails listed
3. Check the status: Delivered, Bounced, etc.

## 🔐 Environment Variables Reference

Required environment variables for email:

```bash
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_your_actual_api_key_here

# From email address (must use a verified domain)
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 🚨 Emergency: Temporary Disable Email

If you need to temporarily disable email sending without breaking your app:

1. The app will gracefully handle missing email configuration
2. Password reset requests will return success but won't send emails
3. Errors will be logged but won't crash the application

To fully restore:
1. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
2. Restart the application

## 📊 Monitoring

Set up monitoring for:
- Email delivery success/failure rates
- Resend API errors in your logs
- Health endpoint email status

Example monitoring query:
```bash
# Count email failures in the last hour
grep "Failed to send password reset email" logs/error.log | \
  grep "$(date -u +%Y-%m-%d)" | \
  tail -100
```

## 🆘 Still Having Issues?

1. Check your application logs: `logs/error.log` and `logs/all.log`
2. Check Resend Dashboard > Emails for delivery status
3. Verify your DNS records are properly configured
4. Ensure your API key hasn't expired
5. Check if you've hit your plan's sending limits

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/home)
- [DNS Verification Guide](https://resend.com/docs/send-with-smtp)

---

**Last Updated:** 2024-01-22


