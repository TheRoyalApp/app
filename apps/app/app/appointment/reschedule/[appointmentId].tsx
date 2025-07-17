import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ThemeText, Container } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/Button';
import { StatusBar } from 'react-native';
import { AppointmentsService } from '@/services';
import { Appointment } from '@/services';
import { apiClient } from '@/services/api';
import { useAuth } from '@/components/auth/AuthContext';

export default function RescheduleScreen() {
    const { appointmentId } = useLocalSearchParams();
    const { user, isLoading: authLoading } = useAuth();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiReady, setApiReady] = useState(false);

    // Force API client to re-initialize every time this screen is entered
    useEffect(() => {
        apiClient.initialize().then(() => setApiReady(true));
    }, [appointmentId, user]);

    // Fetch appointment data from API only after auth and api are ready
    useEffect(() => {
        if (!apiReady || authLoading || !user) return;
        if (!appointmentId) {
            Alert.alert(
                'Error',
                'No se encontró el ID de la cita. Intenta de nuevo desde el historial.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
            setIsLoading(false);
            return;
        }
        // Debug: log token and headers
        const headers = (apiClient as any).getHeaders();
        console.log('=== RESCHEDULE DEBUG ===');
        console.log('Token:', (apiClient as any).accessToken);
        console.log('Headers:', headers);
        console.log('User:', user);
        console.log('AppointmentId:', appointmentId);
        console.log('========================');
        loadAppointment();
    }, [appointmentId, apiReady, authLoading, user]);

    const loadAppointment = async () => {
        try {
            setIsLoading(true);
            const response = await AppointmentsService.getAppointmentById(appointmentId as string);
            if (response.success && response.data) {
                setAppointment(response.data);
            } else {
                Alert.alert(
                    "Error",
                    response.error || "No se pudo cargar la información de la cita",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            }
        } catch (error) {
            console.error('Error loading appointment:', error);
            Alert.alert(
                "Error",
                "No se pudo cargar la información de la cita",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        let date: Date;
        if (dateString.includes('/')) {
            const [day, month, year] = dateString.split('/');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
            date = new Date(dateString);
        }
        return date.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return "";
        const [hour] = timeString.split(':');
        const hourNum = parseInt(hour);
        const period = hourNum >= 12 ? "PM" : "AM";
        const displayHour = hourNum > 12 ? hourNum - 12 : hourNum;
        return `${displayHour}:00 ${period}`;
    };

    const canReschedule = () => {
        if (!appointment) return false;
        const canRescheduleStatus = appointment.status === 'confirmed' || appointment.status === 'pending';
        const canRescheduleCount = (appointment.rescheduleCount || 0) < 1;
        return canRescheduleStatus && canRescheduleCount;
    };

    const handleReschedule = () => {
        if (!appointment) return;
        if (!canReschedule()) {
            Alert.alert(
                "No se puede reprogramar",
                "Esta cita ya ha sido reprogramada el máximo de veces permitido o no está en un estado válido para reprogramar.",
                [{ text: "OK" }]
            );
            return;
        }
        setIsRescheduling(true);
    };

    const convertDateToBackendFormat = (dateString: string): string => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleConfirmReschedule = async (date: string, time: string) => {
        if (!appointment) return;
        Alert.alert(
            "Confirmar Reprogramación",
            `¿Estás seguro de que quieres reprogramar tu cita de "${appointment.service?.name || 'Servicio'}"?\n\nFecha actual: ${formatDate(appointment.appointmentDate)} a las ${formatTime(appointment.timeSlot)}\nNueva fecha: ${formatDate(date)} a las ${formatTime(time)}`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        await performReschedule(date, time);
                    }
                }
            ]
        );
    };

    const performReschedule = async (date: string, time: string) => {
        if (!appointment) return;
        try {
            setIsSubmitting(true);
            const backendDate = convertDateToBackendFormat(date);
            const response = await AppointmentsService.rescheduleAppointment(
                appointment.id,
                backendDate,
                time
            );
            if (response.success && response.data) {
                Alert.alert(
                    "¡Cita Reprogramada!",
                    `Tu cita ha sido reprogramada exitosamente para ${formatDate(date)} a las ${formatTime(time)}.`,
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.replace('/(tabs)/history');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert(
                    "Error al Reprogramar",
                    response.error || "No se pudo reprogramar la cita. Por favor, intenta nuevamente.",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error('Error rescheduling appointment:', error);
            Alert.alert(
                "Error al Reprogramar",
                "Ocurrió un error al reprogramar la cita. Por favor, intenta nuevamente.",
                [{ text: "OK" }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            "Cancelar Reprogramación",
            "¿Estás seguro de que quieres cancelar la reprogramación?",
            [
                {
                    text: "Continuar",
                    style: "cancel"
                },
                {
                    text: "Cancelar",
                    onPress: () => router.back()
                }
            ]
        );
    };

    if (authLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
                <Container style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                    <ThemeText style={styles.loadingText}>Cargando autenticación...</ThemeText>
                </Container>
            </SafeAreaView>
        );
    }

    if (!user) {
        // Redirect to welcome screen if there's no session
        router.replace('/auth/welcome');
        return null;
    }

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
                <Container style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                    <ThemeText style={styles.loadingText}>Cargando información de la cita...</ThemeText>
                </Container>
            </SafeAreaView>
        );
    }

    if (!appointment) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
                <Container style={styles.container}>
                    <ThemeText style={styles.errorText}>No se encontró la cita especificada.</ThemeText>
                    <Button onPress={() => router.back()}>
                        Volver
                    </Button>
                </Container>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }} edges={['bottom']}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Reprogramar Cita',
                    headerBackTitle: 'Volver',
                    headerStyle: { backgroundColor: Colors.dark.background },
                    headerTintColor: '#fff'
                }}
            />
            <ScrollView style={styles.scrollView}>
                <Container style={styles.container}>
                    {/* Current Appointment Info */}
                    <View style={styles.section}>
                        <ThemeText style={styles.sectionTitle}>
                            Cita Actual
                        </ThemeText>
                        <View style={styles.appointmentCard}>
                            <ThemeText style={styles.serviceTitle}>
                                {appointment.service?.name || 'Servicio'}
                            </ThemeText>
                            <View style={styles.appointmentDetails}>
                                <ThemeText style={styles.detailText}>
                                    📅 {formatDate(appointment.appointmentDate)}
                                </ThemeText>
                                <ThemeText style={styles.detailText}>
                                    🕐 {formatTime(appointment.timeSlot)}
                                </ThemeText>
                                {appointment.barber && (
                                    <ThemeText style={styles.detailText}>
                                        👨‍💼 {appointment.barber.name}
                                    </ThemeText>
                                )}
                                {appointment.service && (
                                    <ThemeText style={styles.detailText}>
                                        💰 ${appointment.service.price}
                                    </ThemeText>
                                )}
                            </View>
                        </View>
                    </View>
                    {/* Reschedule Status */}
                    <View style={styles.section}>
                        <View style={styles.statusCard}>
                            <ThemeText style={styles.statusTitle}>
                                Estado de Reprogramación
                            </ThemeText>
                            <ThemeText style={styles.statusText}>
                                {canReschedule()
                                    ? "✅ Puedes reprogramar esta cita"
                                    : "❌ Esta cita ya no puede ser reprogramada"
                                }
                            </ThemeText>
                            <ThemeText style={styles.statusSubtext}>
                                Reprogramaciones realizadas: {appointment.rescheduleCount || 0}/1
                            </ThemeText>
                            <ThemeText style={styles.statusSubtext}>
                                Estado: {appointment.status === 'confirmed' ? 'Confirmada' :
                                    appointment.status === 'pending' ? 'Pendiente' :
                                        appointment.status === 'completed' ? 'Completada' :
                                            appointment.status === 'cancelled' ? 'Cancelada' :
                                                appointment.status}
                            </ThemeText>
                        </View>
                    </View>
                    {/* Reschedule Button */}
                    {canReschedule() && !isRescheduling && (
                        <View style={styles.section}>
                            <Button onPress={handleReschedule}>
                                Reprogramar Cita
                            </Button>
                        </View>
                    )}
                    {/* Date/Time Picker for Rescheduling */}
                    {isRescheduling && (
                        <View style={styles.section}>
                            <ThemeText style={styles.sectionTitle}>
                                Seleccionar Nueva Fecha y Hora
                            </ThemeText>
                            <DatePicker
                                barberId={appointment.barberId}
                                onDateSelect={setSelectedDate}
                                onTimeSelect={setSelectedTime}
                                onConfirm={handleConfirmReschedule}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                title="Reprogramar Cita"
                                subtitle="Elige la nueva fecha y hora"
                                confirmButtonText="Confirmar Reprogramación"
                            />
                        </View>
                    )}
                    {/* Cancel Button */}
                    {isRescheduling && (
                        <View style={styles.section}>
                            <Button
                                onPress={handleCancel}
                                secondary
                                disabled={isSubmitting}
                            >
                                Cancelar Reprogramación
                            </Button>
                        </View>
                    )}
                    {/* Loading indicator for submission */}
                    {isSubmitting && (
                        <View style={styles.section}>
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={Colors.dark.primary} />
                                <ThemeText style={styles.loadingText}>Procesando reprogramación...</ThemeText>
                            </View>
                        </View>
                    )}
                </Container>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.dark.textLight,
    },
    errorText: {
        fontSize: 16,
        color: Colors.dark.textLight,
        textAlign: 'center',
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    appointmentCard: {
        backgroundColor: Colors.dark.gray,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.primary,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: Colors.dark.primary,
    },
    appointmentDetails: {
        gap: 8,
    },
    detailText: {
        fontSize: 16,
        color: Colors.dark.text,
    },
    statusCard: {
        backgroundColor: Colors.dark.gray,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.textLight,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 14,
        marginBottom: 4,
    },
    statusSubtext: {
        fontSize: 12,
        color: Colors.dark.textLight,
    },
});