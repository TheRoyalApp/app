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
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
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
		// Track if we're expecting a payment callback
		let paymentCallbackExpected = false;
		let paymentCallbackTimeout: ReturnType<typeof setTimeout> | null = null;
		let alertShown = false; // Flag to prevent duplicate alerts
		let paymentCancelled = false; // Global flag to track if payment was cancelled

		const handleUrl = (url: string) => {
			console.log('🔗 Global URL handler received:', url);
			console.log('👤 Current user state:', user ? 'Authenticated' : 'Not authenticated');
			console.log('⏳ Loading state:', isLoading ? 'Loading' : 'Ready');
			
			// Clear any pending payment callback timeout
			if (paymentCallbackTimeout) {
				clearTimeout(paymentCallbackTimeout);
				paymentCallbackTimeout = null;
			}
			paymentCallbackExpected = false;
			alertShown = false; // Reset alert flag when deep link is received
			paymentCancelled = false; // Reset payment cancelled flag when deep link is received
			
			// Handle payment success URLs
			if (url.includes('app://payment/success')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				// Parse URL parameters with better error handling
				let urlObj;
				try {
					urlObj = new URL(url);
				} catch (urlError) {
					console.error('Failed to parse URL:', url, urlError);
					// Show success message even if URL parsing fails
					if (!alertShown) {
						alertShown = true;
						WebBrowser.dismissBrowser();
						Alert.alert(
							'¡Pago Exitoso!',
							'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
							[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
						);
					}
					return;
				}
				
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				// Handle success even if some parameters are missing (embedded browser limitation)
				if (status === 'success') {
					// Navigate to success screen with appointment details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					
					// Decode URL parameters
					const decodedParams = {
						timeSlot: timeSlot ? decodeURIComponent(timeSlot) : 'TBD',
						appointmentDate: appointmentDate ? decodeURIComponent(appointmentDate) : 'TBD',
						serviceName: serviceName ? decodeURIComponent(serviceName) : 'Servicio',
						barberName: barberName ? decodeURIComponent(barberName) : 'Barbero',
						amount: amount ? decodeURIComponent(amount) : '0',
					};
					
					console.log('Attempting to navigate to success screen with params:', decodedParams);
					
					// Wait for navigation to be ready and user to be authenticated
					const attemptNavigation = () => {
						try {
							// Check if user is authenticated and navigation is ready
							if (user && !isLoading) {
								router.replace({
									pathname: '/payment/success',
									params: decodedParams
								});
								console.log('✅ Successfully navigated to payment success screen');
								return true; // Navigation successful
							} else {
								console.log('Navigation not ready yet, retrying...');
								return false; // Navigation failed, will retry
							}
						} catch (navError) {
							console.error('Global navigation error in success handler:', navError);
							// Fallback to alert if navigation fails
							if (!alertShown) {
								alertShown = true;
								WebBrowser.dismissBrowser();
								Alert.alert(
									'¡Pago Exitoso!',
									'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
									[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
								);
							}
							return true; // Don't retry after fallback
						}
					};
					
					// Try navigation immediately
					if (!attemptNavigation()) {
						// If failed, retry with increasing delays
						const retryDelays = [500, 1000, 2000];
						retryDelays.forEach((delay, index) => {
							setTimeout(() => {
								if (!attemptNavigation()) {
									console.log(`Navigation attempt ${index + 1} failed, will retry in ${retryDelays[index + 1] || 3000}ms`);
								}
							}, delay);
						});
						
						// Final fallback after 5 seconds
						setTimeout(() => {
							console.log('🔄 Final fallback: Showing success alert');
							if (!alertShown) {
								alertShown = true;
								WebBrowser.dismissBrowser();
								Alert.alert(
									'¡Pago Exitoso!',
									'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
									[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
								);
							}
						}, 5000);
					}
				} else {
					console.warn('Invalid success URL parameters:', { status, timeSlot });
					// Show success message even if parameters are invalid
					if (!alertShown) {
						alertShown = true;
						WebBrowser.dismissBrowser();
						Alert.alert(
							'¡Pago Exitoso!',
							'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
							[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
						);
					}
				}
			}
			// Handle payment failure URLs
			else if (url.includes('app://payment/failed')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				// Parse URL parameters with better error handling
				let urlObj;
				try {
					urlObj = new URL(url);
				} catch (urlError) {
					console.error('Failed to parse URL:', url, urlError);
					return;
				}
				
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				// Handle failure even if some parameters are missing (embedded browser limitation)
				if (status === 'cancel') {
					// Navigate to failed screen with error details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					const errorMessage = urlObj.searchParams.get('errorMessage') || 'El pago no se pudo procesar. Por favor, intenta nuevamente.';
					
					// Decode URL parameters
					const decodedParams = {
						timeSlot: timeSlot ? decodeURIComponent(timeSlot) : 'TBD',
						appointmentDate: appointmentDate ? decodeURIComponent(appointmentDate) : 'TBD',
						serviceName: serviceName ? decodeURIComponent(serviceName) : 'Servicio',
						barberName: barberName ? decodeURIComponent(barberName) : 'Barbero',
						amount: amount ? decodeURIComponent(amount) : '0',
						errorMessage: errorMessage ? decodeURIComponent(errorMessage) : 'El pago no se pudo procesar. Por favor, intenta nuevamente.',
					};
					
					console.log('Attempting to navigate to failed screen with params:', decodedParams);
					
					// Wait for navigation to be ready and user to be authenticated
					const attemptNavigation = () => {
						try {
							// Check if user is authenticated and navigation is ready
							if (user && !isLoading) {
								router.replace({
									pathname: '/payment/failed',
									params: decodedParams
								});
								console.log('✅ Successfully navigated to payment failed screen');
								return true; // Navigation successful
							} else {
								console.log('Navigation not ready yet, retrying...');
								return false; // Navigation failed, will retry
							}
						} catch (navError) {
							console.error('Global navigation error in failure handler:', navError);
							// Fallback to alert if navigation fails
							WebBrowser.dismissBrowser();
							Alert.alert(
								'Pago Fallido',
								decodedParams.errorMessage || 'El pago no se pudo procesar. Por favor, intenta nuevamente.',
								[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
							);
							return true; // Don't retry after fallback
						}
					};
					
					// Try navigation immediately
					if (!attemptNavigation()) {
						// If failed, retry with increasing delays
						const retryDelays = [500, 1000, 2000];
						retryDelays.forEach((delay, index) => {
							setTimeout(() => {
								if (!attemptNavigation()) {
									console.log(`Navigation attempt ${index + 1} failed, will retry in ${retryDelays[index + 1] || 3000}ms`);
								}
							}, delay);
						});
						
						// Final fallback after 5 seconds
						setTimeout(() => {
							console.log('🔄 Final fallback: Showing failure alert');
							WebBrowser.dismissBrowser();
							Alert.alert(
								'Pago Fallido',
								decodedParams.errorMessage || 'El pago no se pudo procesar. Por favor, intenta nuevamente.',
								[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
							);
						}, 5000);
					}
				} else {
					console.warn('Invalid failure URL parameters:', { status, timeSlot });
					// Show failure message even if parameters are invalid
					WebBrowser.dismissBrowser();
					Alert.alert(
						'Pago Fallido',
						'El pago no se pudo procesar. Por favor, intenta nuevamente.',
						[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
					);
				}
			}
			// Handle legacy payment-callback URLs for backward compatibility
			else if (url.includes('app://payment-callback')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				// Parse URL parameters with better error handling
				let urlObj;
				try {
					urlObj = new URL(url);
				} catch (urlError) {
					console.error('Failed to parse URL:', url, urlError);
					return;
				}
				
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				// Handle legacy success even if some parameters are missing (embedded browser limitation)
				if (status === 'success') {
					// Navigate to success screen with appointment details
					const appointmentDate = urlObj.searchParams.get('appointmentDate');
					const serviceName = urlObj.searchParams.get('serviceName');
					const barberName = urlObj.searchParams.get('barberName');
					const amount = urlObj.searchParams.get('amount');
					
					// Decode URL parameters
					const decodedParams = {
						timeSlot: timeSlot ? decodeURIComponent(timeSlot) : 'TBD',
						appointmentDate: appointmentDate ? decodeURIComponent(appointmentDate) : 'TBD',
						serviceName: serviceName ? decodeURIComponent(serviceName) : 'Servicio',
						barberName: barberName ? decodeURIComponent(barberName) : 'Barbero',
						amount: amount ? decodeURIComponent(amount) : '0',
					};
					
					console.log('Attempting to navigate to success screen with legacy params:', decodedParams);
					
					// Wait for navigation to be ready and user to be authenticated
					const attemptNavigation = () => {
						try {
							// Check if user is authenticated and navigation is ready
							if (user && !isLoading) {
								router.replace({
									pathname: '/payment/success',
									params: decodedParams
								});
								console.log('✅ Successfully navigated to payment success screen (legacy)');
								return true; // Navigation successful
							} else {
								console.log('Navigation not ready yet, retrying...');
								return false; // Navigation failed, will retry
							}
						} catch (navError) {
							console.error('Global navigation error in legacy success handler:', navError);
							// Fallback to alert if navigation fails
							WebBrowser.dismissBrowser();
							Alert.alert(
								'¡Pago Exitoso!',
								'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
								[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
							);
							return true; // Don't retry after fallback
						}
					};
					
					// Try navigation immediately
					if (!attemptNavigation()) {
						// If failed, retry with increasing delays
						const retryDelays = [500, 1000, 2000];
						retryDelays.forEach((delay, index) => {
							setTimeout(() => {
								if (!attemptNavigation()) {
									console.log(`Navigation attempt ${index + 1} failed, will retry in ${retryDelays[index + 1] || 3000}ms`);
								}
							}, delay);
						});
						
						// Final fallback after 5 seconds
						setTimeout(() => {
							console.log('🔄 Final fallback: Showing success alert (legacy)');
							if (!alertShown) {
								alertShown = true;
								WebBrowser.dismissBrowser();
								Alert.alert(
									'¡Pago Exitoso!',
									'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
									[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
								);
							}
						}, 5000);
					}
				} else {
					console.warn('Invalid legacy URL parameters:', { status, timeSlot });
					// Show success message even if parameters are invalid
					WebBrowser.dismissBrowser();
					Alert.alert(
						'¡Pago Exitoso!',
						'Tu cita ha sido confirmada. Te esperamos en la fecha y hora seleccionada.',
						[{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
					);
				}
			}
		};

		// Function to set up payment callback expectation
		const expectPaymentCallback = () => {
			paymentCallbackExpected = true;
			console.log('💰 Payment callback expected - setting up timeout');
			
			// Set up timeout for payment callback
			paymentCallbackTimeout = setTimeout(() => {
				if (paymentCallbackExpected && !alertShown && !paymentCancelled) {
					console.log('⏰ Payment callback timeout - showing success message');
					paymentCallbackExpected = false;
					alertShown = true;
					
					// Show success message as fallback
					WebBrowser.dismissBrowser();
					Alert.alert(
						'¡Pago Procesado!',
						'Tu pago ha sido procesado. Si el pago fue exitoso, tu cita ha sido confirmada. Revisa tu historial para confirmar.',
						[
							{ 
								text: 'Ver Historial', 
								onPress: () => router.replace('/(tabs)/history') 
							},
							{ 
								text: 'OK', 
								onPress: () => router.replace('/(tabs)') 
							}
						]
					);
				}
			}, 10000); // 10 second timeout
		};

		// Expose the function globally for the appointment screen to use
		(global as any).expectPaymentCallback = expectPaymentCallback;

		// Function to clear payment callback expectation
		const clearPaymentCallback = () => {
			paymentCallbackExpected = false;
			paymentCancelled = true; // Mark payment as cancelled
			if (paymentCallbackTimeout) {
				clearTimeout(paymentCallbackTimeout);
				paymentCallbackTimeout = null;
			}
			console.log('💰 Payment callback cleared - user cancelled payment');
		};

		// Expose the clear function globally
		(global as any).clearPaymentCallback = clearPaymentCallback;

		const subscription = Linking.addEventListener('url', ({ url }) => {
			console.log('🔗 Expo Linking URL event received:', url);
			handleUrl(url);
		});

		// Check if app was opened from a URL
		Linking.getInitialURL().then((url) => {
			if (url) {
				console.log('🔗 Expo Linking initial URL:', url);
				handleUrl(url);
			}
		});

		// Add fallback for Safari deep link issues
		const checkSafariDeepLink = async () => {
			try {
				const canOpen = await Linking.canOpenURL('app://payment/success');
				console.log('🔗 Can open deep link:', canOpen);
				
				if (!canOpen) {
					console.warn('⚠️ Deep link not available - Safari may show "path cannot be found"');
				}
			} catch (error) {
				console.error('❌ Error checking deep link availability:', error);
			}
		};

		// Check deep link availability after a delay
		setTimeout(checkSafariDeepLink, 2000);

		// Add monitoring for embedded browser failures
		const monitorEmbeddedBrowserFailure = () => {
			// This will be called when we detect that the embedded browser failed
			console.log('🔄 Detected embedded browser failure - showing fallback message');
			if (!alertShown && !paymentCancelled) {
				alertShown = true;
				WebBrowser.dismissBrowser();
				Alert.alert(
					'Pago Procesado',
					'El pago ha sido procesado. Si el pago fue exitoso, tu cita ha sido confirmada. Revisa tu historial para confirmar.',
					[
						{ 
							text: 'Ver Historial', 
							onPress: () => router.replace('/(tabs)/history') 
						},
						{ 
							text: 'OK', 
							onPress: () => router.replace('/(tabs)') 
						}
					]
				);
			}
		};

		// Expose the failure handler globally
		(global as any).handleEmbeddedBrowserFailure = monitorEmbeddedBrowserFailure;

		return () => subscription?.remove();
	}, [router, user, isLoading]);

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
					{/* Payment screens available even when not authenticated for deep link handling */}
					<Stack.Screen name="payment/success" options={{ headerShown: false }} />
					<Stack.Screen name="payment/failed" options={{ headerShown: false }} />
					<Stack.Screen name="payment/test" options={{ headerShown: false }} />
					<Stack.Screen name="payment/debug" options={{ headerShown: false }} />
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
