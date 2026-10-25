import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { AuthInput } from '../components/AuthInput';
import { patientService } from '../services/patientService';
import {
  validateMedicalRecordNumber,
  validateMotherName,
  validateEmail,
  validateNewPassword,
  PASSWORD_MIN_LENGTH,
} from '../utils/validation';

interface RegisterScreenProps {
  onRegisterSuccess: () => void;
  onGoToLogin: () => void;
}

type FieldKey = 'rm' | 'name' | 'email' | 'password';
type FieldErrors = Record<FieldKey, string | null>;

const EMPTY_ERRORS: FieldErrors = { rm: null, name: null, email: null, password: null };

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onGoToLogin,
}) => {
  const [rm, setRm] = useState('');
  const [motherName, setMotherName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const clearError = (key: FieldKey) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
    if (formError) setFormError('');
  };

  const handleRegister = async () => {
    if (loading) return;

    const nextErrors: FieldErrors = {
      rm: validateMedicalRecordNumber(rm),
      name: validateMotherName(motherName),
      email: validateEmail(email),
      password: validateNewPassword(password),
    };
    setErrors(nextErrors);
    setFormError('');
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      await patientService.register({
        medicalRecordNumber: rm,
        motherName,
        email,
        password,
      });
      onRegisterSuccess();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onGoToLogin}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Kembali ke halaman masuk"
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Top Logo */}
          <View style={styles.logoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="leaf-outline" size={22} color="#5B2E85" />
            </View>
            <Text style={styles.logoText}>bloom</Text>
          </View>

          {/* Headings */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Buat akun baru</Text>
            <Text style={styles.subtitle}>
              Daftar dengan No. Rekam Medis dari klinik untuk melihat rekaman USG Anda.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <AuthInput
              label="No. Rekam Medis (RM)"
              icon="card-outline"
              placeholder="Contoh: BL-20418"
              value={rm}
              onChangeText={(text) => {
                setRm(text);
                clearError('rm');
              }}
              error={errors.rm}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => nameRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AuthInput
              ref={nameRef}
              label="Nama Ibu"
              icon="person-outline"
              placeholder="Nama lengkap ibu"
              value={motherName}
              onChangeText={(text) => {
                setMotherName(text);
                clearError('name');
              }}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AuthInput
              ref={emailRef}
              label="Email"
              icon="mail-outline"
              placeholder="nama@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AuthInput
              ref={passwordRef}
              label="Kata Sandi"
              icon="lock-closed-outline"
              placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError('password');
              }}
              error={errors.password}
              secureToggle
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Daftar"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.registerButtonText}>Daftar</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Link ke Login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginHint}>Sudah punya akun?</Text>
              <TouchableOpacity
                onPress={onGoToLogin}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Masuk ke akun"
              >
                <Text style={styles.loginLink}> Masuk</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#18D27C" style={{ marginRight: 10 }} />
            <Text style={styles.privacyText}>
              Data Anda hanya dipakai untuk menampilkan rekaman pemeriksaan milik Anda sendiri.
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
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    marginBottom: 24,
  },
  formError: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
    marginBottom: 14,
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginHint: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
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
