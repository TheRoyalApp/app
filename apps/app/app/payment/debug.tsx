import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function PaymentDebugScreen() {
	const router = useRouter();

	const testSuccessDeepLink = () => {
		const testUrl = 'app://payment/success?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00';
		Linking.openURL(testUrl);
	};

	const testFailedDeepLink = () => {
		const testUrl = 'app://payment/failed?status=cancel&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00&errorMessage=Test%20error%20message';
		Linking.openURL(testUrl);
	};

	const testLegacyDeepLink = () => {
		const testUrl = 'app://payment-callback?status=success&timeSlot=14:30&appointmentDate=15/07/2025&serviceName=Corte%20Cl%C3%A1sico&barberName=Juan%20P%C3%A9rez&amount=250.00';
		Linking.openURL(testUrl);
	};

	const goBack = () => {
		router.back();
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Payment Deep Link Debug</Text>
				<Text style={styles.subtitle}>
					Test deep link handling for payment screens
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

					<TouchableOpacity style={styles.backButton} onPress={goBack}>
						<Text style={styles.backButtonText}>Go Back</Text>
					</TouchableOpacity>
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
		gap: 16,
	},
	successButton: {
		backgroundColor: Colors.dark.success,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
	},
	failedButton: {
		backgroundColor: Colors.dark.error,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
	},
	legacyButton: {
		backgroundColor: Colors.dark.warning,
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: 'center',
	},
	buttonText: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: '600',
	},
	backButton: {
		backgroundColor: 'transparent',
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: Colors.dark.primary,
		alignItems: 'center',
		marginTop: 20,
	},
	backButtonText: {
		color: Colors.dark.primary,
		fontSize: 16,
		fontWeight: '600',
	},
}); 