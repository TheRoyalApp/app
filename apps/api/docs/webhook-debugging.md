# Webhook Debugging Guide

This guide helps you identify and fix issues with the Stripe webhook that prevent appointments from being saved to the database after payment finalization.

## 🔍 Common Issues

### 1. **Webhook Not Receiving Events**
- **Symptoms**: Payment shows on Stripe but no webhook logs
- **Causes**: 
  - Webhook endpoint not configured in Stripe dashboard
  - Incorrect webhook URL
  - Webhook disabled or inactive

### 2. **Webhook Receiving Events But Not Processing**
- **Symptoms**: Webhook logs show events but no appointment creation
- **Causes**:
  - Missing or invalid metadata
  - Database connection issues
  - Validation errors

### 3. **Appointment Creation Failing**
- **Symptoms**: Payment created but appointment not saved
- **Causes**:
  - Invalid user/barber/service IDs
  - Date format issues
  - Database constraints

## 🛠️ Debugging Steps

### Step 1: Check Webhook Configuration

1. **Verify Webhook Endpoint in Stripe Dashboard**:
   ```
   URL: https://your-domain.com/payments/webhook
   Events: checkout.session.completed
   ```

2. **Check Webhook Status**:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Verify webhook is active and receiving events
   - Check for failed webhook attempts

### Step 2: Test Webhook Locally

Use the test webhook endpoint to verify functionality:

```bash
# Test with sample data
curl -X POST http://localhost:3000/payments/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cs_test_123",
    "serviceId": "your-service-uuid",
    "paymentType": "full",
    "userId": "your-user-uuid",
    "barberId": "your-barber-uuid",
    "appointmentDate": "30/06/2025",
    "timeSlot": "10:00",
    "notes": "Test appointment",
    "amount": 2500
  }'
```

### Step 3: Check Logs

Look for these log messages in your application:

```javascript
// Successful processing
✅ Processing checkout.session.completed event
✅ Payment created with ID: uuid
✅ Appointment created successfully with ID: uuid
✅ Payment uuid linked to appointment uuid

// Error indicators
❌ Error processing webhook
❌ User not found: uuid
❌ Invalid date format: 30-06-2025
```

### Step 4: Verify Metadata

Check that the Stripe checkout session includes all required metadata:

```javascript
// Required metadata for appointment creation
{
  serviceId: "uuid",
  paymentType: "full|advance",
  userId: "uuid",
  barberId: "uuid", 
  appointmentDate: "dd/mm/yyyy",
  timeSlot: "HH:MM",
  notes: "optional"
}
```

### Step 5: Database Validation

Verify that all referenced entities exist:

```sql
-- Check if user exists
SELECT * FROM users WHERE id = 'user-uuid';

-- Check if barber exists  
SELECT * FROM users WHERE id = 'barber-uuid';

-- Check if service exists
SELECT * FROM services WHERE id = 'service-uuid';
```

## 🔧 Fixes Applied

### 1. **Enhanced Error Handling**
- Added comprehensive logging for debugging
- Proper error responses to trigger Stripe retries
- Detailed error messages with context

### 2. **Database Transaction**
- Wrapped payment and appointment creation in a transaction
- Ensures both succeed or both fail
- Prevents orphaned payments without appointments

### 3. **Validation Improvements**
- Validates all required entities exist before creating appointment
- Proper date format validation
- Better error messages for debugging

### 4. **Logging Enhancements**
- Added structured logging with emojis for easy identification
- Logs all metadata extraction
- Tracks each step of the process

## 🧪 Testing

### Run the Test Script

```bash
cd apps/api
bun run tests/test-webhook-appointment.js
```

### Manual Testing

1. **Create a test payment**:
   ```bash
   curl -X POST http://localhost:3000/payments/test-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "cs_test_123",
       "serviceId": "actual-service-uuid",
       "paymentType": "full", 
       "userId": "actual-user-uuid",
       "barberId": "actual-barber-uuid",
       "appointmentDate": "30/06/2025",
       "timeSlot": "10:00",
       "amount": 2500
     }'
   ```

2. **Check the response**:
   - Should return 200 status
   - Should include both payment and appointment data
   - Payment should be linked to appointment

### Production Testing

1. **Use Stripe Test Mode**:
   - Create test payments in Stripe dashboard
   - Monitor webhook delivery in Stripe dashboard
   - Check application logs for processing

2. **Verify Database**:
   ```sql
   -- Check payments table
   SELECT * FROM payments WHERE transaction_id = 'cs_test_123';
   
   -- Check appointments table
   SELECT * FROM appointments WHERE id = 'appointment-uuid';
   
   -- Verify linkage
   SELECT p.*, a.* 
   FROM payments p 
   JOIN appointments a ON p.appointment_id = a.id 
   WHERE p.transaction_id = 'cs_test_123';
   ```

## 🚨 Troubleshooting

### Issue: "User not found"
**Solution**: Verify the user ID in the metadata matches an existing user in the database.

### Issue: "Invalid date format"  
**Solution**: Ensure appointment date is in `dd/mm/yyyy` format (e.g., "30/06/2025").

### Issue: "Service not found"
**Solution**: Verify the service ID exists and is active in the services table.

### Issue: Webhook not receiving events
**Solution**: 
1. Check webhook URL in Stripe dashboard
2. Verify webhook is active
3. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/payments/webhook`

### Issue: Database connection errors
**Solution**:
1. Check database connection string
2. Verify database is running
3. Check for connection pool issues

## 📊 Monitoring

### Key Metrics to Monitor

1. **Webhook Success Rate**: Should be > 95%
2. **Appointment Creation Rate**: Should match payment success rate
3. **Error Types**: Track common error patterns
4. **Response Times**: Should be < 5 seconds

### Log Analysis

Look for these patterns in logs:

```bash
# Successful processing
grep "✅ Appointment created" logs/app.log

# Error patterns  
grep "❌ Error processing webhook" logs/app.log
grep "User not found" logs/app.log
grep "Invalid date format" logs/app.log
```

## 🔄 Recovery

### Failed Webhook Recovery

If webhooks fail, Stripe will retry automatically. For manual recovery:

1. **Check failed webhooks** in Stripe dashboard
2. **Manually trigger** using the test webhook endpoint
3. **Verify data integrity** in database

### Data Consistency

If payments exist without appointments:

```sql
-- Find orphaned payments
SELECT p.* 
FROM payments p 
WHERE p.appointment_id IS NULL 
AND p.status = 'completed';

-- Create missing appointments manually if needed
```

## 📞 Support

If issues persist:

1. Check application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with the provided test scripts
4. Review Stripe webhook dashboard for delivery status 