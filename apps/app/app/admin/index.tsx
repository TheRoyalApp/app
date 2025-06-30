import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { useAuth } from '../../components/auth/AuthContext';
import { ThemeText, Container } from '../../components/Themed';
import Button from '../../components/Button';
import Colors from '../../constants/Colors';
import { ServiceInterface, haircuts, spa } from '../../constants/services';
import { availableTimesData } from '../../constants/availability';
import AvailabilityEditor from '../../components/ui/AvailabilityEditor';
import ServiceEditor from '../../components/ui/ServiceEditor';

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  phone: string;
}

interface AdminService extends ServiceInterface {
  id: string;
  category: 'barber' | 'spa';
  isActive: boolean;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: { id: string; time: string }[];
}

const AdminPanel = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'availability'>('appointments');
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [availability, setAvailability] = useState(availableTimesData);
  const [showAvailabilityEditor, setShowAvailabilityEditor] = useState(false);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingDay, setEditingDay] = useState<string>('default');
  const [editingService, setEditingService] = useState<AdminService | null>(null);

  // Mock appointments data
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        clientName: 'Juan Pérez',
        service: 'Corte Royal',
        date: '2024-01-15',
        time: '10:00 AM',
        status: 'confirmed',
        phone: '+1234567890',
      },
      {
        id: '2',
        clientName: 'Carlos Rodríguez',
        service: 'Barba King',
        date: '2024-01-15',
        time: '11:30 AM',
        status: 'pending',
        phone: '+1234567891',
      },
      {
        id: '3',
        clientName: 'Miguel García',
        service: 'Manicure Spa',
        date: '2024-01-16',
        time: '02:00 PM',
        status: 'confirmed',
        phone: '+1234567892',
      },
      {
        id: '4',
        clientName: 'Roberto Silva',
        service: 'Corte Imperial',
        date: '2024-01-17',
        time: '09:00 AM',
        status: 'pending',
        phone: '+1234567893',
      },
      {
        id: '5',
        clientName: 'Fernando López',
        service: 'Limpieza Facial',
        date: '2024-01-17',
        time: '03:30 PM',
        status: 'confirmed',
        phone: '+1234567894',
      },
    ];
    setAppointments(mockAppointments);

    // Initialize services
    const allServices: AdminService[] = [
      ...haircuts.map((service, index) => ({
        ...service,
        id: `barber-${index}`,
        category: 'barber' as const,
        isActive: true,
      })),
      ...spa.map((service, index) => ({
        ...service,
        id: `spa-${index}`,
        category: 'spa' as const,
        isActive: true,
      })),
    ];
    setServices(allServices);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev =>
      prev.map(appointment =>
        appointment.id === id ? { ...appointment, status } : appointment
      )
    );
  };

  const toggleServiceStatus = (id: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === id ? { ...service, isActive: !service.isActive } : service
      )
    );
  };

  const handleEditService = (service: AdminService) => {
    setEditingService(service);
    setShowServiceEditor(true);
  };

  const handleSaveService = (updatedService: ServiceInterface) => {
    if (editingService) {
      setServices(prev =>
        prev.map(service =>
          service.id === editingService.id
            ? { ...service, ...updatedService }
            : service
        )
      );
    }
    setEditingService(null);
  };

  const handleAddService = (category: 'barber' | 'spa') => {
    setEditingService({
      id: `new-${Date.now()}`,
      name: '',
      price: 0,
      description: [''],
      category,
      isActive: true,
    });
    setShowServiceEditor(true);
  };

  const handleDeleteService = (id: string) => {
    Alert.alert(
      'Eliminar Servicio',
      '¿Estás seguro de que quieres eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setServices(prev => prev.filter(service => service.id !== id));
          },
        },
      ]
    );
  };

  const handleEditAvailability = (day: string) => {
    setEditingDay(day);
    setShowAvailabilityEditor(true);
  };

  const handleSaveAvailability = (schedule: DaySchedule) => {
    const times = schedule.isOpen ? schedule.timeSlots.map(slot => slot.time) : [];
    setAvailability(prev => ({
      ...prev,
      [schedule.day]: times,
    }));
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return Colors.dark.primary;
      case 'pending':
        return Colors.dark.textLight;
      case 'cancelled':
        return '#ff3b30';
      default:
        return Colors.dark.text;
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Activo';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Inactivo';
      default:
        return status;
    }
  };

  const renderAppointmentsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Container>
        <View style={styles.sectionHeader}>
          <ThemeText style={styles.sectionTitle}>Citas Programadas</ThemeText>
          <ThemeText style={styles.appointmentCount}>{appointments.length} citas</ThemeText>
        </View>
        
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemeText style={styles.emptyStateText}>No hay citas programadas</ThemeText>
          </View>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <ThemeText style={styles.cardTitle}>{appointment.clientName}</ThemeText>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                  <ThemeText style={styles.statusText}>{getStatusText(appointment.status)}</ThemeText>
                </View>
              </View>
              <ThemeText style={styles.cardPrice}>{appointment.service}</ThemeText>
              <ThemeText style={styles.cardDescription}>{appointment.date} - {appointment.time}</ThemeText>
              <ThemeText style={styles.cardDescription}>{appointment.phone}</ThemeText>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {appointment.status === 'pending' && (
                  <>
                    <Button onPress={() => updateAppointmentStatus(appointment.id, 'confirmed')} style={styles.confirmButton}>Confirmar</Button>
                    <Button onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')} style={styles.cancelButton}>Cancelar</Button>
                  </>
                )}
                {appointment.status === 'confirmed' && (
                  <Button onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')} style={styles.cancelButton}>Cancelar</Button>
                )}
              </View>
            </View>
          ))
        )}
      </Container>
    </ScrollView>
  );

  const renderServicesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Container>
        <View style={styles.sectionHeader}>
          <ThemeText style={styles.sectionTitle}>Servicios de Barbería</ThemeText>
          <Button onPress={() => handleAddService('barber')} style={styles.addButton}>+ Nuevo</Button>
        </View>
        {services
          .filter(service => service.category === 'barber')
          .map((service) => (
            <View key={service.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <ThemeText style={styles.cardTitle}>{service.name}</ThemeText>
                <View style={[styles.statusBadge, { backgroundColor: service.isActive ? Colors.dark.primary : Colors.dark.gray }]}>
                  <ThemeText style={{ ...styles.statusText, color: Colors.dark.background }}>{service.isActive ? 'Activo' : 'Inactivo'}</ThemeText>
                </View>
              </View>
              <ThemeText style={styles.cardPrice}>${service.price}</ThemeText>
              {service.description.map((desc, idx) => (
                <ThemeText key={idx} style={styles.cardDescription}>• {desc}</ThemeText>
              ))}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={styles.editServiceButton} onPress={() => handleEditService(service)}>
                  <ThemeText style={styles.editServiceButtonText}>✏️</ThemeText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteServiceButton} onPress={() => handleDeleteService(service.id)}>
                  <ThemeText style={styles.deleteServiceButtonText}>🗑️</ThemeText>
                </TouchableOpacity>
              </View>
            </View>
          ))}

        <View style={styles.sectionHeader}>
          <ThemeText style={styles.sectionTitle}>Servicios de Spa</ThemeText>
          <Button onPress={() => handleAddService('spa')} style={styles.addButton}>+ Nuevo</Button>
        </View>
        {services
          .filter(service => service.category === 'spa')
          .map((service) => (
            <View key={service.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <ThemeText style={styles.cardTitle}>{service.name}</ThemeText>
                <View style={[styles.statusBadge, { backgroundColor: service.isActive ? Colors.dark.primary : Colors.dark.gray }]}>
                  <ThemeText style={{ ...styles.statusText, color: Colors.dark.background }}>{service.isActive ? 'Activo' : 'Inactivo'}</ThemeText>
                </View>
              </View>
              <ThemeText style={styles.cardPrice}>${service.price}</ThemeText>
              {service.description.map((desc, idx) => (
                <ThemeText key={idx} style={styles.cardDescription}>• {desc}</ThemeText>
              ))}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={styles.editServiceButton} onPress={() => handleEditService(service)}>
                  <ThemeText style={styles.editServiceButtonText}>✏️</ThemeText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteServiceButton} onPress={() => handleDeleteService(service.id)}>
                  <ThemeText style={styles.deleteServiceButtonText}>🗑️</ThemeText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </Container>
    </ScrollView>
  );

  const renderAvailabilityTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Container>
        <ThemeText style={styles.sectionTitle}>Horarios Disponibles</ThemeText>
        <ThemeText style={styles.availabilityNote}>
          Configura los horarios disponibles para cada día de la semana
        </ThemeText>
        
        {Object.entries(availability).map(([day, times]) => (
          <View key={day} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <ThemeText style={styles.cardTitle}>{day === 'default' ? 'Horario General' : day}</ThemeText>
              <ThemeText style={styles.cardDescription}>{times.length} horarios</ThemeText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {times.length > 0 ? (
                times.map((time, idx) => (
                  <View key={idx} style={styles.timeSlot}>
                    <ThemeText style={styles.timeText}>{time}</ThemeText>
                  </View>
                ))
              ) : (
                <ThemeText style={styles.noTimesText}>Sin horarios configurados</ThemeText>
              )}
            </View>
            <Button onPress={() => handleEditAvailability(day)} style={styles.editButton}>Editar Horarios</Button>
          </View>
        ))}
      </Container>
    </ScrollView>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Container>
          <ThemeText style={styles.errorText}>Acceso no autorizado</ThemeText>
          <Button onPress={() => router.push('/auth/login')}>
            Iniciar Sesión
          </Button>
        </Container>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <ThemeText style={styles.headerTitle}>Panel de Administración</ThemeText>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemeText style={styles.signOutButtonText}>Cerrar Sesión</ThemeText>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
          onPress={() => setActiveTab('appointments')}
        >
          <ThemeText style={activeTab === 'appointments' ? styles.activeTabText : styles.tabText}>
            Citas
          </ThemeText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <ThemeText style={activeTab === 'services' ? styles.activeTabText : styles.tabText}>
            Servicios
          </ThemeText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'availability' && styles.activeTab]}
          onPress={() => setActiveTab('availability')}
        >
          <ThemeText style={activeTab === 'availability' ? styles.activeTabText : styles.tabText}>
            Horarios
          </ThemeText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.dark.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'appointments' && renderAppointmentsTab()}
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'availability' && renderAvailabilityTab()}
      </ScrollView>

      <AvailabilityEditor
        visible={showAvailabilityEditor}
        onClose={() => setShowAvailabilityEditor(false)}
        onSave={handleSaveAvailability}
        initialSchedule={{
          day: editingDay,
          isOpen: availability[editingDay]?.length > 0,
          timeSlots: availability[editingDay]?.map((time, index) => ({
            id: index.toString(),
            time,
          })) || [],
        }}
      />

      <ServiceEditor
        visible={showServiceEditor}
        onClose={() => {
          setShowServiceEditor(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        initialService={editingService || undefined}
        category={editingService?.category || 'barber'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
  activeTabText: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.primary,
  },
  appointmentCount: {
    fontSize: 14,
    color: Colors.dark.textLight,
  },
  addButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 20,
    borderColor: Colors.dark.primary,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  cardPrice: {
    fontSize: 16,
    color: Colors.dark.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginBottom: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  statusText: {
    color: Colors.dark.background,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
    flex: 1,
  },
  editServiceButton: {
    padding: 6,
  },
  editServiceButtonText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  deleteServiceButton: {
    padding: 6,
  },
  deleteServiceButtonText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  timeSlot: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  timeText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: '600',
  },
  noTimesText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
  errorText: {
    fontSize: 18,
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  availabilityNote: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default AdminPanel; 