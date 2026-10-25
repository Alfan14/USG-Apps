import React, { createContext, useContext, useState, useEffect } from 'react';
import { PatientProfile } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  patient: PatientProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (patientIdentifier: string, birthDate: string) => Promise<PatientProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cek token tersimpan saat aplikasi pertama kali dibuka
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = await authService.getToken();
        if (savedToken) {
          setToken(savedToken);
          const profile = await authService.getProfile();
          setPatient(profile);
        }
      } catch (error) {
        // Token kadaluwarsa atau tidak valid, bersihkan sesi
        await authService.logout();
        setToken(null);
        setPatient(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (patientIdentifier: string, birthDate: string): Promise<PatientProfile> => {
    setIsLoading(true);
    try {
      const profile = await authService.login(patientIdentifier, birthDate);
      const activeToken = await authService.getToken();
      setToken(activeToken);
      setPatient(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setToken(null);
      setPatient(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const profile = await authService.getProfile();
      setPatient(profile);
    } catch {
      // Abaikan jika gagal
    }
  };

  return (
    <AuthContext.Provider
      value={{
        patient,
        token,
        isLoading,
        isAuthenticated: Boolean(patient && token),
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
