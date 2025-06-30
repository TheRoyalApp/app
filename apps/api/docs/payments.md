# Payments API Documentation

The Payments API manages payment processing and transactions for The Royal Barber application, including Stripe integration, payment tracking, and checkout flows.

## 💳 Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/payments` | Create payment record | No | None |
| PUT | `/payments/:id` | Update payment | No | None |
| GET | `/payments/:id` | Get payment by ID | No | None |
| GET | `/payments/transaction/:transactionId` | Get payment by transaction ID | No | None |
| GET | `/payments/user/:userId` | Get user payments | No | None |
| POST | `/payments/checkout` | Create Stripe checkout session | No | None |
| POST | `/payments/webhook` | Stripe webhook handler | No | None |

## ➕ Create Payment Record

### POST `/payments`

Create a new payment record in the system.

**Request Body:**
```json
{
  "appointmentId": "uuid",
  "amount": "25.00",
  "paymentMethod": "card",
  "status": "pending",
  "transactionId": "txn_1234567890"
}
```

**Field Validation:**
- `appointmentId`: Valid UUID, optional
- `amount`: Positive decimal number, required
- `paymentMethod`: One of `cash`, `card`, `stripe`, required
- `status`: One of `pending`, `completed`, `failed`, required
- `transactionId`: String, optional

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "appointmentId": "uuid",
    "amount": "25.00",
    "paymentMethod": "card",
    "status": "pending",
    "transactionId": "txn_1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Payment created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing required fields
- `500 Internal Server Error`: Database error

## ✏️ Update Payment

### PUT `/payments/:id`

Update an existing payment record.

**Path Parameters:**
- `id`: Payment UUID

**Request Body:**
```json
{
  "status": "completed",
  "transactionId": "txn_updated_123"
}
```

**Field Validation:**
- `amount`: Positive decimal number, optional
- `paymentMethod`: One of `cash`, `card`, `stripe`, optional
- `status`: One of `pending`, `completed`, `failed`, optional
- `transactionId`: String, optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "appointmentId": "uuid",
    "amount": "25.00",
    "paymentMethod": "card",
    "status": "completed",
    "transactionId": "txn_updated_123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Payment updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing payment ID
- `404 Not Found`: Payment not found
- `500 Internal Server Error`: Database error

## 👤 Get Payment by ID

### GET `/payments/:id`

Retrieve a specific payment by its ID.

**Path Parameters:**
- `id`: Payment UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "appointmentId": "uuid",
    "amount": "25.00",
    "paymentMethod": "card",
    "status": "completed",
    "transactionId": "txn_1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Payment retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing payment ID
- `404 Not Found`: Payment not found
- `500 Internal Server Error`: Database error

## 🔍 Get Payment by Transaction ID

### GET `/payments/transaction/:transactionId`

Retrieve a payment by its Stripe transaction ID.

**Path Parameters:**
- `transactionId`: Stripe transaction ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "appointmentId": "uuid",
    "amount": "25.00",
    "paymentMethod": "stripe",
    "status": "completed",
    "transactionId": "txn_1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Payment retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing transaction ID
- `404 Not Found`: Payment not found
- `500 Internal Server Error`: Database error

## 👥 Get User Payments

### GET `/payments/user/:userId`

Retrieve all payments for a specific user.

**Path Parameters:**
- `userId`: User UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "appointmentId": "uuid",
      "amount": "25.00",
      "paymentMethod": "card",
      "status": "completed",
      "transactionId": "txn_1234567890",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "User payments retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing user ID
- `404 Not Found`: No payments found for user
- `500 Internal Server Error`: Database error

## 🛒 Create Stripe Checkout Session

### POST `/payments/checkout`

Create a Stripe checkout session for payment processing.

**Request Body:**
```json
{
  "serviceId": "uuid",
  "paymentType": "full",
  "successUrl": "https://app.example.com/success",
  "cancelUrl": "https://app.example.com/cancel",
  "userId": "uuid",
  "appointmentData": {
    "barberId": "uuid",
    "appointmentDate": "15/01/2024",
    "timeSlot": "10:00",
    "notes": "Please bring reference photos"
  }
}
```

**Field Validation:**
- `serviceId`: Valid UUID, required
- `paymentType`: One of `full`, `advance`, required
- `successUrl`: Valid URL, required
- `cancelUrl`: Valid URL, required
- `userId`: Valid UUID, optional
- `appointmentData`: Object with appointment details, optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  },
  "message": "Checkout session created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing required fields
- `404 Not Found`: Service not found
- `500 Internal Server Error`: Stripe or database error

## 🔔 Stripe Webhook Handler

### POST `/payments/webhook`

Handle Stripe webhook events for payment status updates and automatic appointment creation.

**Headers:**
```
Stripe-Signature: t=timestamp,v1=signature
```

**Request Body:**
Raw Stripe webhook event data

**Development Mode:**
In development environment (`NODE_ENV=development`), the webhook can process events without signature verification for testing purposes.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "received": true
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid webhook signature or missing signature (in production)
- `500 Internal Server Error`: Webhook processing error

### Webhook Event Processing

#### `checkout.session.completed`

When a Stripe checkout session is completed successfully, the webhook automatically:

1. **Creates Payment Record**: Creates a payment record with status "completed"
2. **Creates Appointment**: If appointment data is provided in metadata, creates an appointment with status "confirmed" (not "pending")
3. **Links Payment to Appointment**: Associates the payment with the created appointment
4. **Updates Availability**: The time slot is automatically marked as booked

**Metadata Requirements:**
```json
{
  "serviceId": "uuid",
  "paymentType": "full|advance",
  "userId": "uuid",
  "barberId": "uuid",
  "appointmentDate": "dd/mm/yyyy",
  "timeSlot": "HH:MM",
  "notes": "optional notes"
}
```

**Automatic Process:**
```javascript
// 1. Payment Creation
const payment = await db.insert(payments).values({
  amount: session.amount_total.toString(),
  paymentMethod: 'stripe',
  status: 'completed',
  transactionId: session.id,
});

// 2. Appointment Creation (if metadata provided)
if (barberId && appointmentDate && timeSlot && userId) {
  const appointment = await db.insert(appointments).values({
    userId,
    barberId,
    serviceId,
    appointmentDate: parsedDate,
    timeSlot,
    status: 'confirmed', // Automatically confirmed
    notes,
  });
  
  // 3. Link Payment to Appointment
  await db.update(payments)
    .set({ appointmentId: appointment.id })
    .where(eq(payments.id, payment.id));
}
```

#### Other Events
- `payment_intent.succeeded`: Payment confirmed
- `payment_intent.payment_failed`: Payment failed

## 🧪 Test Webhook Endpoint

### POST `/payments/test-webhook`

Test endpoint to manually trigger payment completion logic for development and testing.

**Request Body:**
```json
{
  "sessionId": "cs_test_123",
  "serviceId": "uuid",
  "paymentType": "full",
  "userId": "uuid",
  "barberId": "uuid",
  "appointmentDate": "30/06/2025",
  "timeSlot": "10:00",
  "notes": "Test appointment",
  "amount": 2500
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "uuid",
      "amount": "25.00",
      "paymentMethod": "stripe",
      "status": "completed",
      "transactionId": "cs_test_123"
    },
    "appointment": {
      "id": "uuid",
      "status": "confirmed",
      "timeSlot": "10:00"
    },
    "message": "Payment and appointment created successfully with confirmed status"
  }
}
```

## 💳 Stripe Integration

### Payment Types

The API supports two payment types:

1. **Full Payment**: Complete payment for the service
   - Uses `stripePriceId` from service
   - Standard pricing
   - Immediate service booking

2. **Advance Payment**: Partial payment to reserve the appointment
   - Uses `stripeAdvancePriceId` from service
   - Typically 50% of the full price
   - Requires additional payment later

### Stripe Configuration

**Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Service Setup:**
Each service must have Stripe product and price IDs configured:
- `stripeProductId`: Links to Stripe product
- `stripePriceId`: Full payment price
- `stripeAdvancePriceId`: Advance payment price

### Checkout Flow

1. **Service Selection**: User selects service and payment type
2. **Checkout Session**: API creates Stripe checkout session with appointment metadata
3. **Payment Processing**: User completes payment on Stripe
4. **Webhook Handling**: Stripe sends webhook with payment status
5. **Automatic Appointment Creation**: System automatically creates appointment with "confirmed" status
6. **Payment-Appointment Linking**: Payment is linked to the created appointment
7. **Availability Update**: Time slot is marked as booked in real-time
8. **Confirmation**: User receives confirmation with confirmed appointment status

**Key Features:**
- ✅ **Automatic Confirmation**: Appointments are created with "confirmed" status (not "pending")
- ✅ **Real-time Updates**: Availability is updated immediately
- ✅ **Complete Integration**: Payment and appointment are automatically linked
- ✅ **Error Handling**: Failed payments don't create appointments

### Webhook Events

The API handles the following Stripe webhook events:
- `checkout.session.completed`: Payment successful
- `payment_intent.succeeded`: Payment confirmed
- `payment_intent.payment_failed`: Payment failed

## 📱 Mobile App Integration

### Payment Processing
```javascript
// Create checkout session
const createCheckout = async (checkoutData) => {
  const response = await fetch('/payments/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(checkoutData)
  });
  return response.json();
};

// Redirect to Stripe checkout
const processPayment = async (serviceId, paymentType, appointmentData) => {
  const checkout = await createCheckout({
    serviceId,
    paymentType,
    successUrl: 'https://app.example.com/success',
    cancelUrl: 'https://app.example.com/cancel',
    appointmentData
  });
  
  // Redirect to Stripe checkout
  window.location.href = checkout.data.url;
};
```

### Payment Tracking
```javascript
// Get user payments
const getUserPayments = async (userId) => {
  const response = await fetch(`/payments/user/${userId}`);
  return response.json();
};

// Get payment by transaction ID
const getPaymentByTransaction = async (transactionId) => {
  const response = await fetch(`/payments/transaction/${transactionId}`);
  return response.json();
};
```

### Payment Management
```javascript
// Create payment record
const createPayment = async (paymentData) => {
  const response = await fetch('/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  return response.json();
};

// Update payment status
const updatePayment = async (paymentId, updateData) => {
  const response = await fetch(`/payments/${paymentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  return response.json();
};
```

## 🛡️ Security Features

### Stripe Security
- Webhook signature verification
- Secure API key management
- PCI compliance through Stripe
- Encrypted payment data

### Data Protection
- No sensitive payment data stored locally
- Stripe handles all payment processing
- Secure webhook handling
- Input validation and sanitization

### Authentication
- Public endpoints for payment processing
- Internal secret for webhook verification
- Secure URL validation for redirects

## 🚨 Error Handling

### Common Error Codes
- `400`: Invalid input data or missing parameters
- `404`: Resource not found
- `500`: Internal server error or Stripe error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field": "validation error details"
  }
}
```

### Stripe Error Handling
```javascript
// Handle Stripe errors
const handleStripeError = (error) => {
  switch (error.type) {
    case 'card_error':
      return { message: error.message, code: 400 };
    case 'validation_error':
      return { message: 'Invalid payment data', code: 400 };
    case 'api_error':
      return { message: 'Payment service error', code: 500 };
    default:
      return { message: 'Unknown error', code: 500 };
  }
};
```

## 🔧 Development Notes

### Database Schema
Payments are stored in the `payments` table:
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
INTERNAL_API_SECRET=your-internal-secret
```

### Testing
Test payment functionality:
- `tests/api.test.ts` - General API tests
- `tests/test-endpoints.js` - Endpoint-specific tests
- Use Stripe test mode for payment testing
- Test webhook handling with test events

## 📊 Performance Considerations

### Caching
- Payment records can be cached for frequently accessed data
- Implement cache invalidation on payment updates
- Consider Redis for payment data

### Database Indexing
- Index on `appointment_id` for appointment-based queries
- Index on `transaction_id` for Stripe transaction lookups
- Index on `status` for status-based filtering
- Index on `created_at` for time-based queries

### API Optimization
- Efficient payment queries with proper joins
- Minimal data transfer for payment lists
- Proper error handling for Stripe API calls

## 💡 Best Practices

### Payment Processing
- Always use Stripe test mode for development
- Implement proper error handling for all payment flows
- Validate webhook signatures
- Handle payment failures gracefully

### Security
- Never store sensitive payment data
- Use HTTPS for all payment endpoints
- Validate all input data
- Implement proper logging for payment events

### User Experience
- Provide clear payment status updates
- Handle payment failures with helpful messages
- Implement proper loading states
- Send confirmation emails for successful payments

### Business Logic
- Track payment status accurately
- Handle partial payments properly
- Implement refund processes
- Maintain payment audit trails

### Stripe Integration
- Test all payment flows thoroughly
- Monitor webhook delivery
- Keep Stripe SDK updated
- Implement proper error recovery 