# Password Recovery - Frontend Implementation Guide

## Overview

This document provides comprehensive documentation for implementing the password recovery feature on the frontend. The system uses a token-based approach with email delivery via Resend, ensuring secure password reset functionality.

## Table of Contents

1. [Architecture & Flow](#architecture--flow)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Formats](#requestresponse-formats)
4. [Error Handling](#error-handling)
5. [Implementation Examples](#implementation-examples)
6. [Security Considerations](#security-considerations)
7. [UI/UX Recommendations](#uiux-recommendations)
8. [Testing Guide](#testing-guide)

---

## Architecture & Flow

### Password Recovery Flow

```
┌─────────────┐
│   User      │
│  Requests   │
│   Reset     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /auth/request-password-reset   │
│ { email: "user@example.com" }       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Email sent with reset token         │
│  (Token expires in 1 hour)          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  User clicks link/enters token      │
│  in app                              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /auth/verify-reset-token       │
│ { token: "abc123..." }              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /auth/reset-password            │
│ { token: "...", newPassword: "..." }│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Success!   │
│  User can   │
│  login      │
└─────────────┘
```

### Key Features

- **Token-based**: Secure 64-character hexadecimal tokens (32 bytes encoded as hex)
- **Time-limited**: Tokens expire after 1 hour
- **Single-use**: Tokens are marked as used after password reset
- **Privacy-focused**: API doesn't reveal if email exists in system
- **Email delivery**: Tokens sent via Resend email service

---

## API Endpoints

### Base URL

All endpoints are prefixed with your API base URL:
```
https://your-api-domain.com/auth
```

### 1. Request Password Reset

**Endpoint:** `POST /auth/request-password-reset`

**Description:** Initiates the password recovery process. Sends a reset token to the user's email if the email exists in the system.

**Request Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "If your email exists in our system, you will receive a password reset link."
  }
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "status": 500,
  "message": "Failed to process request"
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "success": false,
  "status": 400,
  "message": "Invalid email format"
}
```

**Important Notes:**
- The API **always returns success** (200) even if the email doesn't exist to prevent email enumeration attacks
- The reset token is sent via email and expires in 1 hour
- The token is a 64-character hexadecimal string (32 random bytes encoded as hex)

---

### 2. Verify Reset Token

**Endpoint:** `POST /auth/verify-reset-token`

**Description:** Validates that a reset token is valid, not expired, and not already used. Use this before showing the password reset form.

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "valid": true
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "status": 400,
  "message": "Invalid or expired token"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "status": 500,
  "message": "Failed to verify token"
}
```

**Important Notes:**
- Call this endpoint when the user navigates to the reset password page
- If the token is invalid, redirect to the "request reset" page
- Tokens expire after 1 hour from creation

---

### 3. Reset Password

**Endpoint:** `POST /auth/reset-password`

**Description:** Resets the user's password using a valid reset token.

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
  "newPassword": "NewSecureP@ssw0rd123"
}
```

**Password Requirements:**
- Minimum 6 characters
- Maximum 128 characters
- Must contain at least one lowercase letter
- Must contain at least one uppercase letter
- Must contain at least one number

**Success Response (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "status": 400,
  "message": "Invalid or expired token"
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "success": false,
  "status": 400,
  "message": "Password must contain at least one lowercase letter, one uppercase letter, and one number"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "status": 500,
  "message": "Failed to reset password"
}
```

**Important Notes:**
- The token is automatically marked as used after successful password reset
- Users cannot reuse the same token
- After successful reset, redirect users to the login page

---

## Request/Response Formats

### Standard Response Structure

All API responses follow this structure:

**Success Response:**
```typescript
interface SuccessResponse<T> {
  success: true;
  status: number;
  data: T;
}
```

**Error Response:**
```typescript
interface ErrorResponse {
  success: false;
  status: number;
  message: string;
}
```

### TypeScript Interfaces

```typescript
// Request interfaces
interface RequestPasswordResetRequest {
  email: string;
}

interface VerifyResetTokenRequest {
  token: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Response interfaces
interface RequestPasswordResetResponse {
  message: string;
}

interface VerifyResetTokenResponse {
  valid: boolean;
}

interface ResetPasswordResponse {
  message: string;
}
```

---

## Error Handling

### Common Error Scenarios

1. **Network Errors**
   - Handle connection timeouts
   - Retry logic for transient failures
   - Show user-friendly error messages

2. **Validation Errors**
   - Email format validation
   - Password strength validation
   - Token format validation

3. **Token Expiration**
   - Check token validity before showing reset form
   - Provide clear messaging when token expires
   - Allow users to request a new reset token

4. **Rate Limiting**
   - Implement client-side rate limiting
   - Show appropriate messages if rate limited
   - Prevent abuse of reset endpoint

### Error Handling Best Practices

```typescript
async function handleApiError(error: unknown): Promise<string> {
  if (error instanceof NetworkError) {
    return "Network error. Please check your connection and try again.";
  }
  
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || "Invalid request. Please check your input.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return "An unexpected error occurred.";
    }
  }
  
  return "An unexpected error occurred. Please try again.";
}
```

---

## Implementation Examples

### React/TypeScript Example

#### 1. Request Password Reset Component

```typescript
import React, { useState } from 'react';
import { requestPasswordReset } from '../services/authService';

interface RequestResetFormProps {
  onSuccess: () => void;
}

export const RequestResetForm: React.FC<RequestResetFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <p>If your email exists in our system, you will receive a password reset link.</p>
        <p>Please check your email inbox.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Password</h2>
      <p>Enter your email address and we'll send you a reset token.</p>
      
      {error && <div className="error">{error}</div>}
      
      <div>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="your@email.com"
        />
      </div>
      
      <button type="submit" disabled={loading || !email}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
};
```

#### 2. Reset Password Component

```typescript
import React, { useState, useEffect } from 'react';
import { verifyResetToken, resetPassword } from '../services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ResetPasswordForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    // Verify token on mount
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link. Please request a new one.');
        setVerifying(false);
        return;
      }

      try {
        await verifyResetToken(token);
        setVerifying(false);
      } catch (err) {
        setError('This reset link is invalid or has expired. Please request a new one.');
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 6) errors.push('Password must be at least 6 characters');
    if (pwd.length > 128) errors.push('Password must be less than 128 characters');
    if (!/[a-z]/.test(pwd)) errors.push('Password must contain at least one lowercase letter');
    if (!/[A-Z]/.test(pwd)) errors.push('Password must contain at least one uppercase letter');
    if (!/\d/.test(pwd)) errors.push('Password must contain at least one number');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordErrors([]);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validationErrors = validatePassword(password);
    if (validationErrors.length > 0) {
      setPasswordErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      // Redirect to login with success message
      navigate('/login?reset=success');
    } catch (err: any) {
      if (err.status === 400) {
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return <div>Verifying reset token...</div>;
  }

  if (error && !token) {
    return (
      <div>
        <div className="error">{error}</div>
        <button onClick={() => navigate('/forgot-password')}>
          Request New Reset Link
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Your Password</h2>
      
      {error && <div className="error">{error}</div>}
      
      {passwordErrors.length > 0 && (
        <div className="validation-errors">
          <ul>
            {passwordErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordErrors([]);
          }}
          required
          disabled={loading}
          placeholder="Enter new password"
        />
      </div>
      
      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="Confirm new password"
        />
      </div>
      
      <button type="submit" disabled={loading || !password || !confirmPassword}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
};
```

#### 3. Auth Service

```typescript
// services/authService.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  message?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/auth${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new ApiError(data.status, data.message || 'An error occurred');
  }

  return data.data as T;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest('/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email: email.toLowerCase() }),
  });
}

export async function verifyResetToken(token: string): Promise<{ valid: boolean }> {
  return apiRequest<{ valid: boolean }>('/verify-reset-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  await apiRequest('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}
```

### React Native Example

```typescript
// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://your-api-domain.com';

export const authService = {
  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.toLowerCase() }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to request password reset');
    }
  },

  async verifyResetToken(token: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!data.success) {
      return false;
    }

    return data.data?.valid === true;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to reset password');
    }
  },
};
```

```typescript
// screens/ResetPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';

export const ResetPasswordScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const token = route.params?.token || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        Alert.alert('Error', 'Invalid reset link');
        navigation.goBack();
        return;
      }

      try {
        const isValid = await authService.verifyResetToken(token);
        if (!isValid) {
          Alert.alert('Error', 'This reset link is invalid or has expired');
          navigation.goBack();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to verify reset token');
        navigation.goBack();
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, navigation]);

  const handleReset = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      Alert.alert('Success', 'Password reset successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Verifying reset token...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Reset Password</Text>

      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Button
        title={loading ? 'Resetting...' : 'Reset Password'}
        onPress={handleReset}
        disabled={loading || !password || !confirmPassword}
      />
    </View>
  );
};
```

### Deep Link Handling (React Native)

```typescript
// App.tsx or navigation setup
import { Linking } from 'react-native';
import { useEffect } from 'react';

useEffect(() => {
  // Handle deep link when app is already open
  const handleDeepLink = (event: { url: string }) => {
    const url = new URL(event.url);
    if (url.pathname === '/reset-password') {
      const token = url.searchParams.get('token');
      if (token) {
        navigation.navigate('ResetPassword', { token });
      }
    }
  };

  // Handle deep link when app is opened from closed state
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink({ url });
    }
  });

  // Listen for deep links
  const subscription = Linking.addEventListener('url', handleDeepLink);

  return () => subscription.remove();
}, []);
```

---

## Security Considerations

### Client-Side Security

1. **Token Storage**
   - Never store reset tokens in localStorage or AsyncStorage
   - Pass tokens via URL parameters or deep links only
   - Clear tokens from URL after use

2. **Password Validation**
   - Validate password strength on client before submission
   - Show real-time feedback on password requirements
   - Never send passwords in plain text (use HTTPS)

3. **Rate Limiting**
   - Implement client-side rate limiting for reset requests
   - Show appropriate messages if user exceeds limits
   - Prevent multiple simultaneous requests

4. **Error Messages**
   - Don't reveal if email exists in system (API already handles this)
   - Show generic error messages for security
   - Log detailed errors only in development

### Best Practices

```typescript
// Rate limiting example
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests = 3;
  private windowMs = 15 * 60 * 1000; // 15 minutes

  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }
}

const resetRateLimiter = new RateLimiter();

// Use in component
const handleRequestReset = async (email: string) => {
  if (!resetRateLimiter.canMakeRequest(email)) {
    setError('Too many requests. Please wait before trying again.');
    return;
  }
  
  // Make API request...
};
```

---

## UI/UX Recommendations

### Request Reset Page

1. **Clear Instructions**
   - Explain what will happen when user submits email
   - Set expectations about email delivery time
   - Provide alternative options if email doesn't arrive

2. **Success State**
   - Show confirmation message immediately
   - Include instructions to check email
   - Provide option to resend if needed (with rate limiting)

3. **Error Handling**
   - Show clear, actionable error messages
   - Provide retry options
   - Don't reveal system internals

### Reset Password Page

1. **Token Validation**
   - Show loading state while verifying token
   - Clear error messages for expired/invalid tokens
   - Easy path to request new token

2. **Password Input**
   - Real-time password strength indicator
   - Show/hide password toggle
   - Clear validation messages
   - Confirm password field with match indicator

3. **Success Flow**
   - Clear success message
   - Automatic redirect to login (after 2-3 seconds)
   - Option to login immediately

### Example UI States

```typescript
// Loading state
<div className="loading">
  <Spinner />
  <p>Verifying reset token...</p>
</div>

// Error state
<div className="error">
  <Icon name="error" />
  <h3>Reset Link Expired</h3>
  <p>This password reset link has expired. Please request a new one.</p>
  <Button onClick={handleRequestNew}>Request New Reset Link</Button>
</div>

// Success state
<div className="success">
  <Icon name="check" />
  <h3>Password Reset Successful</h3>
  <p>Your password has been reset. Redirecting to login...</p>
</div>
```

---

## Testing Guide

### Unit Tests

```typescript
// __tests__/authService.test.ts
import { requestPasswordReset, verifyResetToken, resetPassword } from '../services/authService';

describe('Password Recovery Service', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('requestPasswordReset sends correct request', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      status: 200,
      data: { message: 'Email sent' }
    }));

    await requestPasswordReset('test@example.com');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/request-password-reset'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      })
    );
  });

  test('verifyResetToken returns true for valid token', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      status: 200,
      data: { valid: true }
    }));

    const result = await verifyResetToken('valid-token');
    expect(result.valid).toBe(true);
  });

  test('resetPassword handles errors correctly', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({
      success: false,
      status: 400,
      message: 'Invalid token'
    }), { status: 400 });

    await expect(resetPassword('invalid-token', 'newpass')).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// Test the full flow
describe('Password Recovery Flow', () => {
  test('complete password reset flow', async () => {
    // 1. Request reset
    await requestPasswordReset('user@example.com');
    
    // 2. Simulate token from email (in real scenario, user gets this from email)
    // Token is 64-character hexadecimal string
    const token = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2';
    
    // 3. Verify token
    const isValid = await verifyResetToken(token);
    expect(isValid.valid).toBe(true);
    
    // 4. Reset password
    await resetPassword(token, 'NewSecureP@ssw0rd123');
    
    // 5. Verify password was changed (login with new password)
    // ... login test
  });
});
```

### Manual Testing Checklist

- [ ] Request reset with valid email
- [ ] Request reset with invalid email format
- [ ] Request reset with non-existent email (should still show success)
- [ ] Verify token with valid token
- [ ] Verify token with expired token
- [ ] Verify token with invalid token
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Reset password with weak password
- [ ] Reset password with mismatched passwords
- [ ] Test rate limiting on reset requests
- [ ] Test deep link handling (mobile)
- [ ] Test email link handling (web)

---

## Troubleshooting

### Common Issues

1. **"Invalid or expired token" immediately after receiving email**
   - Check if token is being truncated in URL
   - Verify token is passed correctly to API
   - Check server time synchronization

2. **Email not received**
   - Check spam folder
   - Verify email address is correct
   - Check Resend API configuration
   - Verify email domain is verified in Resend

3. **Token verification fails**
   - Ensure token is not URL-encoded multiple times
   - Check token length (must be exactly 64 hexadecimal characters)
   - Verify token hasn't been used already
   - Ensure token matches exactly (case-sensitive, no spaces)

4. **Password reset fails**
   - Verify password meets all requirements
   - Check token hasn't expired (1 hour limit)
   - Ensure token hasn't been used

### Debug Tips

```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

function logDebug(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[Password Recovery] ${message}`, data);
  }
}

// Use in service calls
export async function requestPasswordReset(email: string): Promise<void> {
  logDebug('Requesting password reset', { email });
  // ... implementation
}
```

---

## Additional Resources

- API Base URL: Configure in your environment variables
- Email Service: Resend (https://resend.com)
- Token Format: 32 random bytes encoded as hexadecimal (64 characters)
- Token Expiration: 1 hour from creation
- Token Generation: `crypto.randomBytes(32).toString('hex')`
- Password Requirements: See validation schemas above

---

## Support

For issues or questions:
1. Check this documentation first
2. Review API response messages
3. Check server logs for detailed errors
4. Contact backend team with specific error details

---

**Last Updated:** November 22, 2025
**API Version:** 1.0
**Documentation Version:** 1.1

