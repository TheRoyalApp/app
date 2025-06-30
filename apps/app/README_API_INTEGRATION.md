# API Integration Documentation

This document describes the API integration implemented in the Royal Barber mobile app.

## Overview

The app now integrates with the backend API to provide real-time data for:
- User authentication and profile management
- Appointment booking and management
- Service catalog
- Barber availability and scheduling
- Payment processing

## Architecture

### Service Layer Structure

```
services/
├── api.ts                 # Core API client with authentication and error handling
├── auth.service.ts        # Authentication and user management
├── appointments.service.ts # Appointment CRUD operations
├── services.service.ts    # Service catalog management
├── schedules.service.ts   # Barber availability and scheduling
├── payments.service.ts    # Payment processing
└── index.ts              # Service exports
```

### Configuration

```
config/
└── api.ts                # API configuration, endpoints, and settings
```

## API Client Features

### Core Features
- **Automatic Token Management**: Handles JWT access and refresh tokens
- **Request Retry Logic**: Automatically retries failed requests
- **Request Timeouts**: Configurable timeout settings
- **Error Handling**: Comprehensive error handling and user feedback
- **Offline Support**: Secure storage for offline access to user data

### Authentication Flow
1. User logs in/registers
2. Access and refresh tokens are stored securely
3. All subsequent requests include the access token
4. On 401 errors, automatically refresh tokens
5. If refresh fails, redirect to login

## Services

### AuthService
Handles user authentication and profile management.

```typescript
// Login
const response = await AuthService.login({ email, password });

// Register
const response = await AuthService.register({ email, password, name });

// Get current user
const response = await AuthService.getCurrentUser();

// Logout
await AuthService.logout();
```

### AppointmentsService
Manages appointment booking and lifecycle.

```typescript
// Create appointment
const response = await AppointmentsService.createAppointment({
  barberId: '1',
  serviceId: '1',
  appointmentDate: '2024-01-15',
  timeSlot: '14:30'
});

// Get user appointments
const response = await AppointmentsService.getUserAppointments();

// Cancel appointment
const response = await AppointmentsService.cancelAppointment(appointmentId);
```

### ServicesService
Manages the service catalog.

```typescript
// Get all active services
const response = await ServicesService.getActiveServices();

// Get service by ID
const response = await ServicesService.getServiceById(serviceId);
```

### SchedulesService
Handles barber availability and scheduling.

```typescript
// Get availability for a specific date
const response = await SchedulesService.getAvailability(barberId, date);

// Get barber schedules
const response = await SchedulesService.getBarberSchedules(barberId);
```

### PaymentsService
Manages payment processing and history.

```typescript
// Create payment
const response = await PaymentsService.createPayment({
  appointmentId: '1',
  amount: 2500, // in cents
  paymentMethod: 'stripe'
});

// Get payment history
const response = await PaymentsService.getUserPayments();
```

## Configuration

### Environment Setup

The app automatically detects the environment and uses the appropriate API URL:

- **Development**: `http://localhost:8080`
- **Production**: Configure in `config/api.ts`

### API Configuration

Edit `config/api.ts` to customize:

```typescript
export const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8080',
  },
  production: {
    baseURL: 'https://your-api-domain.com',
  },
};
```

### Timeouts and Retry Settings

```typescript
export const API_TIMEOUTS = {
  request: 10000, // 10 seconds
  upload: 30000,  // 30 seconds
};

export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
};
```

## Error Handling

### API Response Format

All API responses follow this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Error Types

- **Network Errors**: Connection issues, timeouts
- **Authentication Errors**: Invalid/expired tokens
- **Validation Errors**: Invalid input data
- **Server Errors**: Backend processing errors

### Error Handling in Components

```typescript
const response = await AuthService.login(credentials);

if (response.success && response.data) {
  // Handle success
  setUser(response.data.user);
} else {
  // Handle error
  Alert.alert('Error', response.error || 'Login failed');
}
```

## Security Features

### Token Storage
- Access and refresh tokens stored in Expo SecureStore
- Automatic token refresh on 401 errors
- Secure token cleanup on logout

### Request Security
- All authenticated requests include Bearer token
- HTTPS enforced in production
- Request timeouts prevent hanging requests

## Usage Examples

### Complete Appointment Booking Flow

```typescript
// 1. Load services
const servicesResponse = await ServicesService.getActiveServices();
const services = servicesResponse.data || [];

// 2. Check availability
const availabilityResponse = await SchedulesService.getAvailability(
  barberId, 
  selectedDate
);
const availableSlots = availabilityResponse.data?.availableSlots || [];

// 3. Create appointment
const appointmentResponse = await AppointmentsService.createAppointment({
  barberId,
  serviceId: selectedService.id,
  appointmentDate: selectedDate,
  timeSlot: selectedTime
});

// 4. Process payment
if (appointmentResponse.success) {
  const paymentResponse = await PaymentsService.createPayment({
    appointmentId: appointmentResponse.data.id,
    amount: selectedService.price,
    paymentMethod: 'stripe'
  });
}
```

### User Profile Management

```typescript
// Get current user
const userResponse = await AuthService.getCurrentUser();
if (userResponse.success) {
  setUser(userResponse.data);
}

// Update profile
const updateResponse = await AuthService.updateProfile({
  name: 'New Name',
  email: 'newemail@example.com'
});
```

## Testing

### API Testing
- Use the test scripts in the API directory
- Test all endpoints with various scenarios
- Verify error handling and edge cases

### App Testing
- Test authentication flow
- Test appointment booking
- Test offline scenarios
- Test error handling

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API server is running
   - Verify API URL in config
   - Check network connectivity

2. **Authentication Errors**
   - Clear stored tokens
   - Re-login user
   - Check token expiration

3. **Appointment Booking Fails**
   - Verify barber availability
   - Check service exists
   - Validate appointment data

### Debug Mode

Enable debug logging by checking console output for:
- API request/response logs
- Error details
- Token refresh attempts

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live updates
- **Offline Mode**: Enhanced offline functionality
- **Push Notifications**: Appointment reminders
- **Analytics**: Usage tracking and insights

### Performance Optimizations
- **Request Caching**: Cache frequently accessed data
- **Image Optimization**: Optimize service images
- **Lazy Loading**: Load data on demand

## Support

For API integration issues:
1. Check the API documentation
2. Review error logs
3. Test API endpoints directly
4. Contact the development team 