import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { storage } from '../utils/storage';

export const TOKEN_STORAGE_KEY = 'patient_jwt_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor: Tambahkan Authorization Bearer Token jika tersimpan
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem(TOKEN_STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Abaikan jika storage belum siap
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Menangani error respons secara konsisten
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    let friendlyMessage = 'Terjadi kendala jaringan. Pastikan perangkat terhubung ke server.';

    if (error.response?.data?.message) {
      friendlyMessage = error.response.data.message;
    } else if (error.response?.status === 401) {
      friendlyMessage = 'Sesi telah berakhir atau data tidak cocok. Silakan masuk kembali.';
    } else if (error.response?.status === 404) {
      friendlyMessage = 'Data yang diminta tidak ditemukan.';
    } else if (error.message?.includes('Network Error')) {
      friendlyMessage = `Tidak dapat terhubung ke server (${API_BASE_URL}). Pastikan backend aktif dan HP berada di jaringan WiFi yang sama.`;
    }

    const enhancedError = new Error(friendlyMessage);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).originalError = error;

    return Promise.reject(enhancedError);
  }
);
