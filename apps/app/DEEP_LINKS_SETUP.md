# Deep Links Setup for Payment Callbacks

This document explains the complete deep link configuration for payment callbacks in The Royal Barber app.

## 🔗 Deep Link URLs

The app supports the following deep link patterns for payment callbacks:

### Success Callback
```
app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00
```

### Failure Callback
```
app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Pago%20cancelado%20por%20el%20usuario
```

### Legacy Callback (Backward Compatibility)
```
app://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00
```

## 📱 Configuration

### App Configuration (`app.json`)

The app is configured with the following deep link settings:

```json
{
  "expo": {
    "scheme": "app",
    "ios": {
      "bundleIdentifier": "com.theroyalbarber.app",
      "associatedDomains": [
        "applinks:theroyalbarber.com"
      ]
    },
    "android": {
      "package": "com.theroyalbarber.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "app",
              "host": "payment",
              "pathPrefix": "/success"
            },
            {
              "scheme": "app",
              "host": "payment",
              "pathPrefix": "/failed"
            },
            {
              "scheme": "app",
              "host": "payment-callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### URL Parameters

#### Success Parameters
- `status`: Must be "success"
- `timeSlot`: Appointment time (e.g., "14:30")
- `appointmentDate`: Date in DD/MM/YYYY format (e.g., "15/07/2025")
- `serviceName`: Name of the service (URL encoded)
- `barberName`: Name of the barber (URL encoded)
- `amount`: Payment amount (e.g., "250.00")

#### Failure Parameters
- `status`: Must be "cancel"
- `timeSlot`: Appointment time (e.g., "14:30")
- `appointmentDate`: Date in DD/MM/YYYY format (e.g., "15/07/2025")
- `serviceName`: Name of the service (URL encoded)
- `barberName`: Name of the barber (URL encoded)
- `amount`: Payment amount (e.g., "250.00")
- `errorMessage`: Error message (URL encoded)

## 🔄 Deep Link Handling

### Global URL Handler (`_layout.tsx`)

The app includes a comprehensive deep link handler in the root layout:

```typescript
// Global deep link handling for payment callbacks
React.useEffect(() => {
  const handleUrl = (url: string) => {
    console.log('Global URL handler received:', url);
    
    // Handle payment success URLs
    if (url.includes('app://payment/success')) {
      WebBrowser.dismissBrowser();
      
      const urlObj = new URL(url);
      const status = urlObj.searchParams.get('status');
      const timeSlot = urlObj.searchParams.get('timeSlot');
      
      if (status === 'success' && timeSlot) {
        // Navigate to success screen with appointment details
        router.replace({
          pathname: '/payment/success',
          params: {
            timeSlot,
            appointmentDate: urlObj.searchParams.get('appointmentDate'),
            serviceName: urlObj.searchParams.get('serviceName'),
            barberName: urlObj.searchParams.get('barberName'),
            amount: urlObj.searchParams.get('amount'),
          }
        });
      }
    }
    
    // Handle payment failure URLs
    else if (url.includes('app://payment/failed')) {
      WebBrowser.dismissBrowser();
      
      const urlObj = new URL(url);
      const status = urlObj.searchParams.get('status');
      const timeSlot = urlObj.searchParams.get('timeSlot');
      
      if (status === 'cancel' && timeSlot) {
        // Navigate to failed screen with error details
        router.replace({
          pathname: '/payment/failed',
          params: {
            timeSlot,
            appointmentDate: urlObj.searchParams.get('appointmentDate'),
            serviceName: urlObj.searchParams.get('serviceName'),
            barberName: urlObj.searchParams.get('barberName'),
            amount: urlObj.searchParams.get('amount'),
            errorMessage: urlObj.searchParams.get('errorMessage'),
          }
        });
      }
    }
    
    // Handle legacy payment-callback URLs
    else if (url.includes('app://payment-callback')) {
      // Similar handling for backward compatibility
    }
  };

  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleUrl(url);
  });

  // Check if app was opened from a URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleUrl(url);
    }
  });

  return () => subscription?.remove();
}, [router]);
```

## 💳 Payment Flow Integration

### Checkout Session Creation

When creating a Stripe checkout session, the app generates deep link URLs:

```typescript
const successUrl = `app://payment/success?status=success&timeSlot=${encodeURIComponent(selectedTime)}&appointmentDate=${encodeURIComponent(formattedDate)}&serviceName=${encodeURIComponent(selectedService.name)}&barberName=${encodeURIComponent(selectedBarber.name)}&amount=${encodeURIComponent(selectedService.price.toString())}`;

const cancelUrl = `app://payment/failed?status=cancel&timeSlot=${encodeURIComponent(selectedTime)}&appointmentDate=${encodeURIComponent(formattedDate)}&serviceName=${encodeURIComponent(selectedService.name)}&barberName=${encodeURIComponent(selectedBarber.name)}&amount=${encodeURIComponent(selectedService.price.toString())}&errorMessage=${encodeURIComponent('Pago cancelado por el usuario')}`;

const checkoutData = {
  serviceId: selectedService.id,
  paymentType: paymentType,
  successUrl,
  cancelUrl,
  userId: user.id,
  appointmentData: {
    barberId: selectedBarber.id,
    appointmentDate: formattedDate,
    timeSlot: selectedTime,
    notes: undefined
  }
};
```

### WebBrowser Integration

The app uses Expo WebBrowser to handle Stripe checkout:

```typescript
const result = await WebBrowser.openBrowserAsync(response.data.url, {
  presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
  showTitle: true,
  enableBarCollapsing: true,
  showInRecents: false,
  toolbarColor: Colors.dark.background,
  controlsColor: Colors.dark.primary,
  dismissButtonStyle: 'cancel',
  createTask: false,
});
```

## 🧪 Testing Deep Links

### Debug Screen

The app includes a debug screen (`/payment/debug`) for testing deep links:

```typescript
const testSuccessDeepLink = () => {
  const testUrl = 'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00';
  Linking.openURL(testUrl);
};

const testFailedDeepLink = () => {
  const testUrl = 'app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Test%20error%20message';
  Linking.openURL(testUrl);
};
```

### Manual Testing

You can test deep links manually:

1. **Development**: Use the debug screen in the app
2. **Terminal**: Use `npx uri-scheme` to test deep links
3. **Browser**: Navigate to the deep link URL

### Testing Commands

```bash
# Test success deep link
npx uri-scheme open "app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00" --ios

# Test failure deep link
npx uri-scheme open "app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Test%20error" --ios
```

## 🛡️ Security Considerations

### URL Validation

The deep link handler includes validation:

```typescript
// Validate required parameters
if (status === 'success' && timeSlot) {
  // Process success callback
}

if (status === 'cancel' && timeSlot) {
  // Process failure callback
}
```

### Error Handling

The app includes comprehensive error handling:

```typescript
try {
  router.replace({
    pathname: '/payment/success',
    params: { /* ... */ }
  });
} catch (navError) {
  console.error('Global navigation error in success handler:', navError);
  // Fallback to alert if navigation fails
  Alert.alert(
    '¡Pago Exitoso!',
    'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
    [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
  );
}
```

## 📱 Platform-Specific Configuration

### iOS

- **Associated Domains**: Configured for `applinks:theroyalbarber.com`
- **Universal Links**: Support for web-based deep links
- **Bundle Identifier**: `com.theroyalbarber.app`

### Android

- **Intent Filters**: Configured for payment deep links
- **Auto Verify**: Enabled for automatic verification
- **Package Name**: `com.theroyalbarber.app`

### Web

- **Scheme**: `app://` for web-based deep links
- **Fallback**: Web browser handling for unsupported platforms

## 🔄 Backward Compatibility

The app supports legacy deep link patterns:

- **Legacy URL**: `app://payment-callback`
- **Current URLs**: `app://payment/success` and `app://payment/failed`
- **Automatic Detection**: Handles both patterns seamlessly

## 📊 Monitoring and Debugging

### Console Logging

The deep link handler includes comprehensive logging:

```typescript
console.log('Global URL handler received:', url);
console.log('Attempting to navigate to success screen with params:', {
  timeSlot,
  appointmentDate,
  serviceName,
  barberName,
  amount,
});
```

### Error Tracking

Failed navigation attempts are logged and handled gracefully:

```typescript
console.error('Global navigation error in success handler:', navError);
```

## 🚀 Deployment Considerations

### Production Setup

1. **Update Bundle Identifiers**: Ensure correct bundle IDs for production
2. **Configure Associated Domains**: Set up domain verification for iOS
3. **Test Deep Links**: Verify functionality in production environment
4. **Monitor Logs**: Track deep link usage and errors

### Environment Variables

Ensure proper configuration for different environments:

```typescript
const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
```

## 📋 Checklist

- [x] Deep link scheme configured in `app.json`
- [x] URL handler implemented in `_layout.tsx`
- [x] Payment success screen created
- [x] Payment failure screen created
- [x] Debug screen for testing
- [x] Error handling and fallbacks
- [x] Backward compatibility support
- [x] Platform-specific configurations
- [x] Security validation
- [x] Comprehensive logging
- [x] Testing procedures documented

The deep link system is now fully configured and ready for production use! 