# Payment Workflow Documentation

This document explains the complete payment workflow for The Royal Barber application, including the automatic appointment confirmation system.

## 🔄 Complete Payment Workflow

### Overview

The payment workflow is designed to provide a seamless experience where customers can book appointments and make payments in a single flow, with automatic appointment confirmation upon successful payment.

### Step-by-Step Process

#### 1. **Service Selection & Checkout Initiation**
```javascript
// Customer selects service and appointment details
const checkoutData = {
  serviceId: "uuid",
  paymentType: "full", // or "advance"
  successUrl: "https://app.example.com/success",
  cancelUrl: "https://app.example.com/cancel",
  appointmentData: {
    barberId: "uuid",
    appointmentDate: "30/06/2025",
    timeSlot: "10:00",
    notes: "Optional notes"
  }
};

// Create Stripe checkout session
const response = await fetch('/payments/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(checkoutData)
});
```

#### 2. **Stripe Checkout Session Creation**
- System validates service and appointment data
- Creates Stripe checkout session with appointment metadata
- Returns checkout URL to redirect customer

#### 3. **Customer Payment Processing**
- Customer is redirected to Stripe checkout page
- Completes payment using their preferred method
- Stripe processes the payment securely

#### 4. **Webhook Event Processing**
When payment is successful, Stripe sends a `checkout.session.completed` webhook:

```javascript
// Webhook automatically processes the event
POST /payments/webhook
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "amount_total": 2500,
      "metadata": {
        "serviceId": "uuid",
        "barberId": "uuid",
        "appointmentDate": "30/06/2025",
        "timeSlot": "10:00",
        "userId": "uuid"
      }
    }
  }
}
```

#### 5. **Automatic Appointment Creation**
The webhook handler automatically:

1. **Creates Payment Record**:
   ```sql
   INSERT INTO payments (
     amount, payment_method, status, transaction_id
   ) VALUES (
     '25.00', 'stripe', 'completed', 'cs_test_123'
   );
   ```

2. **Creates Confirmed Appointment**:
   ```sql
   INSERT INTO appointments (
     user_id, barber_id, service_id, appointment_date, 
     time_slot, status, notes
   ) VALUES (
     'uuid', 'uuid', 'uuid', '2025-06-30', 
     '10:00', 'confirmed', 'Optional notes'
   );
   ```

3. **Links Payment to Appointment**:
   ```sql
   UPDATE payments 
   SET appointment_id = 'appointment_uuid' 
   WHERE transaction_id = 'cs_test_123';
   ```

4. **Updates Availability**:
   - Time slot is marked as booked
   - Real-time availability update

#### 6. **Customer Confirmation**
- Customer receives immediate confirmation
- Appointment status is "confirmed" (not "pending")
- Payment and appointment are automatically linked

## 🎯 Key Features

### ✅ Automatic Confirmation
- **No Manual Approval**: Appointments are confirmed immediately upon payment
- **Instant Status**: Status is set to "confirmed" instead of "pending"
- **Seamless Experience**: Customer gets immediate confirmation

### ✅ Real-time Updates
- **Instant Booking**: Time slots are booked immediately
- **Availability Sync**: Real-time availability updates
- **No Conflicts**: Prevents double-booking

### ✅ Complete Integration
- **Payment-Appointment Link**: Automatic linking of payment and appointment
- **Metadata Preservation**: All appointment details preserved
- **Audit Trail**: Complete transaction history

### ✅ Error Handling
- **Failed Payments**: No appointment created if payment fails
- **Webhook Retry**: Stripe handles webhook delivery
- **Graceful Degradation**: System continues working even if webhook fails

## 🧪 Testing the Workflow

### Development Testing
Use the test webhook endpoint for development:

```bash
# Test the complete workflow
curl -X POST http://localhost:3001/payments/test-webhook \
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

### Production Testing
1. Use Stripe test mode for safe testing
2. Configure webhook endpoint in Stripe dashboard
3. Test with real webhook events
4. Verify appointment creation and confirmation

## 🔧 Configuration

### Environment Variables
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Internal API
INTERNAL_API_SECRET=your-secret

# Environment
NODE_ENV=development
```

### Webhook Configuration
- **Development**: Signature verification disabled for testing
- **Production**: Full signature verification required
- **Endpoint**: `/payments/webhook`
- **Events**: `checkout.session.completed`

## 📊 Business Logic

### Payment Types
- **Full Payment**: Complete payment for service
- **Advance Payment**: Partial payment (typically 50%)

### Appointment Status Flow
- **Manual Creation**: `pending` → `confirmed` (staff approval)
- **Payment Creation**: `confirmed` (automatic, no approval)

### Availability Management
- **Pre-booking Check**: Validates availability before checkout
- **Real-time Update**: Marks slot as booked immediately
- **Conflict Prevention**: Prevents double-booking

## 🛡️ Security Considerations

### Webhook Security
- **Signature Verification**: Validates webhook authenticity
- **Event Validation**: Ensures event type is expected
- **Error Handling**: Graceful handling of invalid events

### Data Protection
- **No Sensitive Data**: Payment data handled by Stripe
- **Metadata Encryption**: Sensitive data in metadata
- **Audit Logging**: Complete transaction logging

### Access Control
- **Public Endpoints**: Checkout and webhook are public
- **Internal Validation**: Server-side validation of all data
- **Role-based Access**: Appointment management requires proper roles

## 🚨 Error Scenarios

### Payment Failures
- **Declined Card**: No appointment created
- **Insufficient Funds**: Payment fails, no booking
- **Network Issues**: Stripe handles retries

### Webhook Failures
- **Delivery Failure**: Stripe retries automatically
- **Processing Error**: Logged for manual review
- **Invalid Data**: Graceful error handling

### System Failures
- **Database Issues**: Transaction rollback
- **Service Unavailable**: Stripe handles retries
- **Partial Failures**: Atomic operations prevent inconsistencies

## 📈 Monitoring & Analytics

### Key Metrics
- **Payment Success Rate**: Track successful payments
- **Webhook Delivery**: Monitor webhook reliability
- **Appointment Creation**: Track automatic confirmations
- **Error Rates**: Monitor system health

### Logging
- **Payment Events**: Log all payment activities
- **Webhook Processing**: Track webhook handling
- **Appointment Creation**: Log automatic confirmations
- **Error Tracking**: Monitor and alert on failures

## 🔄 Integration Points

### Frontend Integration
- **Checkout Flow**: Seamless payment experience
- **Status Updates**: Real-time appointment status
- **Confirmation**: Immediate booking confirmation

### Backend Integration
- **Database**: Atomic transactions
- **Stripe API**: Secure payment processing
- **Webhook System**: Event-driven architecture

### Third-party Integration
- **Stripe**: Payment processing and webhooks
- **Email Service**: Confirmation notifications
- **SMS Service**: Appointment reminders

This workflow ensures a smooth, automated experience where customers can book and pay for appointments in a single flow, with immediate confirmation and real-time availability updates. 