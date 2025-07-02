import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, SafeAreaView, ActivityIndicator } from "react-native"
import { Calendar } from "react-native-calendars"
import Colors from "@/constants/Colors"
import Button from "@/components/Button"
import { SchedulesService } from "@/services"
import type { AvailabilityResponse, TimeSlot } from "@/services"

interface AppointmentDatePickerProps {
  barberId: string
  onDateSelect?: (date: string) => void
  onTimeSelect?: (time: string) => void
  onConfirm?: (date: string, time: string) => void
  selectedDate?: string
  selectedTime?: string
  showConfirmButton?: boolean
  showSummary?: boolean
  confirmButtonText?: string
  title?: string
  subtitle?: string
}

export default function AppointmentDatePicker({
  barberId,
  onDateSelect,
  onTimeSelect,
  onConfirm,
  selectedDate: externalSelectedDate,
  selectedTime: externalSelectedTime,
  showConfirmButton = true,
  showSummary = true,
  confirmButtonText = "Confirmar Cita",
  title = "Seleccionar Fecha y Hora",
  subtitle = "Elige la fecha y hora de tu cita"
}: AppointmentDatePickerProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<string>("")
  const [internalSelectedTime, setInternalSelectedTime] = useState<string>("")
  const [isCalendarVisible, setIsCalendarVisible] = useState(false)
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [isLoadingTimes, setIsLoadingTimes] = useState(false)

  // Use external state if provided, otherwise use internal state
  const selectedDate = externalSelectedDate !== undefined ? externalSelectedDate : internalSelectedDate
  const selectedTime = externalSelectedTime !== undefined ? externalSelectedTime : internalSelectedTime

  // Get today's date in local timezone to allow same-day bookings
  const today = new Date()
  const todayString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`

  const loadAvailability = async (date: string) => {
    try {
      setIsLoadingTimes(true)
      console.log('Loading availability for date:', date, 'barberId:', barberId)
      
      const response = await SchedulesService.getAvailability(barberId, date)
      console.log('Availability response:', response)
      
      if (response.success && response.data) {
        setAvailability(response.data)
        
        // Check if there are no available slots and show alert
        const availableSlots = response.data.availableSlots || []
        if (availableSlots.length === 0) {
          Alert.alert(
            'Sin horarios disponibles',
            'No hay horarios disponibles para la fecha seleccionada. Por favor, selecciona otra fecha.',
            [{ text: 'OK' }]
          )
        }
      } else {
        setAvailability(null)
        Alert.alert(
          'Error',
          'No se pudieron cargar los horarios disponibles. Por favor, intenta con otra fecha.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error loading availability:', error)
      setAvailability(null)
      Alert.alert(
        'Error',
        'Ocurrió un error al cargar los horarios. Por favor, intenta nuevamente.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoadingTimes(false)
    }
  }

  const handleDateSelect = (day: any) => {
    const newDate = day.dateString
    if (externalSelectedDate === undefined) {
      setInternalSelectedDate(newDate)
    }
    onDateSelect?.(newDate)
    setIsCalendarVisible(false)
    
    // Reset time selection when date changes
    if (externalSelectedTime === undefined) {
      setInternalSelectedTime("")
    }
    onTimeSelect?.("")
    
    // Load availability for the new date
    loadAvailability(newDate)
  }

  const handleTimeSelect = (time: string) => {
    if (externalSelectedTime === undefined) {
      setInternalSelectedTime(time)
    }
    onTimeSelect?.(time)
    setIsTimePickerVisible(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Seleccionar Fecha"
    
    // Parse date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long", 
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    if (!time) return "Seleccionar Hora"
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getSelectedTimeLabel = () => {
    return formatTime(selectedTime)
  }

  const getAvailableTimeSlots = (): TimeSlot[] => {
    if (!availability?.availableSlots) return []
    
    let timeSlots: TimeSlot[] = []
    
    // If already objects, use as is
    if (Array.isArray(availability.availableSlots) && typeof (availability.availableSlots[0] as any)?.time === 'string') {
      timeSlots = availability.availableSlots as TimeSlot[];
    } else {
      // Otherwise, map strings to TimeSlot objects
      timeSlots = (availability.availableSlots as unknown as string[]).map((slot) => ({
        id: `${barberId}-${selectedDate}-${slot}`,
        time: slot,
        isAvailable: true,
        isBooked: false,
      }))
    }
    
    // Filter out past hours for today only
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes() // Current time in minutes
    
    return timeSlots.filter((slot) => {
      // For today's date, check if the time has passed
      if (selectedDate === todayString) {
        const [hours, minutes] = slot.time.split(':').map(Number)
        const slotTimeInMinutes = hours * 60 + minutes
        
        // Only show slots that are at least 30 minutes in the future
        return slotTimeInMinutes > currentTime + 30
      }
      
      // For future dates, show all available slots (backend already filtered out booked ones)
      return true
    })
  }

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      if (onConfirm) {
        onConfirm(selectedDate, selectedTime)
      } else {
        Alert.alert(
          "¡Cita Confirmada!",
          `Tu cita está programada para ${formatDate(selectedDate)} a las ${formatTime(selectedTime)}`,
          [{ text: "OK" }],
        )
      }
    }
  }

  const isAppointmentReady = selectedDate && selectedTime

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Seleccionar Fecha</Text>
        <Button
          onPress={() => setIsCalendarVisible(true)}
          style={styles.button}
          secondary={!selectedDate}
        >
          📅 {formatDate(selectedDate)}
        </Button>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Seleccionar Hora</Text>
        <Button
          onPress={() => {
            if (selectedDate) {
              if (getAvailableTimeSlots().length > 0) {
                setIsTimePickerVisible(true)
              } else {
                Alert.alert(
                  'Sin horarios disponibles',
                  'No hay horarios disponibles para esta fecha. Por favor, selecciona otra fecha.',
                  [{ text: 'OK' }]
                )
              }
            }
          }}
          style={styles.button}
          secondary={!selectedTime}
          disabled={!selectedDate || isLoadingTimes}
        >
          {isLoadingTimes ? (
            <>
              <ActivityIndicator size="small" color={Colors.dark.text} style={{ marginRight: 8 }} />
              Cargando horarios...
            </>
          ) : (
            <>🕐 {getSelectedTimeLabel()}</>
          )}
        </Button>
      </View>

      {/* Appointment Summary */}
      {showSummary && isAppointmentReady && (
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen de la Cita</Text>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Fecha: </Text>
            {formatDate(selectedDate)}
          </Text>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Hora: </Text>
            {getSelectedTimeLabel()}
          </Text>
        </View>
      )}

      {/* Confirm Button */}
      {showConfirmButton && (
        <Button
          onPress={handleConfirm}
          disabled={!isAppointmentReady}
          style={styles.confirmButton}
        >
          {confirmButtonText}
        </Button>
      )}

      {/* Calendar Modal */}
      <Modal visible={isCalendarVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsCalendarVisible(false)}>
              <Text style={styles.modalCloseButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
            <View style={styles.modalSpacer} />
          </View>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: Colors.dark.primary,
              },
            }}
            minDate={todayString}
            theme={{
              selectedDayBackgroundColor: Colors.dark.primary,
              selectedDayTextColor: "#ffffff",
              todayTextColor: Colors.dark.primary,
              dayTextColor: Colors.dark.text,
              textDisabledColor: Colors.dark.textLight,
              arrowColor: Colors.dark.primary,
              monthTextColor: Colors.dark.text,
              indicatorColor: Colors.dark.primary,
              backgroundColor: Colors.dark.background,
              calendarBackground: Colors.dark.background,
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={isTimePickerVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsTimePickerVisible(false)}>
              <Text style={styles.modalCloseButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Hora</Text>
            <View style={styles.modalSpacer} />
          </View>
          <ScrollView style={styles.timeList}>
            {getAvailableTimeSlots().length > 0 ? (
              getAvailableTimeSlots().map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.timeItem, selectedTime === slot.time && styles.timeItemSelected]}
                  onPress={() => handleTimeSelect(slot.time)}
                >
                  <Text style={[styles.timeItemText, selectedTime === slot.time && styles.timeItemTextSelected]}>
                    {formatTime(slot.time)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noTimesContainer}>
                <Text style={styles.noTimesText}>
                  No hay horarios disponibles para esta fecha
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textLight,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  button: {
    width: '100%',
  },
  summary: {
    backgroundColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.dark.textLight,
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: "600",
  },
  confirmButton: {
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  modalCloseButton: {
    fontSize: 16,
    color: Colors.dark.primary,
  },
  modalSpacer: {
    width: 50,
  },
  timeList: {
    flex: 1,
  },
  timeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
  },
  timeItemSelected: {
    backgroundColor: Colors.dark.primary,
  },
  timeItemText: {
    fontSize: 16,
    color: Colors.dark.text,
    textAlign: "center",
  },
  timeItemTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  noTimesContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noTimesText: {
    fontSize: 16,
    color: Colors.dark.textLight,
    textAlign: 'center',
  },
}) 