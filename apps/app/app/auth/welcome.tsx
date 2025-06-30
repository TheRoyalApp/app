import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { clearStorage } = useAuth();

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleClearStorage = async () => {
    await clearStorage();
    // Recargar la página para forzar la navegación
    router.replace('/auth/welcome');
  };

  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.tint]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>The Royal Barber</Text>
          <Text style={styles.subtitle}>
            Tu barbería de confianza
          </Text>
        </View>

        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>✂️</Text>
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            Reserva tu cita de manera fácil y rápida. 
            Disfruta de los mejores servicios de barbería.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSignUp}
          >
            <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
          >
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>

          {/* Botón para limpiar almacenamiento (solo para desarrollo) */}
          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleClearStorage}
          >
            <Text style={styles.debugButtonText}>🔧 Limpiar Datos (Dev)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.dark.textLight,
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  imagePlaceholder: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: Colors.dark.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.dark.primary,
  },
  imageText: {
    fontSize: 80,
  },
  description: {
    alignItems: 'center',
    marginBottom: 40,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.dark.textLight,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  secondaryButtonText: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
}); 