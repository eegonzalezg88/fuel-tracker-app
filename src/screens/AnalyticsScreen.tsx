import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FuelRecord } from '../types/FuelRecord';
import { storageService } from '../services/storageService';

export default function AnalyticsScreen() {
  const [records, setRecords] = useState<FuelRecord[]>([]);

  const loadRecords = async () => {
    const loadedRecords = await storageService.getAllRecords();
    console.log('Analytics: Loaded records:', loadedRecords.length);
    setRecords(loadedRecords.reverse()); // Oldest first for charts
  };

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  const calculateFuelEfficiency = (record: FuelRecord): number => {
    if (record.kmSinceLastVisit === 0 || record.gallons === 0) return 0;
    return record.kmSinceLastVisit / record.gallons;
  };

  const getEfficiencyData = () => {
    const efficiencies = records
      .filter(r => calculateFuelEfficiency(r) > 0)
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        efficiency: parseFloat(calculateFuelEfficiency(r).toFixed(2)),
      }));
    
    console.log('Efficiency data:', efficiencies);
    return efficiencies.length > 0 ? efficiencies : null;
  };

  const getPriceData = () => {
    if (records.length === 0) return null;

    const prices = records.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(r.pricePerGallon.toFixed(2)),
    }));

    return prices;
  };

  const calculateStatistics = () => {
    if (records.length === 0) {
      return {
        totalSpent: 0,
        totalGallons: 0,
        totalKm: 0,
        avgEfficiency: 0,
        avgPricePerGallon: 0,
        recordCount: 0,
      };
    }

    const totalSpent = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalGallons = records.reduce((sum, r) => sum + r.gallons, 0);
    const totalKm = records.reduce((sum, r) => sum + r.kmSinceLastVisit, 0);
    const avgPricePerGallon = records.reduce((sum, r) => sum + r.pricePerGallon, 0) / records.length;
    
    const efficiencies = records
      .filter(r => calculateFuelEfficiency(r) > 0)
      .map(r => calculateFuelEfficiency(r));
    
    const avgEfficiency = efficiencies.length > 0
      ? efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length
      : 0;

    return {
      totalSpent,
      totalGallons,
      totalKm,
      avgEfficiency,
      avgPricePerGallon,
      recordCount: records.length,
    };
  };

  const stats = calculateStatistics();
  const efficiencyData = getEfficiencyData();
  const priceData = getPriceData();

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
        <Text style={styles.emptySubtext}>Add fuel records to see analytics</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Statistics Summary */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Summary Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Q{stats.totalSpent.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalGallons.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total Gallons</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalKm.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total KM</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgEfficiency.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg Efficiency (km/gal)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Q{stats.avgPricePerGallon.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg Price/Gal</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.recordCount}</Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
        </View>
      </View>

      {/* Fuel Efficiency Chart */}
      {efficiencyData && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Fuel Efficiency (km/gal)</Text>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="efficiency" stroke="#4CAF50" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </View>
      )}

      {/* Price Evolution Chart */}
      {priceData && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Price per Gallon (GTQ)</Text>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="#2196F3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    padding: 20,
    paddingTop: 0,
  },
});
