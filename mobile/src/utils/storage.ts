import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Dual-storage wrapper:
 * - Menggunakan expo-secure-store jika tersedia (misal di native build)
 * - Otomatis fallback ke AsyncStorage di Expo Go / Development / Web
 */
export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch {
      // Fallback ke AsyncStorage bila SecureStore mengalami kendala di environment Expo Go
    }
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) return value;
      }
    } catch {
      // Fallback ke AsyncStorage
    }
    return await AsyncStorage.getItem(key);
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // Ignore SecureStore deletion error
    }
    await AsyncStorage.removeItem(key);
  },
};
