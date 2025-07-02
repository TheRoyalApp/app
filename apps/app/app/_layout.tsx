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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
