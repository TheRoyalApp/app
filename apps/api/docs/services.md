# Services API Documentation

The Services API manages the barbershop's service catalog, including service creation, pricing, duration, and Stripe payment integration for The Royal Barber application.

## 💇‍♂️ Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/services` | List all services | No | None |
| GET | `/services/:id` | Get service by ID | No | None |
| POST | `/services` | Create new service | Yes | Staff/Admin |
| PUT | `/services/:id` | Update service | Yes | Staff/Admin |
| DELETE | `/services/:id` | Delete service | Yes | Staff/Admin |

## 📋 List All Services

### GET `/services`

Retrieve a list of all active services in the catalog. No authentication required.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Classic Haircut",
      "description": "Traditional men's haircut with wash and style",
      "price": "25.00",
      "duration": 30,
      "isActive": true,
      "stripeProductId": "prod_1234567890",
      "stripePriceId": "price_1234567890",
      "stripeAdvancePriceId": "price_0987654321",
      "stripeCurrency": "mxn",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Services retrieved successfully"
}
```

**Error Responses:**
- `404 Not Found`: No services found
- `500 Internal Server Error`: Database error

## 👤 Get Service by ID

### GET `/services/:id`

Retrieve a specific service by its ID. No authentication required.

**Path Parameters:**
- `id`: Service UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Classic Haircut",
    "description": "Traditional men's haircut with wash and style",
    "price": "25.00",
    "duration": 30,
    "isActive": true,
    "stripeProductId": "prod_1234567890",
    "stripePriceId": "price_1234567890",
    "stripeAdvancePriceId": "price_0987654321",
    "stripeCurrency": "mxn",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Service retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing service ID
- `404 Not Found`: Service not found
- `500 Internal Server Error`: Database error

## ➕ Create New Service

### POST `/services`

Create a new service in the catalog. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Request Body:**
```json
{
  "name": "Premium Beard Trim",
  "description": "Professional beard trimming and shaping",
  "price": 35.00,
  "duration": 45
}
```

**Field Validation:**
- `name`: 1-100 characters, required
- `description`: Maximum 500 characters, optional
- `price`: Positive number, maximum 10,000, required
- `duration`: Positive integer, maximum 480 minutes (8 hours), required

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Premium Beard Trim",
    "description": "Professional beard trimming and shaping",
    "price": "35.00",
    "duration": 45,
    "isActive": true,
    "stripeProductId": null,
    "stripePriceId": null,
    "stripeAdvancePriceId": null,
    "stripeCurrency": "mxn",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Service created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing required fields
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `500 Internal Server Error`: Database error

## ✏️ Update Service

### PUT `/services/:id`

Update an existing service. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: Service UUID

**Request Body:**
```json
{
  "name": "Updated Service Name",
  "description": "Updated service description",
  "price": 40.00,
  "duration": 60,
  "isActive": true
}
```

**Field Validation:**
- `name`: 1-100 characters, optional
- `description`: Maximum 500 characters, optional
- `price`: Positive number, maximum 10,000, optional
- `duration`: Positive integer, maximum 480 minutes, optional
- `isActive`: Boolean, optional

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Service Name",
    "description": "Updated service description",
    "price": "40.00",
    "duration": 60,
    "isActive": true,
    "stripeProductId": "prod_1234567890",
    "stripePriceId": "price_1234567890",
    "stripeAdvancePriceId": "price_0987654321",
    "stripeCurrency": "mxn",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Service updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing service ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: Service not found
- `500 Internal Server Error`: Database error

## 🗑️ Delete Service

### DELETE `/services/:id`

Delete a service from the catalog. Staff or admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: Service UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Service deleted successfully"
  },
  "message": "Service deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing service ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not staff or admin)
- `404 Not Found`: Service not found
- `500 Internal Server Error`: Database error

## 💳 Stripe Integration

### Payment Types

The service supports two payment types:

1. **Full Payment**: Complete payment for the service
   - Uses `stripePriceId` for payment processing
   - Standard pricing

2. **Advance Payment**: Partial payment to reserve the appointment
   - Uses `stripeAdvancePriceId` for payment processing
   - Typically 50% of the full price

### Stripe Fields

| Field | Description | Usage |
|-------|-------------|-------|
| `stripeProductId` | Stripe product identifier | Links service to Stripe product |
| `stripePriceId` | Full payment price ID | Used for complete payment |
| `stripeAdvancePriceId` | Advance payment price ID | Used for partial payment |
| `stripeCurrency` | Payment currency | Default: "mxn" |

### Setting Up Stripe Products

To enable payments for a service:

1. Create a Stripe product for the service
2. Create two price points:
   - Full price for complete payment
   - Advance price for partial payment
3. Update the service with Stripe IDs

**Example Stripe Setup:**
```javascript
// Create Stripe product
const product = await stripe.products.create({
  name: 'Classic Haircut',
  description: 'Traditional men\'s haircut with wash and style'
});

// Create full price
const fullPrice = await stripe.prices.create({
  product: product.id,
  unit_amount: 2500, // $25.00 in cents
  currency: 'mxn'
});

// Create advance price
const advancePrice = await stripe.prices.create({
  product: product.id,
  unit_amount: 1250, // $12.50 in cents
  currency: 'mxn'
});

// Update service with Stripe IDs
const updatedService = await updateService(serviceId, {
  stripeProductId: product.id,
  stripePriceId: fullPrice.id,
  stripeAdvancePriceId: advancePrice.id
});
```

## 📱 Mobile App Integration

### Service Catalog
```javascript
// Get all services
const getServices = async () => {
  const response = await fetch('/services');
  return response.json();
};

// Get specific service
const getService = async (serviceId) => {
  const response = await fetch(`/services/${serviceId}`);
  return response.json();
};
```

### Admin Functions
```javascript
// Create new service (staff/admin only)
const createService = async (serviceData) => {
  const response = await fetch('/services', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(serviceData)
  });
  return response.json();
};

// Update service (staff/admin only)
const updateService = async (serviceId, updateData) => {
  const response = await fetch(`/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  return response.json();
};
```

## 🛡️ Security Features

### Authentication
- Public endpoints for viewing services
- Staff/admin authentication for management operations
- Role-based access control

### Data Validation
- Input validation with Zod schemas
- Price and duration limits
- Character limits on text fields

### Business Logic
- Services can be deactivated without deletion
- Price validation prevents negative values
- Duration limits prevent unrealistic bookings

## 🚨 Error Handling

### Common Error Codes
- `400`: Invalid input data or missing parameters
- `401`: Authentication failed
- `403`: Insufficient permissions
- `404`: Service not found
- `500`: Internal server error

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

## 🔧 Development Notes

### Database Schema
Services are stored in the `services` table:
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  stripe_advance_price_id TEXT,
  stripe_currency TEXT DEFAULT 'mxn',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables
```env
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### Testing
Test service management functionality:
- `tests/api.test.ts` - General API tests
- `tests/test-endpoints.js` - Endpoint-specific tests
- Verify CRUD operations
- Test permission boundaries

## 📊 Performance Considerations

### Caching
- Service catalog can be cached for public access
- Implement cache invalidation on service updates
- Consider Redis for frequently accessed data

### Database Indexing
- Index on `is_active` for filtering active services
- Index on `name` for search functionality
- Index on `price` for price-based queries

### API Optimization
- Public endpoints don't require authentication
- Minimal data transfer for public service list
- Efficient database queries with proper indexing

## 💡 Best Practices

### Service Management
- Use descriptive service names
- Provide clear descriptions for customers
- Set realistic durations for scheduling
- Keep prices competitive and updated

### Stripe Integration
- Test payment flows in Stripe test mode
- Monitor payment success rates
- Keep Stripe product names in sync with service names
- Implement webhook handling for payment events

### Data Integrity
- Validate all input data
- Maintain referential integrity with appointments
- Archive rather than delete services with booking history
- Regular backup of service catalog 