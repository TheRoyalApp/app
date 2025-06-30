import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../components/auth/AuthContext';
import Colors from '../../../constants/Colors';
import { ServiceInterface, haircuts, spa } from '../../../constants/services';
import { availableTimesData } from '../../../constants/availability';
import AvailabilityEditor from '../../../components/ui/AvailabilityEditor';
import ServiceEditor from '../../../components/ui/ServiceEditor';
import Button from '@/components/Button';

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
        return Colors.dark.success;
      case 'pending':
        return Colors.dark.warning;
      case 'cancelled':
        return Colors.dark.error;
      default:
        return Colors.dark.text;
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const renderAppointmentsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Citas Programadas</Text>
          <Text style={styles.appointmentCount}>{appointments.length} citas</Text>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay citas programadas</Text>
          </View>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.clientName}>{appointment.clientName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                  <Text style={styles.statusText}>
                    {getStatusText(appointment.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.appointmentDetails}>
                Servicio: {appointment.service}
              </Text>
              <Text style={styles.appointmentDetails}>
                Fecha: {appointment.date} - {appointment.time}
              </Text>
              <Text style={styles.appointmentDetails}>
                Teléfono: {appointment.phone}
              </Text>
              <View style={styles.actionButtons}>
                {appointment.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                    >
                      <Text style={styles.actionButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                    >
                      <Text style={styles.actionButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </>
                )}
                {appointment.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                  >
                    <Text style={styles.actionButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderServicesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servicios de Barbería</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddService('barber')}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>
        {services
          .filter(service => service.category === 'barber')
          .map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={[styles.toggleButton, service.isActive ? styles.activeToggle : styles.inactiveToggle]}
                    onPress={() => toggleServiceStatus(service.id)}
                  >
                    <Text style={styles.toggleText}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editServiceButton}
                    onPress={() => handleEditService(service)}
                  >
                    <Text style={styles.editServiceButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteServiceButton}
                    onPress={() => handleDeleteService(service.id)}
                  >
                    <Text style={styles.deleteServiceButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.servicePrice}>${service.price}</Text>
              <View style={styles.serviceDescription}>
                {service.description.map((desc, index) => (
                  <Text key={index} style={styles.descriptionItem}>• {desc}</Text>
                ))}
              </View>
            </View>
          ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servicios de Spa</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddService('spa')}
          >
            <Text style={styles.addButtonText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>
        {services
          .filter(service => service.category === 'spa')
          .map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={[styles.toggleButton, service.isActive ? styles.activeToggle : styles.inactiveToggle]}
                    onPress={() => toggleServiceStatus(service.id)}
                  >
                    <Text style={styles.toggleText}>
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editServiceButton}
                    onPress={() => handleEditService(service)}
                  >
                    <Text style={styles.editServiceButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteServiceButton}
                    onPress={() => handleDeleteService(service.id)}
                  >
                    <Text style={styles.deleteServiceButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.servicePrice}>${service.price}</Text>
              <View style={styles.serviceDescription}>
                {service.description.map((desc, index) => (
                  <Text key={index} style={styles.descriptionItem}>• {desc}</Text>
                ))}
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );

  const renderAvailabilityTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horarios Disponibles</Text>
        <Text style={styles.availabilityNote}>
          Configura los horarios disponibles para cada día de la semana
        </Text>

        {Object.entries(availability).map(([day, times]) => (
          <View key={day} style={styles.availabilityCard}>
            <View style={styles.availabilityHeader}>
              <Text style={styles.dayTitle}>
                {day === 'default' ? 'Horario General' : day}
              </Text>
              <Text style={styles.timeCount}>
                {times.length} horarios
              </Text>
            </View>
            <View style={styles.timesContainer}>
              {times.length > 0 ? (
                times.map((time, index) => (
                  <View key={index} style={styles.timeSlot}>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noTimesText}>Sin horarios configurados</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditAvailability(day)}
            >
              <Text style={styles.editButtonText}>Editar Horarios</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acceso no autorizado</Text>
        <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/auth/login')}>
          <Text style={styles.signInButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
            Citas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Servicios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'availability' && styles.activeTab]}
          onPress={() => setActiveTab('availability')}
        >
          <Text style={[styles.tabText, activeTab === 'availability' && styles.activeTabText]}>
            Horarios
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
    </View>
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
    paddingTop: 60,
    backgroundColor: Colors.dark.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.background,
  },
  signOutButton: {
    padding: 10,
    backgroundColor: Colors.dark.error,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: Colors.dark.text,
  },
  activeTabText: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  appointmentCount: {
    fontSize: 14,
    color: Colors.dark.text,
    opacity: 0.7,
  },
  addButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.dark.text,
    opacity: 0.6,
  },
  appointmentCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.dark.success,
  },
  cancelButton: {
    backgroundColor: Colors.dark.error,
  },
  actionButtonText: {
    color: Colors.dark.text,
    fontWeight: '600',
  },
  serviceCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    flex: 1,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: Colors.dark.success,
  },
  inactiveToggle: {
    backgroundColor: Colors.dark.error,
  },
  toggleText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
  },
  editServiceButton: {
    padding: 6,
  },
  editServiceButtonText: {
    fontSize: 16,
  },
  deleteServiceButton: {
    padding: 6,
  },
  deleteServiceButtonText: {
    fontSize: 16,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.primary,
    marginBottom: 10,
  },
  serviceDescription: {
    marginTop: 5,
  },
  descriptionItem: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 3,
  },
  availabilityCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  timeCount: {
    fontSize: 14,
    color: Colors.dark.text,
    opacity: 0.7,
  },
  availabilityNote: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
    minHeight: 40,
  },
  timeSlot: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: '600',
  },
  noTimesText: {
    fontSize: 14,
    color: Colors.dark.text,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  editButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: Colors.dark.error,
    textAlign: 'center',
    marginTop: 100,
  },
  signInButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  signInButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminPanel;
