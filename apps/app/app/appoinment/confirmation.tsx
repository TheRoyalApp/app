import { StatusBar, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Container, ThemeText } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { Stack, useLocalSearchParams } from 'expo-router';
import DatePicker from '@/components/ui/DatePicker';
import { useState } from 'react';

export default function Confirmation() {
    const { service } = useLocalSearchParams();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");

    const handleConfirm = (date: string, time: string) => {
        // Aquí puedes agregar la lógica para confirmar la cita
        console.log('Cita confirmada:', { service, date, time });
        // Por ejemplo, enviar a una API, guardar en base de datos, etc.
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }} edges={['bottom']}>
            <StatusBar barStyle="light-content" />
            <Container style={{ flex: 1, paddingHorizontal: 20 }}>
                <Stack.Screen 
                    options={{ 
                        headerShown: true, 
                        title: 'Confirmar Cita', 
                        headerBackTitle: 'Volver',
                        headerStyle: { backgroundColor: Colors.dark.background },
                        headerTintColor: '#fff'
                    }} 
                />
                
                {/* Service Information */}
                <View style={{ marginBottom: 20, marginTop: 20 }}>
                    <ThemeText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                        Servicio seleccionado:
                    </ThemeText>
                    <View style={{
                        backgroundColor: Colors.dark.gray,
                        borderRadius: 8,
                        padding: 15,
                        borderWidth: 1,
                        borderColor: Colors.dark.gray
                    }}>
                        <ThemeText style={{ fontSize: 16 }}>
                            {service || 'Ninguno'}
                        </ThemeText>
                    </View>
                </View>

                {/* Date and Time Picker */}
                <DatePicker
                    onDateSelect={setSelectedDate}
                    onTimeSelect={setSelectedTime}
                    onConfirm={handleConfirm}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    title="Confirmar Cita"
                    subtitle="Elige la fecha y hora de tu cita"
                    confirmButtonText="Confirmar Cita"
                />
            </Container>
        </SafeAreaView>
    );
}