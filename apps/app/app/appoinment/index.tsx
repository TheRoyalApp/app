// React core imports
import React, { useState, useEffect } from 'react';

// React Native core imports
import { StatusBar, View, FlatList, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party library imports
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import ServiceCard from '@/components/services/Card';
import AppointmentDatePicker from '@/components/ui/AppointmentDatePicker';
import Colors from '@/constants/Colors';
import { haircuts, spa, ServiceInterface } from '@/constants/services';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';
import { ServicesService, AppointmentsService } from '@/services';
import { Service, CreateAppointmentData } from '@/services';

export default function AppoinmentScreen() {
	const { user } = useAuth();
	const [services, setServices] = useState<Service[]>([]);
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [isBooking, setIsBooking] = useState(false);
	const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);

	// Real barber ID - Carlos Rodriguez (staff)
	const barberId = '1061e9a5-51f4-4919-9b10-1100b0ab2188';

	
	useEffect(() => {
		loadServices();
	}, []);

	const loadServices = async () => {
		try {
			setIsLoading(true);
			const response = await ServicesService.getActiveServices();
			
			if (response.success && response.data) {
				setServices(response.data);
			} else {
				Alert.alert('Error', 'Failed to load services');
			}
		} catch (error) {
			console.error('Error loading services:', error);
			Alert.alert('Error', 'Failed to load services');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDateSelect = (date: string) => {
		setSelectedDate(date);
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
	};

	const handleServiceSelect = (service: Service) => {
		setSelectedService(service);
		setSelectedServiceName(service.name);
	};

	const handleBooking = async () => {
		
		if (!user?.id) {
			Alert.alert('Error', 'Please log in to book an appointment');
			return;
		}

		if (!selectedService || !selectedDate || !selectedTime) {
			Alert.alert('Error', 'Please select a service, date, and time');
			return;
		}

		try {
			setIsBooking(true);
			
			const appointmentData: CreateAppointmentData = {
				userId: user?.id || '',
				barberId,
				serviceId: selectedService.id,
				appointmentDate: selectedDate,
				timeSlot: selectedTime,
			};

			const response = await AppointmentsService.createAppointment(appointmentData);
			
			if (response.success && response.data) {
				Alert.alert(
					'Success',
					'Appointment booked successfully!',
					[
						{
							text: 'OK',
							onPress: () => router.push('/appoinment/confirmation'),
						},
					]
				);
			} else {
				Alert.alert('Error', response.error || 'Failed to book appointment');
			}
		} catch (error) {
			console.error('Error booking appointment:', error);
			Alert.alert('Error', 'Failed to book appointment');
		} finally {
			setIsBooking(false);
		}
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatPrice = (price: string | number) => {
		const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
		}).format(numericPrice);
	};

	if (isLoading) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color={Colors.dark.primary} />
				<ThemeText style={{ marginTop: 10 }}>Loading services...</ThemeText>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
			<ScrollView>
				<Container>
					<ThemeText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
						Agendar Cita
					</ThemeText>

					{/* Services Section - Fixed Height Vertical Scroll */}
					<View style={{ marginBottom: 30 }}>
						<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
							Seleccionar Servicio
						</ThemeText>
						<ScrollView 
							showsVerticalScrollIndicator={false}
							style={{ 
								height: 220, // Fixed height to maintain layout
								borderRadius: 10,
								backgroundColor: 'rgba(255, 255, 255, 0.05)'
							}}
							contentContainerStyle={{ 
								padding: 10,
								gap: 12 
							}}
						>
							{services.map((service) => (
								<ServiceCard
									key={service.id}
									title={service.name}
									price={service.price}
									description={service.description || ''}
									selected={[selectedServiceName, (serviceName) => {
										setSelectedServiceName(serviceName);
										if (serviceName) {
											const foundService = services.find(s => s.name === serviceName);
											setSelectedService(foundService || null);
										} else {
											setSelectedService(null);
										}
									}]}
								/>
							))}
						</ScrollView>
					</View>

					{/* Date and Time Selection */}
					<View style={{ marginBottom: 30 }}>
						<AppointmentDatePicker
							barberId={barberId}
							onDateSelect={setSelectedDate}
							onTimeSelect={setSelectedTime}
							showConfirmButton={false}
							showSummary={false}
							title="Seleccionar Fecha y Hora"
							subtitle="Elige la fecha y hora de tu cita"
						/>
					</View>

					{/* Booking Summary */}
					{selectedService && selectedDate && selectedTime && (
						<View style={{ marginBottom: 30, padding: 15, backgroundColor: Colors.dark.gray, borderRadius: 10 }}>
							<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
								Resumen de la Cita
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Servicio: {selectedService.name}
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Precio: {formatPrice(selectedService.price)}
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Duración: {selectedService.duration} minutos
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Fecha: {new Date(selectedDate).toLocaleDateString('es-ES')}
							</ThemeText>
							<ThemeText>
								Hora: {formatTime(selectedTime)}
							</ThemeText>
						</View>
					)}

					{/* Book Button */}
					<Button
						onPress={handleBooking}
						disabled={!selectedService || !selectedDate || !selectedTime || isBooking}
						style={{ marginBottom: 20 }}
					>
						{isBooking ? 'Reservando...' : 'Reservar Cita'}
					</Button>

					<Button secondary onPress={() => router.back()}>
						Cancelar
					</Button>
				</Container>
			</ScrollView>
		</SafeAreaView>
	);
}
