// React core imports
import React, { useEffect } from 'react';

// Third-party library imports
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-reanimated';

// Local imports
import { AuthProvider, useAuth } from '@/components/auth/AuthContext';
import LoadingScreen from '@/components/auth/LoadingScreen';

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: 'auth/welcome',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
	const { user, isLoading, isFirstTime } = useAuth();
	const [forceUpdate, setForceUpdate] = React.useState(0);
	const router = useRouter();

	console.log('=== ROOT LAYOUT NAV DEBUG ===');
	console.log('isLoading:', isLoading);
	console.log('isFirstTime:', isFirstTime);
	console.log('user:', user ? 'User exists' : 'No user');
	console.log('shouldShowAuth:', isFirstTime || !user);
	console.log('forceUpdate:', forceUpdate);
	console.log('=== END ROOT LAYOUT NAV DEBUG ===');

	// Force re-render when auth state changes
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setForceUpdate(prev => prev + 1);
		}, 100);
		return () => clearTimeout(timer);
	}, [user, isLoading, isFirstTime]);

	// Add a fallback timeout to prevent infinite loading
	const [showFallback, setShowFallback] = React.useState(false);
	
	React.useEffect(() => {
		const timer = setTimeout(() => {
			if (isLoading) {
				console.log('Auth check taking too long, showing fallback auth screens');
				setShowFallback(true);
			}
		}, 5000); // 5 second timeout
		
		return () => clearTimeout(timer);
	}, [isLoading]);

	// Global deep link handling for payment callbacks
	React.useEffect(() => {
		const handleUrl = (url: string) => {
			console.log('Global URL handler received:', url);
			
			// Handle payment success URLs
			if (url.includes('app://payment/success')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				// Parse URL parameters
				const urlObj = new URL(url);
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				if (status === 'success' && timeSlot) {
					// Navigate to success screen with appointment details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					
					console.log('Attempting to navigate to success screen with params:', {
						timeSlot,
						appointmentDate,
						serviceName,
						barberName,
						amount,
					});
					
					// Add a small delay to ensure navigation is ready
					setTimeout(() => {
						try {
							router.replace({
								pathname: '/payment/success',
								params: {
									timeSlot,
									appointmentDate,
									serviceName,
									barberName,
									amount,
								}
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
					}, 100);
				}
			}
			// Handle payment failure URLs
			else if (url.includes('app://payment/failed')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				// Parse URL parameters
				const urlObj = new URL(url);
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				if (status === 'cancel' && timeSlot) {
					// Navigate to failed screen with error details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					const errorMessage = urlObj.searchParams.get('errorMessage') || 'El pago no se pudo procesar. Por favor, intenta nuevamente.';
					
					console.log('Attempting to navigate to failed screen with params:', {
						timeSlot,
						appointmentDate,
						serviceName,
						barberName,
						amount,
						errorMessage,
					});
					
					// Add a small delay to ensure navigation is ready
					setTimeout(() => {
						try {
							router.replace({
								pathname: '/payment/failed',
								params: {
									timeSlot,
									appointmentDate,
									serviceName,
									barberName,
									amount,
									errorMessage,
								}
							});
						} catch (navError) {
							console.error('Global navigation error in failure handler:', navError);
							// Fallback to alert if navigation fails
							Alert.alert(
								'Pago Fallido',
								errorMessage,
								[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
							);
						}
					}, 100);
				}
			}
			// Handle legacy payment-callback URLs for backward compatibility
			else if (url.includes('app://payment-callback')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				// Parse URL parameters
				const urlObj = new URL(url);
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				if (status === 'success' && timeSlot) {
					// Navigate to success screen with appointment details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					
					console.log('Attempting to navigate to success screen with params:', {
						timeSlot,
						appointmentDate,
						serviceName,
						barberName,
						amount,
					});
					
					// Add a small delay to ensure navigation is ready
					setTimeout(() => {
						try {
							router.replace({
								pathname: '/payment/success',
								params: {
									timeSlot,
									appointmentDate,
									serviceName,
									barberName,
									amount,
								}
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
					}, 100);
				} else {
					// Navigate to failed screen with error details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					const errorMessage = urlObj.searchParams.get('errorMessage') || 'El pago no se pudo procesar. Por favor, intenta nuevamente.';
					
					console.log('Attempting to navigate to failed screen with params:', {
						timeSlot,
						appointmentDate,
						serviceName,
						barberName,
						amount,
						errorMessage,
					});
					
					// Add a small delay to ensure navigation is ready
					setTimeout(() => {
						try {
							router.replace({
								pathname: '/payment/failed',
								params: {
									timeSlot,
									appointmentDate,
									serviceName,
									barberName,
									amount,
									errorMessage,
								}
							});
						} catch (navError) {
							console.error('Global navigation error in failure handler:', navError);
							// Fallback to alert if navigation fails
							Alert.alert(
								'Pago Fallido',
								errorMessage,
								[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
							);
						}
					}, 100);
				}
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

	if (isLoading && !showFallback) {
		console.log('Showing LoadingScreen');
		return <LoadingScreen />;
	}

	// Determine which screens to show based on authentication state
	const shouldShowAuth = isFirstTime || !user || showFallback;

	console.log('Navigation decision - shouldShowAuth:', shouldShowAuth, 'showFallback:', showFallback);

	// If no user is authenticated, show auth screens
	if (!user) {
		console.log('No user detected - showing auth screens');
		return (
			<ThemeProvider value={DarkTheme}>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
					<Stack.Screen name="auth/login" options={{ headerShown: false }} />
					<Stack.Screen name="auth/signup" options={{ headerShown: false }} />
				</Stack>
			</ThemeProvider>
		);
	}

	// If user is authenticated, show main app
	console.log('User authenticated - showing main app');
	return (
		<ThemeProvider value={DarkTheme}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="payment/success" options={{ headerShown: false }} />
				<Stack.Screen name="payment/failed" options={{ headerShown: false }} />
				<Stack.Screen name="payment/test" options={{ headerShown: false }} />
				<Stack.Screen name="payment/debug" options={{ headerShown: false }} />
			</Stack>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
		...FontAwesome.font,
	});

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<AuthProvider>
				<RootLayoutNav />
			</AuthProvider>
		</SafeAreaProvider>
	);
}
