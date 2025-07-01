import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
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
import { AppointmentsService, Appointment as ApiAppointment } from '../../services/appointments.service';
import { ServicesService, Service as ApiService } from '../../services/services.service';
import { SchedulesService, BarberSchedule } from '../../services/schedules.service';

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
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'availability'>('appointments');
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [schedules, setSchedules] = useState<BarberSchedule[]>([]);
  const [showAvailabilityEditor, setShowAvailabilityEditor] = useState(false);
  const [showServiceEditor, setShowServiceEditor] = useState(false);
  const [editingDay, setEditingDay] = useState<string>('default');
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch appointments, services, and schedules from API
  useEffect(() => {
    if (!isLoading && user) {
      console.log('AdminPanel: user is set, fetching data:', user);
      fetchAllData();
    } else {
      console.log('AdminPanel: waiting for user or still loading. isLoading:', isLoading, 'user:', user);
    }
  }, [user, isLoading, activeTab]);

  const fetchAllData = async () => {
    if (!user) {
      console.log('fetchAllData: No user, aborting fetch.');
      return;
    }
    setRefreshing(true);
    // Appointments
    if (activeTab === 'appointments') {
      // Both admin and staff fetch all appointments
      const res = await AppointmentsService.getAllAppointments();
      console.log('Fetched appointments:', res);
      if (res && res.success && res.data) {
        // Filter out completed appointments
        setAppointments(res.data.filter((apt: any) => apt.status !== 'completed'));
      } else setAppointments([]);
    }
    // Services
    if (activeTab === 'services') {
      const res = await ServicesService.getAllServices();
      if (res.success && res.data) setServices(res.data);
      else setServices([]);
    }
    // Schedules
    if (activeTab === 'availability') {
      if (user.isAdmin) {
        const res = await SchedulesService.getAllSchedules();
        if (res.success && res.data) setSchedules(res.data);
        else setSchedules([]);
      } else if (user.role === 'staff') {
        const res = await SchedulesService.getBarberSchedules(user.id);
        if (res.success && res.data) setSchedules(res.data);
        else setSchedules([]);
      }
    }
    setRefreshing(false);
  };

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

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const updateAppointmentStatus = async (id: string, status: ApiAppointment['status']) => {
    Alert.alert(
      'Confirmar cambio de estado',
      `¿Estás seguro de que quieres marcar la cita como "${status}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, actualizar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(id + status);
              const res = await AppointmentsService.updateAppointment(id, { status });
              console.log('Update response:', res);
              if (res.success) {
                Alert.alert('Éxito', `Estado actualizado a ${status}`);
                fetchAllData();
              } else {
                Alert.alert('Error', res.error || 'No se pudo actualizar el estado');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el estado');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const toggleServiceStatus = (id: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === id ? { ...service, isActive: !service.isActive } : service
      )
    );
  };

  const handleEditService = (service: ApiService) => {
    // Convert API service to UI format for editor
    setEditingService({
      ...service,
      description: service.description ? [service.description] : [],
    } as any);
    setShowServiceEditor(true);
  };

  const handleSaveService = async (serviceData: any) => {
    // Convert UI format to API format
    const apiData = {
      ...serviceData,
      description: Array.isArray(serviceData.description) ? serviceData.description.join(' ') : serviceData.description,
      price: typeof serviceData.price === 'string' ? parseFloat(serviceData.price) : serviceData.price,
    };
    if (editingService && editingService.id) {
      // Update existing service
      await ServicesService.updateService(editingService.id, apiData);
    } else {
      // Create new service
      await ServicesService.createService(apiData);
    }
    setShowServiceEditor(false);
    setEditingService(null);
    fetchAllData();
  };

  const handleAddService = () => {
    setEditingService({
      name: '',
      price: 0,
      description: [],
      duration: 30,
      isActive: true,
      id: '',
      createdAt: '',
      updatedAt: '',
    } as any);
    setShowServiceEditor(true);
  };

  const handleDeleteService = async (id: string) => {
    await ServicesService.deleteService(id);
    fetchAllData();
  };

  const handleEditAvailability = (dayOfWeek: number) => {
    setEditingDay(dayOfWeek.toString());
    setShowAvailabilityEditor(true);
  };

  const handleSaveAvailability = async (uiSchedule: any) => {
    // Convert DaySchedule (UI) to BarberSchedule (API)
    const dayOfWeek = parseInt(uiSchedule.day, 10);
    const availableTimeSlots = uiSchedule.timeSlots.map((slot: any) => slot.time);
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);
    if (schedule) {
      await SchedulesService.updateSchedule(schedule.id, {
        barberId: schedule.barberId,
        dayOfWeek,
        availableTimeSlots,
      });
    } else {
      await SchedulesService.setBarberSchedule({
        barberId: user?.id || '',
        dayOfWeek,
        availableTimeSlots,
      });
    }
    setShowAvailabilityEditor(false);
    fetchAllData();
  };

  const getStatusColor = (status: ApiAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return Colors.dark.primary;
      case 'pending':
        return '#FFA500'; // orange
      case 'completed':
        return '#2ecc40'; // green
      case 'cancelled':
        return '#ff3b30'; // red
      default:
        return Colors.dark.text;
    }
  };

  const getStatusText = (status: ApiAppointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
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
          appointments.map((appointment) => {
            // Support both API and DB join fields
            const a = appointment as any;
            return (
              <View key={appointment.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <ThemeText style={styles.cardTitle}>{a.customerName || appointment.user?.name || appointment.userId}</ThemeText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}> 
                    <ThemeText style={styles.statusText}>{getStatusText(appointment.status)}</ThemeText>
                  </View>
                </View>
                <ThemeText style={styles.cardPrice}>{a.serviceName || appointment.service?.name || appointment.serviceId}</ThemeText>
                <ThemeText style={styles.cardDescription}>{formatDate(appointment.appointmentDate)} - {appointment.timeSlot}</ThemeText>
                <ThemeText style={styles.cardDescription}>{appointment.user?.email || ''}</ThemeText>
                <View style={{ flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  <Button onPress={() => updateAppointmentStatus(appointment.id, 'confirmed')} style={[styles.confirmButton, { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary }]} disabled={updatingId === appointment.id + 'confirmed'}>
                    {updatingId === appointment.id + 'confirmed' ? <ActivityIndicator color="#fff" /> : 'Confirmar'}
                  </Button>
                  <Button onPress={() => updateAppointmentStatus(appointment.id, 'pending')} style={[styles.confirmButton, { backgroundColor: '#FFA500', borderColor: '#FFA500' }]} disabled={updatingId === appointment.id + 'pending'}>
                    {updatingId === appointment.id + 'pending' ? <ActivityIndicator color="#fff" /> : 'Pendiente'}
                  </Button>
                  <Button onPress={() => updateAppointmentStatus(appointment.id, 'completed')} style={[styles.confirmButton, { backgroundColor: '#2ecc40', borderColor: '#2ecc40' }]} disabled={updatingId === appointment.id + 'completed'}>
                    {updatingId === appointment.id + 'completed' ? <ActivityIndicator color="#fff" /> : 'Completar'}
                  </Button>
                  <Button onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')} style={styles.cancelButton} disabled={updatingId === appointment.id + 'cancelled'}>
                    {updatingId === appointment.id + 'cancelled' ? <ActivityIndicator color="#fff" /> : 'Cancelar'}
                  </Button>
                </View>
              </View>
            );
          })
        )}
      </Container>
    </ScrollView>
  );

  const renderServicesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Container>
        <View style={styles.sectionHeader}>
          <ThemeText style={styles.sectionTitle}>Servicios</ThemeText>
          <Button onPress={() => handleAddService()} style={styles.addButton}>+ Nuevo</Button>
        </View>
        {services.map((service) => (
          <View key={service.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <ThemeText style={styles.cardTitle}>{service.name}</ThemeText>
              <View style={[styles.statusBadge, { backgroundColor: service.isActive ? Colors.dark.primary : Colors.dark.gray }]}>
                <ThemeText style={{ ...styles.statusText, color: Colors.dark.background }}>{service.isActive ? 'Activo' : 'Inactivo'}</ThemeText>
              </View>
            </View>
            <ThemeText style={styles.cardPrice}>${service.price}</ThemeText>
            {service.description && (
              <ThemeText style={styles.cardDescription}>{service.description}</ThemeText>
            )}
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
        
        {schedules.map((schedule) => (
          <View key={schedule.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <ThemeText style={styles.cardTitle}>Día: {schedule.dayOfWeek}</ThemeText>
              <ThemeText style={styles.cardDescription}>{schedule.availableTimeSlots.length} horarios</ThemeText>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {schedule.availableTimeSlots.length > 0 ? (
                schedule.availableTimeSlots.map((time, idx) => (
                  <View key={idx} style={styles.timeSlot}>
                    <ThemeText style={styles.timeText}>{time}</ThemeText>
                  </View>
                ))
              ) : (
                <ThemeText style={styles.noTimesText}>Sin horarios configurados</ThemeText>
              )}
            </View>
            <Button onPress={() => handleEditAvailability(schedule.dayOfWeek)} style={styles.editButton}>Editar Horarios</Button>
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
        initialSchedule={(() => {
          const schedule = schedules.find(s => s.dayOfWeek.toString() === editingDay);
          return schedule
            ? {
                day: schedule.dayOfWeek.toString(),
                isOpen: schedule.availableTimeSlots.length > 0,
                timeSlots: schedule.availableTimeSlots.map((time, idx) => ({ id: idx.toString(), time })),
              }
            : {
                day: editingDay,
                isOpen: false,
                timeSlots: [],
              };
        })()}
      />

      <ServiceEditor
        visible={showServiceEditor}
        onClose={() => {
          setShowServiceEditor(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        initialService={editingService ? { ...editingService, price: Number(editingService.price), description: editingService.description ? [editingService.description] : [] } : undefined}
        category={'barber'}
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