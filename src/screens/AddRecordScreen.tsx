import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { FuelRecord } from '../types/FuelRecord';
import { storageService } from '../services/storageService';

interface Props {
  navigation: any;
  route?: {
    params?: {
      record?: FuelRecord;
    };
  };
}

export default function AddRecordScreen({ navigation, route }: Props) {
  const editingRecord = route?.params?.record;
  const [date, setDate] = useState(new Date());
  const [gasStationName, setGasStationName] = useState('');
  const [serviceType, setServiceType] = useState<'Full Service' | 'Self Service'>('Full Service');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [gallons, setGallons] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [lastOdometer, setLastOdometer] = useState<number | null>(null);

  useEffect(() => {
    if (editingRecord) {
      setDate(new Date(editingRecord.date));
      setGasStationName(editingRecord.gasStationName);
      setServiceType(editingRecord.serviceType);
      setPricePerGallon(editingRecord.pricePerGallon.toString());
      setGallons(editingRecord.gallons.toString());
      setOdometerReading(editingRecord.odometerReading.toString());
    }
  }, [editingRecord]);

  useEffect(() => {
    // Always load last odometer when component mounts or comes into focus
    if (!editingRecord) {
      loadLastOdometer();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reload every time the screen comes into focus
      if (!editingRecord) {
        console.log('Screen focused, reloading last odometer');
        loadLastOdometer();
      }
    }, [editingRecord])
  );

  useEffect(() => {
    // Recalculate when odometer changes
    if (odometerReading) {
      calculateKmSinceLastVisit();
    }
  }, [odometerReading, lastOdometer]);

  const loadLastOdometer = async () => {
    const last = await storageService.getLastOdometerReading();
    console.log('Last odometer reading:', last);
    setLastOdometer(last);
  };

  const calculateTotalAmount = (): number => {
    const price = parseFloat(pricePerGallon) || 0;
    const gal = parseFloat(gallons) || 0;
    return price * gal;
  };

  const calculateKmSinceLastVisit = (): number => {
    const current = parseFloat(odometerReading) || 0;
    if (lastOdometer !== null && !editingRecord && current > 0) {
      return Math.max(0, current - lastOdometer);
    }
    return 0;
  };

  const validateForm = (): boolean => {
    if (!gasStationName.trim()) {
      Alert.alert('Validation Error', 'Please enter gas station name');
      return false;
    }
    if (!pricePerGallon || parseFloat(pricePerGallon) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid price per gallon');
      return false;
    }
    if (!gallons || parseFloat(gallons) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid amount of gallons');
      return false;
    }
    if (!odometerReading || parseFloat(odometerReading) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid odometer reading');
      return false;
    }
    if (lastOdometer !== null && parseFloat(odometerReading) <= lastOdometer && !editingRecord) {
      Alert.alert('Validation Error', 'Odometer reading must be greater than last reading');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const record: FuelRecord = {
      id: editingRecord?.id || Date.now().toString(),
      date: date.toISOString(),
      gasStationName: gasStationName.trim(),
      serviceType,
      pricePerGallon: parseFloat(pricePerGallon),
      gallons: parseFloat(gallons),
      totalAmount: calculateTotalAmount(),
      odometerReading: parseFloat(odometerReading),
      kmSinceLastVisit: editingRecord ? editingRecord.kmSinceLastVisit : calculateKmSinceLastVisit(),
    };

    try {
      if (editingRecord) {
        await storageService.updateRecord(record);
        Alert.alert('Success', 'Record updated successfully');
      } else {
        await storageService.saveRecord(record);
        Alert.alert('Success', 'Record saved successfully');
      }
      
      // Reset form
      setGasStationName('');
      setPricePerGallon('');
      setGallons('');
      setOdometerReading('');
      setDate(new Date());
      setServiceType('Full Service');
      
      // Reload last odometer for next entry
      await loadLastOdometer();
      
      // Navigate to Records tab
      navigation.navigate('Records');
    } catch (error) {
      Alert.alert('Error', 'Failed to save record');
      console.error('Save error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Date Picker */}
        <Text style={styles.label}>Date *</Text>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            style={{
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              border: '1px solid #ddd',
              width: '100%',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
            value={date.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                setDate(newDate);
              }
            }}
          />
        ) : (
          <TextInput
            style={styles.input}
            value={date.toISOString().split('T')[0]}
            onChangeText={(text) => {
              if (text.length === 10) {
                const newDate = new Date(text);
                if (!isNaN(newDate.getTime())) {
                  setDate(newDate);
                }
              }
            }}
            placeholder="2025-12-26"
            keyboardType="numbers-and-punctuation"
          />
        )}

        {/* Gas Station Name */}
        <Text style={styles.label}>Gas Station Name</Text>
        <TextInput
          style={styles.input}
          value={gasStationName}
          onChangeText={setGasStationName}
          placeholder="Enter gas station name"
        />

        {/* Service Type */}
        <Text style={styles.label}>Service Type</Text>
        <View style={styles.serviceTypeContainer}>
          <TouchableOpacity
            style={[
              styles.serviceTypeButton,
              serviceType === 'Full Service' && styles.serviceTypeButtonActive,
            ]}
            onPress={() => setServiceType('Full Service')}
          >
            <Text
              style={[
                styles.serviceTypeText,
                serviceType === 'Full Service' && styles.serviceTypeTextActive,
              ]}
            >
              Full Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.serviceTypeButton,
              serviceType === 'Self Service' && styles.serviceTypeButtonActive,
            ]}
            onPress={() => setServiceType('Self Service')}
          >
            <Text
              style={[
                styles.serviceTypeText,
                serviceType === 'Self Service' && styles.serviceTypeTextActive,
              ]}
            >
              Self Service
            </Text>
          </TouchableOpacity>
        </View>

        {/* Price Per Gallon */}
        <Text style={styles.label}>Price per Gallon (GTQ)</Text>
        <TextInput
          style={styles.input}
          value={pricePerGallon}
          onChangeText={setPricePerGallon}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        {/* Gallons */}
        <Text style={styles.label}>Amount of Gallons</Text>
        <TextInput
          style={styles.input}
          value={gallons}
          onChangeText={setGallons}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        {/* Total Amount (Auto-calculated) */}
        <Text style={styles.label}>Total Amount (GTQ)</Text>
        <View style={styles.calculatedField}>
          <Text style={styles.calculatedText}>
            {calculateTotalAmount().toFixed(2)}
          </Text>
        </View>

        {/* Odometer Reading */}
        <Text style={styles.label}>Odometer Reading (km)</Text>
        <TextInput
          style={styles.input}
          value={odometerReading}
          onChangeText={setOdometerReading}
          placeholder="0"
          keyboardType="numeric"
        />

        {/* KM Since Last Visit (Auto-calculated) */}
        <Text style={styles.label}>Kilometers Since Last Visit (Auto-calculated)</Text>
        <View style={styles.calculatedField}>
          <Text style={styles.calculatedText}>
            {calculateKmSinceLastVisit().toFixed(0)} km
          </Text>
        </View>
        {lastOdometer !== null && !editingRecord ? (
          <Text style={styles.helperText}>
            Previous: {lastOdometer} km → Current: {odometerReading || '0'} km = {calculateKmSinceLastVisit().toFixed(0)} km driven
          </Text>
        ) : !editingRecord && (
          <Text style={styles.helperText}>This is your first record - km since last visit will be 0</Text>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>
            {editingRecord ? 'Update Record' : 'Add Record'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  serviceTypeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  serviceTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  serviceTypeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  serviceTypeTextActive: {
    color: '#fff',
  },
  calculatedField: {
    backgroundColor: '#e8f4f8',
    borderWidth: 1,
    borderColor: '#b3d9e8',
    borderRadius: 8,
    padding: 12,
  },
  calculatedText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
