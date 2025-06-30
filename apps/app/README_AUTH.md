# Authentication System - The Royal Barber App

## Overview

This authentication system provides a complete login and signup flow for the The Royal Barber React Native app. It includes secure token storage, user state management, and a modern UI that matches the app's design theme.

## Features

### 🔐 Authentication Features
- **User Registration**: Create new accounts with email, password, and name
- **User Login**: Sign in with email and password
- **Secure Storage**: User data is stored securely using Expo SecureStore
- **Session Management**: Automatic session restoration on app launch
- **Sign Out**: Secure logout functionality

### 🎨 UI Components
- **Welcome Screen**: Beautiful onboarding screen with app introduction
- **Login Screen**: Modern login form with validation
- **Signup Screen**: Registration form with password confirmation
- **Loading Screen**: Elegant loading state while checking authentication
- **Profile Integration**: Updated profile screen with user data and sign-out

### 🛡️ Security Features
- **Secure Storage**: Uses Expo SecureStore for sensitive data
- **Input Validation**: Client-side validation for all forms
- **Error Handling**: Comprehensive error handling and user feedback

## File Structure

```
app/
├── auth/
│   ├── welcome.tsx      # Welcome/onboarding screen
│   ├── login.tsx        # Login screen
│   └── signup.tsx       # Registration screen
├── (tabs)/
│   └── profile.tsx      # Updated profile with auth integration
└── _layout.tsx          # Root layout with auth routing

components/
└── auth/
    ├── AuthContext.tsx  # Authentication context and provider
    └── LoadingScreen.tsx # Loading screen component
```

## Usage

### Authentication Context

The `AuthContext` provides authentication state and methods throughout the app:

```typescript
import { useAuth } from '@/components/auth/AuthContext';

function MyComponent() {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  
  // Use authentication methods
  const handleLogin = async () => {
    const success = await signIn(email, password);
    if (success) {
      // Navigate to main app
    }
  };
}
```

### Navigation Flow

1. **App Launch**: Shows loading screen while checking authentication
2. **Not Authenticated**: Redirects to welcome screen
3. **Welcome Screen**: Choose to login or signup
4. **Login/Signup**: Complete authentication forms
5. **Authenticated**: Redirects to main app tabs
6. **Profile**: Access user data and sign-out option

## Customization

### Backend Integration

To integrate with your backend API, update the authentication methods in `AuthContext.tsx`:

```typescript
const signIn = async (email: string, password: string): Promise<boolean> => {
  try {
    // Replace with your API call
    const response = await fetch('your-api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const userData = await response.json();
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Sign in error:', error);
    return false;
  }
};
```

### Styling

The authentication screens use the app's color scheme defined in `constants/Colors.ts`. To customize:

1. Update colors in `constants/Colors.ts`
2. Modify styles in individual screen components
3. Update the gradient colors in `LinearGradient` components

## Dependencies

- `expo-secure-store`: Secure storage for user data
- `expo-linear-gradient`: Beautiful gradient backgrounds
- `expo-router`: Navigation between screens
- `react-native-safe-area-context`: Safe area handling

## Security Notes

- User data is stored securely using Expo SecureStore
- Passwords are not stored in plain text (backend should hash them)
- Session tokens should be refreshed regularly
- Consider implementing biometric authentication for additional security

## Future Enhancements

- [ ] Biometric authentication (Face ID, Touch ID)
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Social login (Google, Facebook, Apple)
- [ ] Two-factor authentication
- [ ] Remember me functionality
- [ ] Auto-logout on inactivity 