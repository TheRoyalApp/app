// React Native core imports
import { SafeAreaView } from 'react-native-safe-area-context';
import {
	ScrollView,
	TouchableOpacity,
	Image,
	StyleSheet,
	View,
	TextInput,
	Alert,
	Modal,
	Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';

export default function ProfileScreen() {
	const { user, signOut } = useAuth();
	const [isEditing, setIsEditing] = useState(false);
	const [showNotificationsModal, setShowNotificationsModal] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [notificationSettings, setNotificationSettings] = useState({
		pushNotifications: true,
		emailNotifications: true,
		smsNotifications: false,
		appointmentReminders: true,
		promotionalOffers: false,
	});

	const [userData, setUserData] = useState({
		firstName: user?.name?.split(' ')[0] || 'Usuario',
		lastName: user?.name?.split(' ').slice(1).join(' ') || '',
		email: user?.email || 'usuario@ejemplo.com',
		phone: '+34 612 345 678',
	});

	const handleSave = () => {
		// Here you would typically save to your backend
		Alert.alert('Éxito', '¡Perfil actualizado correctamente!');
		setIsEditing(false);
	};

	const handleCancel = () => {
		// Reset to original data
		setUserData({
			firstName: user?.name?.split(' ')[0] || 'Usuario',
			lastName: user?.name?.split(' ').slice(1).join(' ') || '',
			email: user?.email || 'usuario@ejemplo.com',
			phone: '+34 612 345 678',
		});
		setIsEditing(false);
	};

	const handleLogout = async () => {
		try {
			await signOut();
			setShowLogoutModal(false);
		} catch (error) {
			Alert.alert('Error', 'Ocurrió un error al cerrar sesión');
		}
	};

	const handleNotificationSave = () => {
		// Here you would typically save notification settings to backend
		Alert.alert('Éxito', '¡Configuración de notificaciones guardada!');
		setShowNotificationsModal(false);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
			<MaskedView
				style={{ flex: 1 }}
				maskElement={
					<LinearGradient
						style={{ flex: 1 }}
						colors={['black', 'black', 'transparent']}
						locations={[0, 0.95, 1]}
					/>
				}
			>
				<ScrollView showsVerticalScrollIndicator={false}>
					<Container>
						{/* Header */}
						<View style={styles.header}>
							<View style={styles.headerContent}>
								<ThemeText style={styles.headerTitle}>Mi Perfil</ThemeText>
							</View>
							{!isEditing ? (
								<TouchableOpacity
									style={styles.editButton}
									onPress={() => setIsEditing(true)}
								>
									<Ionicons name="pencil" size={20} color={Colors.dark.primary} />
								</TouchableOpacity>
							) : (
								<View style={styles.editActions}>
									<TouchableOpacity
										style={styles.actionButton}
										onPress={handleCancel}
									>
										<ThemeText style={styles.cancelText}>Cancelar</ThemeText>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.actionButton, styles.saveButton]}
										onPress={handleSave}
									>
										<ThemeText style={styles.saveText}>Guardar</ThemeText>
									</TouchableOpacity>
								</View>
							)}
						</View>

						{/* Stats Card */}
						<View style={styles.statsCard}>
							<View style={styles.statsContent}>
								<View style={styles.statIcon}>
									<Ionicons
										name="calendar"
										size={24}
										color={Colors.dark.primary}
									/>
								</View>
								<View style={styles.statInfo}>
									<ThemeText style={styles.statNumber}>12</ThemeText>
									<ThemeText style={styles.statLabel}>Citas Totales</ThemeText>
								</View>
							</View>
						</View>

						{/* Profile Information Card */}
						<View style={styles.profileCard}>
							<View style={styles.cardHeader}>
								<Ionicons
									name="person-circle"
									size={24}
									color={Colors.dark.primary}
								/>
								<ThemeText style={styles.cardTitle}>
									Información Personal
								</ThemeText>
							</View>

							<View style={styles.formSection}>
								<View style={styles.inputGroup}>
									<ThemeText style={styles.inputLabel}>Nombre</ThemeText>
									{isEditing ? (
										<TextInput
											style={styles.textInput}
											value={userData.firstName}
											onChangeText={text =>
												setUserData({ ...userData, firstName: text })
											}
											placeholderTextColor={Colors.dark.textLight}
										/>
									) : (
										<View style={styles.displayContainer}>
											<ThemeText style={styles.displayText}>
												{userData.firstName}
											</ThemeText>
										</View>
									)}
								</View>

								<View style={styles.inputGroup}>
									<ThemeText style={styles.inputLabel}>Apellidos</ThemeText>
									{isEditing ? (
										<TextInput
											style={styles.textInput}
											value={userData.lastName}
											onChangeText={text =>
												setUserData({ ...userData, lastName: text })
											}
											placeholderTextColor={Colors.dark.textLight}
										/>
									) : (
										<View style={styles.displayContainer}>
											<ThemeText style={styles.displayText}>
												{userData.lastName}
											</ThemeText>
										</View>
									)}
								</View>

								<View style={styles.inputGroup}>
									<ThemeText style={styles.inputLabel}>
										Correo Electrónico
									</ThemeText>
									{isEditing ? (
										<TextInput
											style={styles.textInput}
											value={userData.email}
											onChangeText={text =>
												setUserData({ ...userData, email: text })
											}
											placeholderTextColor={Colors.dark.textLight}
											keyboardType="email-address"
										/>
									) : (
										<View style={styles.displayContainer}>
											<ThemeText style={styles.displayText}>
												{userData.email}
											</ThemeText>
										</View>
									)}
								</View>

								<View style={styles.inputGroup}>
									<ThemeText style={styles.inputLabel}>
										Número de Teléfono
									</ThemeText>
									{isEditing ? (
										<TextInput
											style={styles.textInput}
											value={userData.phone}
											onChangeText={text =>
												setUserData({ ...userData, phone: text })
											}
											placeholderTextColor={Colors.dark.textLight}
											keyboardType="phone-pad"
										/>
									) : (
										<View style={styles.displayContainer}>
											<ThemeText style={styles.displayText}>
												{userData.phone}
											</ThemeText>
										</View>
									)}
								</View>
							</View>
						</View>

						{/* Settings Card */}
						<View style={styles.settingsCard}>
							<View style={styles.cardHeader}>
								<Ionicons name="settings" size={24} color={Colors.dark.primary} />
								<ThemeText style={styles.cardTitle}>Configuración</ThemeText>
							</View>

							<TouchableOpacity
								style={styles.menuItem}
								onPress={() => setShowNotificationsModal(true)}
							>
								<View style={styles.menuItemLeft}>
									<View style={[styles.menuIcon, { backgroundColor: '#ffcc00' }]}>
										<Ionicons
											name="notifications-outline"
											size={20}
											color={Colors.dark.background}
										/>
									</View>
									<View style={styles.menuText}>
										<ThemeText style={styles.menuTitle}>Notificaciones</ThemeText>
										<ThemeText style={styles.menuSubtitle}>
											Gestionar preferencias de notificaciones
										</ThemeText>
									</View>
								</View>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={Colors.dark.textLight}
								/>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.menuItem}
								onPress={() => setShowLogoutModal(true)}
							>
								<View style={styles.menuItemLeft}>
									<View style={[styles.menuIcon, { backgroundColor: '#ff3b30' }]}>
										<Ionicons
											name="log-out-outline"
											size={20}
											color={Colors.dark.background}
										/>
									</View>
									<View style={styles.menuText}>
										<ThemeText style={styles.menuTitle}>Cerrar Sesión</ThemeText>
										<ThemeText style={styles.menuSubtitle}>
											Salir de tu cuenta
										</ThemeText>
									</View>
								</View>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={Colors.dark.textLight}
								/>
							</TouchableOpacity>
						</View>

						{/* App Version */}
						<View style={styles.versionSection}>
							<ThemeText style={styles.versionText}>Versión 1.0.0</ThemeText>
						</View>
					</Container>
				</ScrollView>
			</MaskedView>

			{/* Notifications Modal */}
			<Modal
				visible={showNotificationsModal}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowNotificationsModal(false)}
			>
				<SafeAreaView
					style={{ flex: 1, backgroundColor: Colors.dark.background }}
				>
					<View style={styles.modalHeader}>
						<TouchableOpacity
							style={styles.modalCloseButton}
							onPress={() => setShowNotificationsModal(false)}
						>
							<Ionicons name="close" size={24} color={Colors.dark.text} />
						</TouchableOpacity>
						<ThemeText style={styles.modalTitle}>Notificaciones</ThemeText>
						<TouchableOpacity
							style={styles.modalSaveButton}
							onPress={handleNotificationSave}
						>
							<ThemeText style={styles.modalSaveText}>Guardar</ThemeText>
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.modalContent}>
						<View style={styles.notificationSection}>
							<View style={styles.notificationItem}>
								<View style={styles.notificationInfo}>
									<ThemeText style={styles.notificationTitle}>
										Notificaciones Push
									</ThemeText>
									<ThemeText style={styles.notificationSubtitle}>
										Recibir notificaciones en el dispositivo
									</ThemeText>
								</View>
								<Switch
									value={notificationSettings.pushNotifications}
									onValueChange={value =>
										setNotificationSettings({
											...notificationSettings,
											pushNotifications: value,
										})
									}
									trackColor={{
										false: Colors.dark.gray,
										true: Colors.dark.primary,
									}}
									thumbColor={Colors.dark.background}
								/>
							</View>

							<View style={styles.notificationItem}>
								<View style={styles.notificationInfo}>
									<ThemeText style={styles.notificationTitle}>
										Notificaciones SMS
									</ThemeText>
									<ThemeText style={styles.notificationSubtitle}>
										Recibir notificaciones por mensaje de texto
									</ThemeText>
								</View>
								<Switch
									value={notificationSettings.smsNotifications}
									onValueChange={value =>
										setNotificationSettings({
											...notificationSettings,
											smsNotifications: value,
										})
									}
									trackColor={{
										false: Colors.dark.gray,
										true: Colors.dark.primary,
									}}
									thumbColor={Colors.dark.background}
								/>
							</View>

							<View style={styles.notificationItem}>
								<View style={styles.notificationInfo}>
									<ThemeText style={styles.notificationTitle}>
										Recordatorios de Citas
									</ThemeText>
									<ThemeText style={styles.notificationSubtitle}>
										Recordatorios antes de tus citas
									</ThemeText>
								</View>
								<Switch
									value={notificationSettings.appointmentReminders}
									onValueChange={value =>
										setNotificationSettings({
											...notificationSettings,
											appointmentReminders: value,
										})
									}
									trackColor={{
										false: Colors.dark.gray,
										true: Colors.dark.primary,
									}}
									thumbColor={Colors.dark.background}
								/>
							</View>

							<View style={styles.notificationItem}>
								<View style={styles.notificationInfo}>
									<ThemeText style={styles.notificationTitle}>
										Ofertas Promocionales
									</ThemeText>
									<ThemeText style={styles.notificationSubtitle}>
										Recibir ofertas y descuentos especiales
									</ThemeText>
								</View>
								<Switch
									value={notificationSettings.promotionalOffers}
									onValueChange={value =>
										setNotificationSettings({
											...notificationSettings,
											promotionalOffers: value,
										})
									}
									trackColor={{
										false: Colors.dark.gray,
										true: Colors.dark.primary,
									}}
									thumbColor={Colors.dark.background}
								/>
							</View>
						</View>
					</ScrollView>
				</SafeAreaView>
			</Modal>

			{/* Logout Modal */}
			<Modal
				visible={showLogoutModal}
				animationType="fade"
				transparent={true}
				onRequestClose={() => setShowLogoutModal(false)}
			>
				<View style={styles.overlay}>
					<View style={styles.logoutModal}>
						<View style={styles.logoutIcon}>
							<Ionicons name="log-out" size={48} color={Colors.dark.primary} />
						</View>

						<ThemeText style={styles.logoutTitle}>¿Cerrar Sesión?</ThemeText>
						<ThemeText style={styles.logoutMessage}>
							¿Estás seguro de que quieres cerrar sesión? Tendrás que volver a
							iniciar sesión para acceder a tu cuenta.
						</ThemeText>

						<View style={styles.logoutActions}>
							<TouchableOpacity
								style={styles.logoutCancelButton}
								onPress={() => setShowLogoutModal(false)}
							>
								<ThemeText style={styles.logoutCancelText}>Cancelar</ThemeText>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.logoutConfirmButton}
								onPress={handleLogout}
							>
								<ThemeText style={styles.logoutConfirmText}>
									Cerrar Sesión
								</ThemeText>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 30,
		paddingTop: 20,
	},
	headerContent: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	editButton: {
		padding: 12,
		backgroundColor: Colors.dark.tint,
		borderRadius: 12,
	},
	editActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginLeft: 8,
		borderRadius: 8,
	},
	saveButton: {
		backgroundColor: Colors.dark.primary,
	},
	cancelText: {
		color: Colors.dark.textLight,
		fontSize: 16,
	},
	saveText: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: '500',
	},
	statsCard: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		marginBottom: 24,
	},
	statsContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: Colors.dark.background,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	statInfo: {
		flex: 1,
	},
	statNumber: {
		fontSize: 28,
		fontWeight: 'bold',
		color: Colors.dark.primary,
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	profileCard: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		marginBottom: 24,
	},
	settingsCard: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		marginBottom: 24,
	},
	cardHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	cardTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginLeft: 12,
		color: Colors.dark.primary,
	},
	formSection: {
		gap: 20,
	},
	inputGroup: {
		gap: 8,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '500',
		color: Colors.dark.textLight,
		marginLeft: 4,
	},
	textInput: {
		backgroundColor: Colors.dark.background,
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		color: Colors.dark.text,
		borderWidth: 1,
		borderColor: Colors.dark.gray,
	},
	displayContainer: {
		backgroundColor: Colors.dark.background,
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: Colors.dark.gray,
	},
	displayText: {
		fontSize: 16,
		color: Colors.dark.text,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: Colors.dark.background,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	menuItemLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	menuIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	menuText: {
		flex: 1,
	},
	menuTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 2,
	},
	menuSubtitle: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	versionSection: {
		alignItems: 'center',
		paddingVertical: 20,
	},
	versionText: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	// Modal Styles
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
		borderBottomColor: Colors.dark.gray,
	},
	modalCloseButton: {
		padding: 8,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '600',
		color: Colors.dark.primary,
	},
	modalSaveButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: Colors.dark.primary,
		borderRadius: 8,
	},
	modalSaveText: {
		color: Colors.dark.background,
		fontSize: 16,
		fontWeight: '500',
	},
	modalContent: {
		flex: 1,
		paddingHorizontal: 20,
	},
	notificationSection: {
		paddingVertical: 20,
	},
	notificationItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: Colors.dark.tint,
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	notificationInfo: {
		flex: 1,
		marginRight: 16,
	},
	notificationTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	notificationSubtitle: {
		fontSize: 14,
		color: Colors.dark.textLight,
	},
	// Logout Modal Styles
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	logoutModal: {
		backgroundColor: Colors.dark.tint,
		borderRadius: 20,
		padding: 24,
		alignItems: 'center',
		width: '100%',
		maxWidth: 320,
	},
	logoutIcon: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: Colors.dark.background,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
	},
	logoutTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
	},
	logoutMessage: {
		fontSize: 16,
		color: Colors.dark.textLight,
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
	},
	logoutActions: {
		flexDirection: 'row',
		gap: 12,
		width: '100%',
	},
	logoutCancelButton: {
		flex: 1,
		borderRadius: 12,
		backgroundColor: Colors.dark.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	logoutCancelText: {
		fontSize: 16,
		color: Colors.dark.text,
		fontWeight: '500',
	},
	logoutConfirmButton: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		backgroundColor: '#ff3b30',
		alignItems: 'center',
	},
	logoutConfirmText: {
		fontSize: 16,
		color: Colors.dark.background,
		fontWeight: '500',
		textAlign: 'center',
	},
});
