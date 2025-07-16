import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
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
import { AdminService, AdminUser } from '../../services/admin.service';
import { apiClient } from '@/services';
import AppointmentDatePicker from '@/components/ui/AppointmentDatePicker';

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
  const [editingDay, setEditingDay] = useState('');
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    userId: '',
    barberId: '',
    serviceId: '',
    appointmentDate: '',
    timeSlot: '',
  });
  const [creating, setCreating] = useState(false);
  const [staffList, setStaffList] = useState<AdminUser[]>([]);
  const [serviceList, setServiceList] = useState<ApiService[]>([]);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [barberNames, setBarberNames] = useState<{ [id: string]: string }>({});

  // Arrays de días para la API y la UI
  // Backend uses: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Fetch appointments, services, and schedules from API
  useEffect(() => {
    if (!isLoading && user) {
      console.log('AdminPanel: user is set, fetching data:', user);
      fetchAllData();
    } else {
      console.log('AdminPanel: waiting for user or still loading. isLoading:', isLoading, 'user:', user);
    }
  }, [user, isLoading, activeTab]);

  useEffect(() => {
    if (showCreateModal) {
      apiClient.get('/users/staff').then((res: any) => {
        if (res.success && res.data && Array.isArray(res.data)) {
          setStaffList(res.data);
        } else {
          setStaffList([]);
        }
      });
      // Fetch active services
      ServicesService.getActiveServices().then(res => {
        if (res.success && res.data) setServiceList(res.data);
        else setServiceList([]);
      });
    }
  }, [showCreateModal]);

  useEffect(() => {
    const fetchMissingBarberNames = async () => {
      const missingIds = schedules
        .filter(s => !s.barber?.name && !barberNames[s.barberId])
        .map(s => s.barberId);
      const uniqueIds = [...new Set(missingIds)];
      for (const id of uniqueIds) {
        try {
          const res = await apiClient.get(`/users/${id}`);
          if (res.success && res.data) {
            const user = res.data as any;
            let fullName = '';
            if (user.name) {
              fullName = user.name;
            } else if (user.firstName && user.lastName) {
              fullName = `${user.firstName} ${user.lastName}`;
            } else {
              fullName = user.firstName || user.lastName || '';
            }
            setBarberNames(prev => ({ ...prev, [id]: fullName }));
          }
        } catch (e) {
          // Optionally handle error
        }
      }
    };
    if (schedules.length > 0) {
      fetchMissingBarberNames();
    }
  }, [schedules]);

  const fetchAllData = async () => {
    if (!user) {
      console.log('fetchAllData: No user, aborting fetch.');
      return;
    }
    setRefreshing(true);
    // Appointments
    if (activeTab === 'appointments') {
      // Both admin and staff fetch all non-closed appointments
      const res = await AppointmentsService.getAllAppointments();
      console.log('Fetched appointments:', res);
      if (res && res.success && res.data) {
        // Filter to show only non-closed appointments (pending, confirmed, cancelled)
        // Exclude completed appointments as they are considered "closed"
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
      duration: typeof serviceData.duration === 'string' ? parseInt(serviceData.duration) : serviceData.duration,
    };
    // Frontend validation
    if (!apiData.name || !apiData.price || !apiData.duration || apiData.price <= 0 || apiData.duration <= 0) {
      Alert.alert('Error', 'Todos los campos son obligatorios y deben ser válidos (nombre, precio, duración)');
      return;
    }
    let result;
    if (editingService && editingService.id) {
      // Update existing service
      result = await ServicesService.updateService(editingService.id, apiData);
    } else {
      // Create new service
      result = await ServicesService.createService(apiData);
    }
    if (!result?.success) {
      Alert.alert('Error', result?.error || 'No se pudo crear/actualizar el servicio');
      return;
    }
    setShowServiceEditor(false);
    setEditingService(null);
    fetchAllData();
    Alert.alert('Éxito', 'Servicio guardado correctamente');
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

  const handleEditAvailability = (dayOfWeek: number, barberId?: string) => {
    // Calculate the next occurrence of this day
    const today = new Date();
    const targetDay = dayOfWeek; // 0 = Sunday, 1 = Monday, etc. (matches backend)
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + daysUntilTarget);
    
    const formattedDate = nextOccurrence.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    Alert.alert(
      'Configurar Horario',
      `¿Quieres configurar el horario para ${dayLabels[dayOfWeek]}?\n\nEste horario se aplicará a todos los ${dayLabels[dayOfWeek]}s, comenzando el ${formattedDate}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Configurar',
          onPress: () => {
            setEditingDay(dayOfWeek.toString());
            setShowAvailabilityEditor(true);
          }
        }
      ]
    );
  };

  const handleSaveAvailability = async (uiSchedule: any) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'No se pudo identificar el usuario');
        return;
      }
      // Convert UI time format to API format (HH:MM)
      const availableTimeSlots = uiSchedule.timeSlots.map((slot: any) => {
        const time = slot.time;
        const [timePart, period] = time.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      });
      // Use the editingDay state to determine which day to save the schedule for
      const dayIndex = parseInt(editingDay, 10);
      const dayOfWeek = dayNames[dayIndex];
      // Validación antes de enviar a la API
      if (
        !user.id ||
        typeof dayOfWeek !== 'string' ||
        !dayNames.includes(dayOfWeek) ||
        !Array.isArray(availableTimeSlots) ||
        availableTimeSlots.length === 0
      ) {
        Alert.alert('Error', 'Datos inválidos para crear el horario. Intenta de nuevo.');
        return;
      }
      // Check if schedule already exists
      const schedule = schedules.find(s => 
        s.barberId === user.id && s.dayOfWeek === dayOfWeek
      );
      if (schedule) {
        // Update existing schedule
        const result = await SchedulesService.updateSchedule(schedule.id, {
          availableTimeSlots: availableTimeSlots
        });
        if (!result.success) {
          throw new Error(result.error || 'Error updating schedule');
        }
      } else {
        // Create new schedule
        const result = await SchedulesService.setBarberSchedule({
          barberId: user.id,
          dayOfWeek: dayOfWeek,
          availableTimeSlots: availableTimeSlots
        });
        if (!result.success) {
          throw new Error(result.error || 'Error creating schedule');
        }
      }
      // Calculate when this schedule will take effect
      const today = new Date();
      const targetDay = parseInt(editingDay);
      const currentDay = today.getDay();
      
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // Next week
      }
      
      const nextOccurrence = new Date(today);
      nextOccurrence.setDate(today.getDate() + daysUntilTarget);
      
      const formattedDate = nextOccurrence.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      Alert.alert(
        'Éxito', 
        `Horarios actualizados correctamente para ${dayLabels[targetDay]}.\n\nEste horario se aplicará a todos los "${dayLabels[targetDay]}", comenzando el ${formattedDate}.`
      );
      setShowAvailabilityEditor(false);
      fetchAllData();
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'No se pudieron guardar los horarios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
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

  const handleCreateAppointment = async () => {
    if (!newAppointment.userId) {
      Alert.alert('Error', 'Debes ingresar el ID del cliente.');
      return;
    }
    try {
      setCreating(true);
      const appointmentData = {
        ...newAppointment,
        appointmentDate: formatDateToDDMMYYYY(selectedDate),
        timeSlot: selectedTime,
      };
      await AppointmentsService.createAppointment(appointmentData);
      setShowCreateModal(false);
      setNewAppointment({ userId: '', barberId: '', serviceId: '', appointmentDate: '', timeSlot: '' });
      fetchAllData();
      Alert.alert('Éxito', 'Cita creada con estado pendiente');
    } catch (error) {
      Alert.alert('Error', 'Error al crear la cita.');
    } finally {
      setCreating(false);
    }
  };

  const formatDateToDDMMYYYY = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const renderAppointmentsTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 0 }}>
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
    </View>
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

  const renderAvailabilityTab = () => {
    const getScheduleForDay = (dayOfWeek: number, barberId?: string) => {
      const targetBarberId = barberId || user?.id;
      const dayOfWeekString = dayNames[dayOfWeek];
      return schedules.find(s => 
        s.barberId === targetBarberId && s.dayOfWeek === dayOfWeekString
      );
    };

    const formatTimeSlots = (timeSlots: string[]) => {
      return timeSlots.map(time => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      });
    };

    const isSelectedDay = (index: number) => editingDay === index.toString();

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          {/* Personal Schedules Section */}
          <View style={styles.section}>
            <ThemeText style={styles.sectionTitle}>Mis Horarios</ThemeText>
            <ThemeText style={styles.availabilityNote}>
              Configura tus horarios disponibles para cada día de la semana
            </ThemeText>
            
            <View style={styles.daysColumnContainer}>
              <View style={styles.daysColumn}>
                {dayLabels.map((dayName, index) => {
                  const schedule = getScheduleForDay(index);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCardColumn,
                        schedule ? styles.dayWithSchedule : styles.dayWithoutSchedule
                      ]}
                      onPress={() => handleEditAvailability(index)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <ThemeText style={styles.dayCardTitleColumn}>{dayName}</ThemeText>
                        {schedule && (
                          <View style={styles.scheduleIndicator}>
                            <ThemeText style={styles.scheduleCount}>
                              {schedule.availableTimeSlots.length} horarios
                            </ThemeText>
                          </View>
                        )}
                      </View>
                      {schedule && schedule.availableTimeSlots.length > 0 && (
                        <View style={styles.chipsRow}>
                          {schedule.availableTimeSlots.slice(0, 3).map((time, idx) => (
                            <View key={idx} style={styles.chip}>
                              <ThemeText style={styles.chipText}>
                                {formatTimeSlots([time])[0]}
                              </ThemeText>
                            </View>
                          ))}
                          {schedule.availableTimeSlots.length > 3 && (
                            <View style={styles.chipMore}>
                              <ThemeText style={styles.chipMoreText}>
                                +{schedule.availableTimeSlots.length - 3}
                              </ThemeText>
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Staff Schedules Section (Admin only) */}
          {user?.isAdmin && staffList.length > 0 && (
            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Horarios del Staff</ThemeText>
              <ThemeText style={styles.availabilityNote}>
                Gestiona los horarios de todo el equipo
              </ThemeText>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {staffList.map((staff) => (
                  <View key={staff.id} style={styles.staffCard}>
                    <ThemeText style={styles.staffName}>
                      {staff.firstName} {staff.lastName}
                    </ThemeText>
                    <View style={styles.staffDaysContainer}>
                      {dayLabels.map((dayName, index) => {
                        const schedule = getScheduleForDay(index, staff.id);
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.staffDayButton,
                              schedule ? styles.dayWithSchedule : styles.dayWithoutSchedule
                            ]}
                            onPress={() => handleEditAvailability(index, staff.id)}
                          >
                            <ThemeText style={styles.staffDayButtonText}>
                              {dayName.slice(0, 3)}
                            </ThemeText>
                            {schedule && (
                              <ThemeText style={styles.scheduleCount}>
                                {schedule.availableTimeSlots.length}
                              </ThemeText>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Legacy schedules display for backward compatibility */}
          {schedules.length > 0 && (
            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Todos los Horarios</ThemeText>
              {schedules.map((schedule) => (
                <View key={schedule.id} style={styles.cardAllSchedules}>
                  <View style={styles.scheduleHeader}>
                    <ThemeText style={styles.cardAllSchedulesTitle}>
                      {schedule.barber?.name || barberNames[schedule.barberId] || `Barbero ${schedule.barberId.slice(0, 8)}...`}
                    </ThemeText>
                    <ThemeText style={styles.cardAllSchedulesDay}>
                      {dayLabels[dayNames.indexOf(schedule.dayOfWeek)]}
                    </ThemeText>
                  </View>
                  <View style={styles.scheduleChipsContainer}>
                    {schedule.availableTimeSlots.length > 0 ? (
                      schedule.availableTimeSlots.map((time, idx) => (
                        <View key={idx} style={styles.scheduleChip}>
                          <ThemeText style={styles.scheduleChipText}>🕒 {formatTimeSlots([time])[0]}</ThemeText>
                        </View>
                      ))
                    ) : (
                      <ThemeText style={styles.noScheduleText}>Sin horarios configurados</ThemeText>
                    )}
                  </View>
                  <Button onPress={() => handleEditAvailability(dayNames.indexOf(schedule.dayOfWeek), schedule.barberId)} style={styles.editButton}>
                    Editar Horarios
                  </Button>
                </View>
              ))}
            </View>
          )}
        </Container>
      </ScrollView>
    );
  };

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemeText style={styles.backButtonText}>← Volver</ThemeText>
        </TouchableOpacity>
        <ThemeText style={styles.headerTitle}>Admin</ThemeText>
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
          let validDay = (!editingDay || isNaN(Number(editingDay)) || Number(editingDay) < 0 || Number(editingDay) > 6)
            ? '0'
            : editingDay;
          const schedule = schedules.find(s => {
            const dayOfWeekString = dayNames[parseInt(validDay, 10)];
            return s.dayOfWeek === dayOfWeekString;
          });
          return schedule
            ? {
                day: validDay,
                isOpen: schedule.availableTimeSlots.length > 0,
                timeSlots: schedule.availableTimeSlots.map((time, idx) => ({ id: idx.toString(), time })),
              }
            : {
                day: validDay,
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

      <Modal visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background, padding: 20 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
            <ThemeText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Crear Nueva Cita</ThemeText>
            <ThemeText style={{ fontSize: 16, marginBottom: 8 }}>Barbero</ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 5 }} style={{ marginBottom: 20 }}>
              {staffList.map((staff, index) => (
                <Pressable
                  key={staff.id}
                  onPress={() => setNewAppointment(a => ({ ...a, barberId: staff.id }))}
                  style={{
                    width: 120,
                    marginRight: index === staffList.length - 1 ? 0 : 15,
                    padding: 15,
                    backgroundColor: newAppointment.barberId === staff.id ? Colors.dark.primary : Colors.dark.background,
                    borderColor: newAppointment.barberId === staff.id ? Colors.dark.primary : Colors.dark.gray,
                    borderWidth: 1,
                    borderRadius: 10,
                    alignItems: 'center'
                  }}
                >
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: newAppointment.barberId === staff.id ? 'rgba(255,255,255,0.2)' : Colors.dark.gray,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <ThemeText style={{ fontSize: 18, fontWeight: 'bold', color: newAppointment.barberId === staff.id ? Colors.dark.background : Colors.dark.text }}>
                      {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                    </ThemeText>
                  </View>
                  <ThemeText style={{ fontSize: 12, fontWeight: '600', textAlign: 'center', color: newAppointment.barberId === staff.id ? Colors.dark.background : Colors.dark.text }}>
                    {staff.firstName}
                  </ThemeText>
                  <ThemeText style={{ fontSize: 12, textAlign: 'center', color: newAppointment.barberId === staff.id ? Colors.dark.background : Colors.dark.text }}>
                    {staff.lastName}
                  </ThemeText>
                </Pressable>
              ))}
            </ScrollView>
            <ThemeText style={{ fontSize: 16, marginBottom: 8 }}>Servicio</ThemeText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 5 }} style={{ marginBottom: 20 }}>
              {serviceList.map((service, index) => (
                <Pressable
                  key={service.id}
                  onPress={() => {
                    setSelectedService(service);
                    setNewAppointment(a => ({ ...a, serviceId: service.id }));
                  }}
                  style={{
                    width: 200,
                    marginRight: index === serviceList.length - 1 ? 0 : 15,
                    padding: 15,
                    backgroundColor: newAppointment.serviceId === service.id ? Colors.dark.primary : Colors.dark.background,
                    borderColor: newAppointment.serviceId === service.id ? Colors.dark.primary : Colors.dark.gray,
                    borderWidth: 1,
                    borderRadius: 10,
                    alignItems: 'flex-start'
                  }}
                >
                  <ThemeText style={{ fontSize: 14, fontWeight: 'bold', color: newAppointment.serviceId === service.id ? Colors.dark.background : Colors.dark.text, marginBottom: 4, textAlign: 'left' }}>{service.name}</ThemeText>
                  <ThemeText style={{ fontSize: 12, color: newAppointment.serviceId === service.id ? Colors.dark.background : Colors.dark.textLight, textAlign: 'left' }}>{service.description}</ThemeText>
                  <ThemeText style={{ fontSize: 12, color: newAppointment.serviceId === service.id ? Colors.dark.background : Colors.dark.text, marginTop: 4, textAlign: 'left' }}>${parseFloat(service.price).toFixed(2)}</ThemeText>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ marginTop: 20 }}>
              <AppointmentDatePicker
                barberId={newAppointment.barberId}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={date => setSelectedDate(date)}
                onTimeSelect={time => setSelectedTime(time)}
                showConfirmButton={false}
                showSummary={false}
              />
            </View>
            {!newAppointment.userId && (
              <ThemeText style={{ color: Colors.dark.textLight, marginTop: 10, textAlign: 'center' }}>
                Solo puedes crear citas para usuarios registrados. Ingresa el ID del cliente.
              </ThemeText>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Button
                onPress={handleCreateAppointment}
                style={styles.confirmButton}
                disabled={creating || !newAppointment.userId}
              >
                Crear
              </Button>
              <Button onPress={() => setShowCreateModal(false)} style={styles.cancelButton}>
                Cancelar
              </Button>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    gap: 15,
  },
  backButton: {
    backgroundColor: Colors.dark.gray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  backButtonText: {
    color: Colors.dark.primary,
    fontWeight: '600',
    fontSize: 14,
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
    marginTop: 24,
    marginBottom: 12,
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
    marginTop: 12,
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
  textInput: {
    backgroundColor: Colors.dark.gray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.dark.gray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  section: {
    marginBottom: 30,
  },
  daysColumnContainer: {
    marginTop: 0,
  },
  daysColumn: {
    flexDirection: 'column',
    width: '100%',
    gap: 4,
  },
  dayCardColumn: {
    backgroundColor: '#29251a',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 4,
    width: '100%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#39331e',
  },
  dayCardTitleColumn: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  chipMore: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  chipMoreText: {
    fontSize: 13,
    color: Colors.dark.background,
    fontWeight: 'bold',
  },
  addScheduleMiniBtn: {
    marginTop: 8,
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addScheduleMiniBtnText: {
    color: Colors.dark.background,
    fontWeight: 'bold',
    fontSize: 13,
  },
  staffCard: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 10,
    minWidth: 200,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: Colors.dark.text,
  },
  staffDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  staffDayButton: {
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    minWidth: '25%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.gray,
  },
  staffDayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
    color: Colors.dark.text,
  },
  dayWithSchedule: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + '20',
  },
  dayWithoutSchedule: {
    borderColor: Colors.dark.gray,
  },
  scheduleCount: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  scheduleChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  scheduleChip: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  scheduleChipText: {
    fontSize: 12,
    color: Colors.dark.primary,
  },
  cardAllSchedules: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  cardAllSchedulesTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginBottom: 2,
  },
  cardAllSchedulesDay: {
    fontSize: 13,
    color: Colors.dark.textLight,
    marginBottom: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noScheduleText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  scheduleIndicator: {
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default AdminPanel; 