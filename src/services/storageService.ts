import AsyncStorage from '@react-native-async-storage/async-storage';
import { FuelRecord } from '../types/FuelRecord';

const STORAGE_KEY = '@fuel_records';
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Helper function to save to local storage
async function saveToLocalStorage(records: FuelRecord[]): Promise<void> {
  const jsonValue = JSON.stringify(records);
  await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
}

// Helper function to get from local storage
async function getFromLocalStorage(): Promise<FuelRecord[]> {
  const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
  return jsonValue != null ? JSON.parse(jsonValue) : [];
}

export const storageService = {
  async getAllRecords(): Promise<FuelRecord[]> {
    try {
      // Try to fetch from API first
      const response = await fetch(`${API_BASE_URL}/records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Save to local storage as cache
          await saveToLocalStorage(result.data);
          return result.data;
        }
      }
      
      // Fallback to local storage if API fails
      console.log('API unavailable, using local storage');
      return await getFromLocalStorage();
    } catch (e) {
      console.error('Error reading records from API, falling back to local storage:', e);
      return await getFromLocalStorage();
    }
  },

  async saveRecord(record: FuelRecord): Promise<void> {
    try {
      // Save to local storage first (optimistic update)
      const localRecords = await getFromLocalStorage();
      localRecords.push(record);
      localRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      await saveToLocalStorage(localRecords);

      // Try to sync with API
      try {
        const response = await fetch(`${API_BASE_URL}/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (!response.ok) {
          console.warn('Failed to sync record to Google Sheets, saved locally');
        }
      } catch (apiError) {
        console.warn('API unavailable, record saved locally only:', apiError);
      }
    } catch (e) {
      console.error('Error saving record:', e);
      throw e;
    }
  },

  async updateRecord(updatedRecord: FuelRecord): Promise<void> {
    try {
      // Update local storage first (optimistic update)
      const localRecords = await getFromLocalStorage();
      const index = localRecords.findIndex(r => r.id === updatedRecord.id);
      if (index !== -1) {
        localRecords[index] = updatedRecord;
        localRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        await saveToLocalStorage(localRecords);
      }

      // Try to sync with API
      try {
        const response = await fetch(`${API_BASE_URL}/records/${updatedRecord.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedRecord),
        });

        if (!response.ok) {
          console.warn('Failed to sync update to Google Sheets, updated locally');
        }
      } catch (apiError) {
        console.warn('API unavailable, record updated locally only:', apiError);
      }
    } catch (e) {
      console.error('Error updating record:', e);
      throw e;
    }
  },

  async deleteRecord(id: string): Promise<void> {
    try {
      // Delete from local storage first (optimistic update)
      const localRecords = await getFromLocalStorage();
      const filteredRecords = localRecords.filter(r => r.id !== id);
      await saveToLocalStorage(filteredRecords);

      // Try to sync with API
      try {
        const response = await fetch(`${API_BASE_URL}/records/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Failed to sync deletion to Google Sheets, deleted locally');
        }
      } catch (apiError) {
        console.warn('API unavailable, record deleted locally only:', apiError);
      }
    } catch (e) {
      console.error('Error deleting record:', e);
      throw e;
    }
  },

  async getLastOdometerReading(): Promise<number | null> {
    try {
      const records = await this.getAllRecords();
      if (records.length === 0) return null;
      return records[0].odometerReading;
    } catch (e) {
      console.error('Error getting last odometer reading:', e);
      return null;
    }
  }
};
