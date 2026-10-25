import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { formatDateToIndonesian } from '../utils/formatters';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [patientId, setPatientId] = useState('12345678'); // Seed sample
  const [birthDate, setBirthDate] = useState<Date>(new Date(1996, 4, 14)); // 1996-05-14
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const formatToApiDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
      if (errorMessage) setErrorMessage('');
    }
  };

  const handleLogin = async () => {
    const cleanId = patientId.trim();
    if (!cleanId) {
      setErrorMessage('ID Pasien / No. Rekam Medis belum diisi.');
      return;
    }

    const birthDateString = formatToApiDate(birthDate);

    setErrorMessage('');
    setLoading(true);

    setLoading(true);
    try {
      await login(cleanId, birthDateString);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Data tidak cocok. Periksa kembali ID Pasien dan Tanggal Lahir Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHelp = () => {
    Alert.alert(
      'Bantuan Masuk Akun',
      '• ID Pasien: Tertera pada struk pendaftaran atau kartu kunjungan klinik (contoh: 12345678).\n• Tanggal Lahir: Sesuaikan dengan data yang didaftarkan pada klinik.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Logo */}
          <View style={styles.logoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="leaf-outline" size={22} color="#5B2E85" />
            </View>
            <Text style={styles.logoText}>bloom</Text>
          </View>

          {/* Hero Illustration */}
          <View style={styles.imageCard}>
            <Image
              source={require('../../assets/pregnant_sitting.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* Headings */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Selamat datang di dunia si kecil</Text>
            <Text style={styles.subtitle}>
              Masukkan ID Pasien dan Tanggal Lahir untuk mengakses rekaman USG Anda.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Input 1: ID Pasien */}
            <Text style={styles.inputLabel}>ID Pasien / No. Rekam Medis</Text>
            <View style={[styles.inputBox, errorMessage ? styles.inputBoxError : null]}>
              <Ionicons name="card-outline" size={20} color="#7A6D88" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: 12345678"
                placeholderTextColor="#A59AAFA"
                value={patientId}
                onChangeText={(text) => {
                  setPatientId(text);
                  if (errorMessage) setErrorMessage('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Input 2: Tanggal Lahir dengan DatePicker */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Tanggal Lahir</Text>
            <TouchableOpacity
              style={[styles.inputBox, errorMessage ? styles.inputBoxError : null]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={20} color="#7A6D88" style={styles.inputIcon} />
              <Text style={styles.datePickerText}>
                {formatDateToIndonesian(birthDate)}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9E92A9" />
            </TouchableOpacity>

            {/* DateTimePicker Modal / Inline */}
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  minimumDate={new Date(1950, 0, 1)}
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.doneDatePickerBtn}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.doneDatePickerText}>Selesai</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Error or Helper Text */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text style={styles.helperText}>
                Gunakan tanggal lahir yang didaftarkan pada klinik.
              </Text>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Masuk"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.loginButtonText}>Masuk</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Link ke Register */}
            <View style={styles.registerRow}>
              <Text style={styles.registerHint}>Belum punya akun?</Text>
              <TouchableOpacity
                onPress={onGoToRegister}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Daftar akun baru"
              >
                <Text style={styles.registerLink}> Daftar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#18D27C" style={{ marginRight: 10 }} />
            <Text style={styles.privacyText}>
              Rekaman Anda bersifat pribadi dan dibagikan dengan aman oleh tim medis.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#412264',
  },
  imageCard: {
    width: '100%',
    aspectRatio: 1.35,
    maxHeight: 220,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    marginBottom: 24,
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  headerTextContainer: {
    width: '100%',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B1A3F',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
  },
  inputBoxError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2B1A3F',
    fontWeight: '500',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#2B1A3F',
    fontWeight: '500',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ECE7F0',
    alignItems: 'center',
  },
  doneDatePickerBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#F3EEF8',
    borderRadius: 12,
  },
  doneDatePickerText: {
    color: '#412264',
    fontWeight: '700',
    fontSize: 14,
  },
  helperText: {
    fontSize: 13,
    color: '#8A7E96',
    marginTop: 8,
    marginBottom: 20,
  },
  formError: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
    marginBottom: 14,
  },
  loginButton: {
    backgroundColor: Colors.primaryGreen,
    borderRadius: 20,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerHint: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: '#412264',
    fontWeight: '700',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.cardMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    width: '100%',
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
