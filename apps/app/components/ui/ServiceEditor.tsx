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
import { ServiceInterface } from '../../constants/services';

interface ServiceEditorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (service: ServiceInterface) => void;
  initialService?: ServiceInterface;
  category: 'barber' | 'spa';
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({
  visible,
  onClose,
  onSave,
  initialService,
  category,
}) => {
  const [service, setService] = useState<ServiceInterface>(
    initialService || {
      name: '',
      price: 0,
      description: [''],
    }
  );
  const [newDescription, setNewDescription] = useState('');

  const updateService = (field: keyof ServiceInterface, value: any) => {
    setService(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addDescription = () => {
    if (!newDescription.trim()) {
      Alert.alert('Error', 'Por favor ingresa una descripción');
      return;
    }

    setService(prev => ({
      ...prev,
      description: [...prev.description, newDescription.trim()],
    }));
    setNewDescription('');
  };

  const removeDescription = (index: number) => {
    setService(prev => ({
      ...prev,
      description: prev.description.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!service.name.trim()) {
      Alert.alert('Error', 'El nombre del servicio es requerido');
      return;
    }

    if (service.price <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    if (service.description.length === 0 || service.description[0].trim() === '') {
      Alert.alert('Error', 'Debe haber al menos una descripción');
      return;
    }

    onSave(service);
    onClose();
  };

  const presetDescriptions = {
    barber: [
      'Lavado de cabello',
      'Corte de cabello',
      'Peinado y perfume',
      'Exfoliación',
      'Vapor caliente y masaje con guante',
      'Mascarilla puntos negros',
      'Crema humectante para ojeras',
      'Perfilación y corte de barba',
      'Aceite pre-shave',
      'Aceite de afeitado y exfoliación',
      'Delineado y afeitado',
      'Vapor frío y crema humectante',
      'After shave y perfume',
    ],
    spa: [
      'Limpieza de manos y uñas en seco',
      'Esmaltado transparente',
      'Limpieza de pies y uñas',
      'Tina con sales minerales',
      'Exfoliación',
      'Mascarilla con aceites esenciales y relajantes',
      'Gel semipermanente transparente',
      'Masaje relajante',
    ],
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <ThemeText style={styles.headerTitle}>
            {initialService ? 'Editar Servicio' : 'Nuevo Servicio'}
          </ThemeText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemeText style={styles.closeButtonText}>✕</ThemeText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Container>
            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Información Básica</ThemeText>
              
              <View style={styles.inputGroup}>
                <ThemeText style={styles.label}>Nombre del Servicio</ThemeText>
                <TextInput
                  style={styles.textInput}
                  value={service.name}
                  onChangeText={(text) => updateService('name', text)}
                  placeholder="Ej: Corte Royal"
                  placeholderTextColor={Colors.dark.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemeText style={styles.label}>Precio ($)</ThemeText>
                <TextInput
                  style={styles.textInput}
                  value={service.price.toString()}
                  onChangeText={(text) => updateService('price', parseFloat(text) || 0)}
                  placeholder="0"
                  placeholderTextColor={Colors.dark.textLight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <ThemeText style={styles.sectionTitle}>Descripción del Servicio</ThemeText>
              
              <View style={styles.addDescriptionContainer}>
                <TextInput
                  style={styles.descriptionInput}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Agregar descripción..."
                  placeholderTextColor={Colors.dark.textLight}
                  multiline
                />
                <TouchableOpacity style={styles.addButton} onPress={addDescription}>
                  <ThemeText style={styles.addButtonText}>+</ThemeText>
                </TouchableOpacity>
              </View>

              <View style={styles.presetContainer}>
                <ThemeText style={styles.presetTitle}>Descripciones Comunes</ThemeText>
                <View style={styles.presetButtons}>
                  {presetDescriptions[category].map((desc) => (
                    <TouchableOpacity
                      key={desc}
                      style={styles.presetButton}
                      onPress={() => setNewDescription(desc)}
                    >
                      <ThemeText style={styles.presetButtonText}>{desc}</ThemeText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.descriptionsContainer}>
                <ThemeText style={styles.descriptionsTitle}>Descripciones Actuales</ThemeText>
                {service.description.map((desc, index) => (
                  <View key={index} style={styles.descriptionItem}>
                    <ThemeText style={styles.descriptionText}>• {desc}</ThemeText>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeDescription(index)}
                    >
                      <ThemeText style={styles.removeButtonText}>✕</ThemeText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
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
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.dark.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.background,
  },
  addDescriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 15,
  },
  descriptionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 80,
    textAlignVertical: 'top',
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
    marginBottom: 20,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.dark.text,
  },
  presetButtons: {
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
    fontSize: 12,
  },
  descriptionsContainer: {
    gap: 8,
  },
  descriptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.dark.text,
  },
  descriptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.gray,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
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

export default ServiceEditor; 