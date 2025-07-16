import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function DebugDeepLinks() {
	const testSuccessDeepLink = () => {
		const testUrl = 'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00';
		console.log('🧪 Testing success deep link:', testUrl);
		Linking.openURL(testUrl);
	};

	const testFailedDeepLink = () => {
		const testUrl = 'app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Test%20error%20message';
		console.log('🧪 Testing failed deep link:', testUrl);
		Linking.openURL(testUrl);
	};

	const testLegacyDeepLink = () => {
		const testUrl = 'app://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00';
		console.log('🧪 Testing legacy deep link:', testUrl);
		Linking.openURL(testUrl);
	};

	const showDebugInfo = () => {
		Alert.alert(
			'Debug Info',
			'Check the console for detailed logs about deep link handling.\n\nLook for:\n• 🔗 Global URL handler received\n• 👤 Current user state\n• ⏳ Loading state\n• Navigation attempts',
			[{ text: 'OK' }]
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Deep Link Debug</Text>
				<Text style={styles.subtitle}>
					Test deep link functionality for payment callbacks
				</Text>

				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.successButton} onPress={testSuccessDeepLink}>
						<Text style={styles.buttonText}>Test Success Deep Link</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.failedButton} onPress={testFailedDeepLink}>
						<Text style={styles.buttonText}>Test Failed Deep Link</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.legacyButton} onPress={testLegacyDeepLink}>
						<Text style={styles.buttonText}>Test Legacy Deep Link</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.infoButton} onPress={showDebugInfo}>
						<Text style={styles.buttonText}>Show Debug Info</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.infoContainer}>
					<Text style={styles.infoTitle}>How to Test:</Text>
					<Text style={styles.infoText}>
						1. Press any test button above{'\n'}
						2. Check if the app navigates to the correct screen{'\n'}
						3. Check console logs for debugging info{'\n'}
						4. If navigation fails, check the console for error messages
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.dark.background,
	},
	content: {
		flex: 1,
		padding: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: Colors.dark.text,
		textAlign: 'center',
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		color: Colors.dark.textLight,
		textAlign: 'center',
		marginBottom: 40,
		lineHeight: 24,
	},
	buttonContainer: {
		width: '100%',
		marginBottom: 40,
	},
	successButton: {
		backgroundColor: Colors.dark.success,
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		alignItems: 'center',
	},
	failedButton: {
		backgroundColor: Colors.dark.error,
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		alignItems: 'center',
	},
	legacyButton: {
		backgroundColor: Colors.dark.primary,
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		alignItems: 'center',
	},
	infoButton: {
		backgroundColor: Colors.dark.tint,
		padding: 16,
		borderRadius: 8,
		marginBottom: 12,
		alignItems: 'center',
	},
	buttonText: {
		color: Colors.dark.text,
		fontSize: 16,
		fontWeight: '600',
	},
	infoContainer: {
		width: '100%',
		backgroundColor: Colors.dark.tint,
		borderRadius: 12,
		padding: 20,
	},
	infoTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: Colors.dark.text,
		marginBottom: 12,
	},
	infoText: {
		fontSize: 14,
		color: Colors.dark.textLight,
		lineHeight: 20,
	},
}); 