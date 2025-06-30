import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { ThemeText, Container } from '../Themed';
import Button from '../Button';
import Colors from '../../constants/Colors';

interface TimeSlot {
  id: string;
  time: string;
}

interface DaySchedule {
  day: string;
  isOpen: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilityEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: DaySchedule) => void;
  initialSchedule?: DaySchedule;
}

const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialSchedule,
}) => {
  const [schedule, setSchedule] = useState<DaySchedule>(
    initialSchedule || {
      day: 'default',
      isOpen: true,
      timeSlots: [
        { id: '1', time: '09:00 AM' },
        { id: '2', time: '09:30 AM' },
        { id: '3', time: '10:00 AM' },
        { id: '4', time: '10:30 AM' },
        { id: '5', time: '11:00 AM' },
        { id: '6', time: '11:30 AM' },
        { id: '7', time: '12:00 PM' },
        { id: '8', time: '12:30 PM' },
        { id: '9', time: '02:00 PM' },
        { id: '10', time: '02:30 PM' },
        { id: '11', time: '03:00 PM' },
        { id: '12', time: '03:30 PM' },
        { id: '13', time: '04:00 PM' },
        { id: '14', time: '04:30 PM' },
      ],
    }
  );

  const [newTime, setNewTime] = useState('');

  const addTimeSlot = () => {
    if (!newTime.trim()) {
      Alert.alert('Error', 'Por favor ingresa un horario válido');
      return;
    }

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      time: newTime.trim(),
    };

    setSchedule(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot].sort((a, b) => {
        // Sort by time
        const timeA = new Date(`2000-01-01 ${a.time}`);
        const timeB = new Date(`2000-01-01 ${b.time}`);
        return timeA.getTime() - timeB.getTime();
      }),
    }));

    setNewTime('');
  };

  const removeTimeSlot = (id: string) => {
    setSchedule(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.id !== id),
    }));
  };

  const toggleOpenStatus = () => {
    setSchedule(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
  };

  const handleSave = () => {
    if (schedule.timeSlots.length === 0) {
      Alert.alert('Error', 'Debe haber al menos un horario disponible');
      return;
    }
    onSave(schedule);
    onClose();
  };

  const presetTimes = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <ThemeText style={styles.headerTitle}>Editar Horarios</ThemeText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemeText style={styles.closeButtonText}>✕</ThemeText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Container>
            <View style={styles.section}>
              <View style={styles.openStatusContainer}>
                <ThemeText style={styles.sectionTitle}>Estado del Día</ThemeText>
                <TouchableOpacity
                  style={[styles.toggleButton, schedule.isOpen ? styles.openToggle : styles.closedToggle]}
                  onPress={toggleOpenStatus}
                >
                  <ThemeText style={styles.toggleText}>
                    {schedule.isOpen ? 'Abierto' : 'Cerrado'}
                  </ThemeText>
                </TouchableOpacity>
              </View>
            </View>

            {schedule.isOpen && (
              <>
                <View style={styles.section}>
                  <ThemeText style={styles.sectionTitle}>Agregar Horario</ThemeText>
                  <View style={styles.addTimeContainer}>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="Ej: 09:00 AM"
                      value={newTime}
                      onChangeText={setNewTime}
                      placeholderTextColor={Colors.dark.textLight}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addTimeSlot}>
                      <ThemeText style={styles.addButtonText}>+</ThemeText>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.section}>
                  <ThemeText style={styles.sectionTitle}>Horarios Rápidos</ThemeText>
                  <View style={styles.presetContainer}>
                    {presetTimes.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={styles.presetButton}
                        onPress={() => setNewTime(time)}
                      >
                        <ThemeText style={styles.presetButtonText}>{time}</ThemeText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <ThemeText style={styles.sectionTitle}>Horarios Configurados</ThemeText>
                  <View style={styles.timeSlotsContainer}>
                    {schedule.timeSlots.map((slot) => (
                      <View key={slot.id} style={styles.timeSlotItem}>
                        <ThemeText style={styles.timeSlotText}>{slot.time}</ThemeText>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeTimeSlot(slot.id)}
                        >
                          <ThemeText style={styles.removeButtonText}>✕</ThemeText>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </Container>
        </ScrollView>

        <View style={styles.footer}>
          <Button secondary onPress={onClose} style={styles.cancelButton}>
            Cancelar
          </Button>
          <Button onPress={handleSave} style={styles.saveButton}>
            Guardar
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.gray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.dark.text,
  },
  openStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openToggle: {
    backgroundColor: '#34c759',
  },
  closedToggle: {
    backgroundColor: '#ff3b30',
  },
  toggleText: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  addTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.background,
  },
  addButton: {
    backgroundColor: Colors.dark.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.dark.background,
    fontSize: 24,
    fontWeight: 'bold',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: Colors.dark.gray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  presetButtonText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  timeSlotsContainer: {
    gap: 8,
  },
  timeSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  timeSlotText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: Colors.dark.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.gray,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default AvailabilityEditor; 