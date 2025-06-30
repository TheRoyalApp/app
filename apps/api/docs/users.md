# Users API Documentation

The Users API provides comprehensive user management functionality for The Royal Barber application, including user profiles, role-based access control, and administrative operations.

## 👥 Endpoints Overview

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/users/all` | Get all users | Yes | Admin |
| GET | `/users/:id` | Get user by ID | Yes | Any |
| POST | `/users/new` | Create new user | Yes | Admin |
| PUT | `/users/:id` | Update user profile | Yes | Owner/Admin |
| DELETE | `/users/:id` | Delete user | Yes | Admin |

## 📋 Get All Users

### GET `/users/all`

Retrieve a list of all users in the system. Admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "isAdmin": false,
      "role": "customer",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not admin)
- `404 Not Found`: No users found
- `500 Internal Server Error`: Database error

## 👤 Get User by ID

### GET `/users/:id`

Retrieve a specific user's profile by their ID. Users can view their own profile, admins can view any profile.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: User UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
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
  "message": "User retrieved successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing user ID
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

## ➕ Create New User

### POST `/users/new`

Create a new user account. Admin access required.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "role": "staff"
}
```

**Field Validation:**
- `email`: Valid email format, unique in system
- `password`: Minimum 6 characters
- `firstName`: 1-50 characters, required
- `lastName`: 1-50 characters, required
- `phone`: Valid phone number format
- `role`: One of `customer`, `staff`, `admin`

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1234567890",
    "isAdmin": false,
    "role": "staff",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing fields
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not admin)
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Database error

## ✏️ Update User Profile

### PUT `/users/:id`

Update a user's profile information. Users can update their own profile, admins can update any profile.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: User UUID

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+1987654321"
}
```

**Field Validation:**
- `firstName`: 1-50 characters, optional
- `lastName`: 1-50 characters, optional
- `phone`: Valid phone number format, optional
- `email`: Valid email format, unique, optional
- `role`: One of `customer`, `staff`, `admin`, optional (admin only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Updated",
    "lastName": "Name",
    "phone": "+1987654321",
    "isAdmin": false,
    "role": "customer",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data or missing user ID
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not owner or admin)
- `404 Not Found`: User not found
- `409 Conflict`: Email already exists (if updating email)
- `500 Internal Server Error`: Database error

## 🗑️ Delete User

### DELETE `/users/:id`

Delete a user account. Admin access required. Admins cannot delete their own account.

**Headers:**
```
Authorization: Bearer <jwt-access-token>
```

**Path Parameters:**
- `id`: User UUID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  },
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Missing user ID or attempting to delete own account
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Insufficient permissions (not admin)
- `404 Not Found`: User not found
- `500 Internal Server Error`: Database error

## 🔐 Role-Based Access Control

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `customer` | Regular customer | View own profile, update own profile |
| `staff` | Barbershop staff | View own profile, update own profile, manage services, manage schedules |
| `admin` | Administrator | Full access to all features |

### Permission Matrix

| Action | Customer | Staff | Admin |
|--------|----------|-------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| View other profiles | ❌ | ❌ | ✅ |
| Create users | ❌ | ❌ | ✅ |
| Update other users | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| Manage services | ❌ | ✅ | ✅ |
| Manage schedules | ❌ | ✅ | ✅ |
| Manage appointments | ❌ | ✅ | ✅ |
| View all appointments | ❌ | ✅ | ✅ |

## 📱 Mobile App Integration

### Profile Management
```javascript
// Get user profile
const getProfile = async (userId) => {
  const response = await fetch(`/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  return response.json();
};

// Update profile
const updateProfile = async (userId, profileData) => {
  const response = await fetch(`/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  return response.json();
};
```

### Admin Functions
```javascript
// Get all users (admin only)
const getAllUsers = async () => {
  const response = await fetch('/users/all', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  return response.json();
};

// Create new user (admin only)
const createUser = async (userData) => {
  const response = await fetch('/users/new', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

## 🛡️ Security Features

### Authentication
- All endpoints require valid JWT token
- Token includes user role and admin status
- Automatic permission checking

### Authorization
- Role-based access control
- Users can only modify their own profiles
- Admins have full access
- Staff have limited administrative access

### Data Protection
- Passwords are never returned in responses
- Sensitive data is filtered out
- Input validation prevents injection attacks

## 🚨 Error Handling

### Common Error Codes
- `400`: Invalid input data or missing parameters
- `401`: Authentication failed
- `403`: Insufficient permissions
- `404`: Resource not found
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

### Database Schema
Users are stored in the `users` table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  role user_role DEFAULT 'customer',
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Use Cases
The API uses a dedicated use case for user creation:
- `src/use-cases/create-user.ts` - Handles user creation logic
- Separates business logic from controller
- Provides reusable user creation functionality

### Testing
Test user management functionality:
- `tests/api.test.ts` - General API tests
- `tests/test-endpoints.js` - Endpoint-specific tests
- Verify role-based access control
- Test permission boundaries

### Environment Variables
```env
JWT_SECRET=your-secret-key
REFRESH_SECRET=your-refresh-secret-key
```

## 📊 Performance Considerations

### Caching
- User profiles can be cached for frequently accessed data
- Implement cache invalidation on profile updates
- Consider Redis for session management

### Pagination
- For large user lists, implement pagination
- Use query parameters for page and limit
- Default to reasonable page sizes

### Database Indexing
- Index on `email` for fast lookups
- Index on `role` for role-based queries
- Index on `created_at` for time-based queries 