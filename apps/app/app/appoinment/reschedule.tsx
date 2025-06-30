import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { ThemeText, Container } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import DatePicker from '@/components/ui/DatePicker';
import Button from '@/components/Button';
import { StatusBar } from 'react-native';

interface AppointmentData {
    id: string;
    service: string;
    originalDate: string;
    originalTime: string;
    canReschedule: boolean;
    rescheduleCount: number;
}

export default function RescheduleScreen() {
    const { appointmentId } = useLocalSearchParams();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [appointment, setAppointment] = useState<AppointmentData | null>(null);

    // Mock appointment data - in real app, this would come from API/database
    useEffect(() => {
        // Simulate fetching appointment data
        const mockAppointment: AppointmentData = {
            id: appointmentId as string || '1',
            service: 'Corte de Cabello',
            originalDate: '2024-01-15',
            originalTime: '14:00',
            canReschedule: true,
            rescheduleCount: 0
        };
        setAppointment(mockAppointment);
    }, [appointmentId]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
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

    const handleReschedule = () => {
        if (!appointment) return;

        if (!appointment.canReschedule) {
            Alert.alert(
                "No se puede reprogramar",
                "Esta cita ya ha sido reprogramada el máximo de veces permitido.",
                [{ text: "OK" }]
            );
            return;
        }

        setIsRescheduling(true);
    };

    const handleConfirmReschedule = (date: string, time: string) => {
        if (!appointment) return;

        Alert.alert(
            "Confirmar Reprogramación",
            `¿Estás seguro de que quieres reprogramar tu cita de "${appointment.service}"?\n\nFecha actual: ${formatDate(appointment.originalDate)} a las ${formatTime(appointment.originalTime)}\nNueva fecha: ${formatDate(date)} a las ${formatTime(time)}`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Confirmar",
                    onPress: () => {
                        // Here you would typically make an API call to update the appointment
                        console.log('Appointment rescheduled:', {
                            appointmentId: appointment.id,
                            newDate: date,
                            newTime: time
                        });

                        Alert.alert(
                            "¡Cita Reprogramada!",
                            `Tu cita ha sido reprogramada exitosamente para ${formatDate(date)} a las ${formatTime(time)}.`,
                            [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        // Navigate back or to confirmation screen
                                        router.back();
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
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

    if (!appointment) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
                <Container style={styles.container}>
                    <ThemeText>Cargando...</ThemeText>
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
                                {appointment.service}
                            </ThemeText>
                            <View style={styles.appointmentDetails}>
                                <ThemeText style={styles.detailText}>
                                    📅 {formatDate(appointment.originalDate)}
                                </ThemeText>
                                <ThemeText style={styles.detailText}>
                                    🕐 {formatTime(appointment.originalTime)}
                                </ThemeText>
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
                                {appointment.canReschedule 
                                    ? "✅ Puedes reprogramar esta cita una vez más"
                                    : "❌ Esta cita ya no puede ser reprogramada"
                                }
                            </ThemeText>
                            <ThemeText style={styles.statusSubtext}>
                                Reprogramaciones realizadas: {appointment.rescheduleCount}/1
                            </ThemeText>
                        </View>
                    </View>

                    {/* Reschedule Button */}
                    {appointment.canReschedule && !isRescheduling && (
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
                            >
                                Cancelar Reprogramación
                            </Button>
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