# Authentication API Documentation

The Authentication API provides user registration, login, token management, and account deletion functionality for The Royal Barber application.

## 🔐 Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register a new user | No |
| POST | `/auth/signin` | User login | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | No |
| DELETE | `/auth/delete-account` | Delete user account | Yes |

## 📝 User Registration

### POST `/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```

**Field Validation:**
- `email`: Valid email format, unique in system
- `password`: Minimum 6 characters
- `firstName`: 1-50 characters, required
- `lastName`: 1-50 characters, required
- `phone`: Valid phone number format (+1234567890)
- `role`: One of `customer`, `staff`, `admin`

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "isAdmin": false,
      "role": "customer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "token": "jwt-access-token",
      "refreshToken": "jwt-refresh-token"
    }
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists

## 🔑 User Login

### POST `/auth/signin`

Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Field Validation:**
- `email`: Valid email format
- `password`: Non-empty string

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer"
    },
    "tokens": {
      "token": "jwt-access-token",
      "refreshToken": "jwt-refresh-token"
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials

## 🔄 Token Refresh

### POST `/auth/refresh`

Refresh an expired access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Field Validation:**
- `refreshToken`: Non-empty string, valid JWT format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  },
  "message": "Token refreshed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid refresh token
- `401 Unauthorized`: Invalid or expired refresh token

## 🚪 User Logout

### POST `/auth/logout`

Logout user by invalidating refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Field Validation:**
- `refreshToken`: Non-empty string

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid refresh token

## 🗑️ Account Deletion

### DELETE `/auth/delete-account`

Delete the authenticated user's account.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Account deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `500 Internal Server Error`: Database error

## 🔐 Token Details

### Access Token
- **Algorithm**: HS256
- **Expiration**: 7 days
- **Payload**:
  ```json
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "customer|staff|admin",
    "isAdmin": false
  }
  ```

### Refresh Token
- **Algorithm**: HS256
- **Expiration**: 30 days
- **Payload**:
  ```json
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "type": "refresh"
  }
  ```

## 🛡️ Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 10
- Minimum 6 characters required
- Passwords are never returned in API responses

### Token Security
- JWT tokens are signed with environment-specific secrets
- Refresh tokens are validated against database
- Tokens include user role and admin status
- Automatic token expiration prevents long-term access

### Rate Limiting
- Authentication endpoints are rate-limited to 5 requests per minute
- Prevents brute force attacks

## 📱 Mobile App Integration

### Token Storage
Store tokens securely in mobile app:
- Access token: Use for API requests
- Refresh token: Use to get new access tokens
- Clear tokens on logout

### Automatic Token Refresh
Implement automatic token refresh when access token expires:
1. Catch 401 responses
2. Use refresh token to get new access token
3. Retry original request with new token
4. If refresh fails, redirect to login

### Example Usage
```javascript
// Login
const response = await fetch('/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data } = await response.json();
// Store tokens securely
localStorage.setItem('accessToken', data.tokens.token);
localStorage.setItem('refreshToken', data.tokens.refreshToken);

// Use access token for API requests
const apiResponse = await fetch('/users/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});
```

## 🚨 Error Handling

### Common Error Codes
- `400`: Invalid input data (validation errors)
- `401`: Authentication failed
- `409`: Resource conflict (email already exists)
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

### Environment Variables
```env
JWT_SECRET=your-secret-key
REFRESH_SECRET=your-refresh-secret-key
```

### Testing
Use the provided test files to verify authentication functionality:
- `tests/api.test.ts` - General API tests
- `tests/test-endpoints.js` - Endpoint-specific tests

### Database Schema
Users are stored in the `users` table with the following structure:
- `id`: UUID primary key
- `email`: Unique email address
- `password`: Bcrypt-hashed password
- `firstName`, `lastName`: User names
- `phone`: Phone number
- `role`: User role (customer/staff)
- `isAdmin`: Boolean admin flag
- `refreshToken`: Stored refresh token
- `createdAt`, `updatedAt`: Timestamps 