# The Royal Barber API Documentation

Welcome to the comprehensive API documentation for The Royal Barber application. This API provides a complete solution for managing a barbershop business, including user management, services, scheduling, appointments, and payments.

## 🚀 Quick Start

- **Base URL**: `http://localhost:8080` (development)
- **Health Check**: `GET /health`
- **API Info**: `GET /`

## 📚 Feature Documentation

### 🔐 Authentication & Authorization
- [Authentication API](./auth.md) - User registration, login, token management
- [User Management](./users.md) - User CRUD operations and profile management

### 💇‍♂️ Business Operations
- [Services Management](./services.md) - Service catalog and pricing
- [Schedule Management](./schedules.md) - Barber availability and scheduling
- [Appointments](./appointments.md) - Booking and appointment management
- [Payments](./payments.md) - Payment processing and transactions

## 🔧 Technical Details

### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Rate Limiting
- **General API**: 100 requests per minute
- **Authentication**: 5 requests per minute
- **Appointments**: 10 requests per minute

### CORS
The API is configured for mobile app integration with the following origins:
- `exp://localhost:8081`
- `exp://localhost:19000`
- `exp://192.168.1.*:8081`
- `exp://192.168.1.*:19000`
- `http://localhost:3000`
- `http://localhost:8081`

## 🛠️ Development

### Environment Variables
```env
JWT_SECRET=your-secret-key
REFRESH_SECRET=your-refresh-secret-key
STRIPE_SECRET_KEY=your-stripe-secret-key
INTERNAL_API_SECRET=your-internal-secret
NODE_ENV=development
PORT=8080
```

### Database
The API uses PostgreSQL with Drizzle ORM. Run migrations to set up the database schema.

### Testing
Use the provided test suites in the `/tests` directory to verify API functionality.

## 📱 Mobile App Integration

This API is specifically designed for mobile app integration with:
- JWT-based authentication
- Refresh token support
- Optimized response formats
- Mobile-friendly CORS configuration
- Rate limiting for mobile usage patterns

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation with Zod
- Secure headers
- Request logging
- Error handling without exposing internals

## 📊 Monitoring

- Request timing middleware
- Winston logging
- Health check endpoint
- Error tracking
- Performance monitoring

For detailed information about each feature, please refer to the individual documentation files linked above. 