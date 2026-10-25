import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { RootScreen } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProfileScreenProps {
  onNavigate: (screen: RootScreen) => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { patient, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogout();
          },
        },
      ]
    );
  };

  const handleMenuPress = (menuName: string) => {
    if (menuName === 'Notifikasi') {
      onNavigate('notifications');
    } else {
      Alert.alert(menuName, `Fitur ${menuName} terhubung melalui sistem administrasi klinik.`);
    }
  };

  const contactInfo = patient?.phone || patient?.email || 'Pasien Terdaftar';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil Anda</Text>
          <Text style={styles.subtitle}>Informasi Anda, terjaga dengan baik.</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{patient?.avatarInitials || 'P'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{patient?.name || 'Pasien'}</Text>
            <Text style={styles.userEmail}>{contactInfo}</Text>
            <Text style={styles.userAge}>{patient?.gestationalAge || 'Trimester Kehamilan'}</Text>
          </View>
        </View>

        {/* Patient ID & Due Date Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Pasien / No. RM</Text>
            <Text style={styles.infoValue}>{patient?.patientId || '-'}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <Text style={styles.infoLabel}>Perkiraan persalinan</Text>
            <Text style={styles.infoValue}>{patient?.hpl || 'Belum ditentukan'}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <Text style={styles.infoLabel}>Fasilitas Layanan</Text>
            <Text style={styles.infoValue}>{patient?.clinicName || 'Poli Kandungan'}</Text>
          </View>
        </View>

        {/* Account & Help Section */}
        <Text style={styles.sectionTitle}>Akun & Bantuan</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleMenuPress('Notifikasi')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={22} color="#18D27C" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Notifikasi</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuRightText}>Aktif</Text>
              <Ionicons name="chevron-forward" size={18} color="#9E92A9" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleMenuPress('Privasi & Keamanan')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#18D27C" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Privasi & Keamanan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9E92A9" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => handleMenuPress('Bantuan & Kontak Klinik')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#18D27C" style={styles.menuIcon} />
              <Text style={styles.menuLabel}>Bantuan & Kontak Klinik</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9E92A9" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="exit-outline" size={20} color="#0D8A50" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        {/* Clinic affiliation footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Terhubung ke {patient?.clinicName || 'Klinik Bersalin Bloom'}
          </Text>
          <Text style={styles.footerVersion}>Bloom · Versi 1.0</Text>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeScreen="profile" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2B1A3F',
  },
  subtitle: {
    fontSize: 14,
    color: '#7A6D88',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#F4EFF7',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE4F0',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#EAE1EF',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2B1A3F',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2B1A3F',
  },
  userEmail: {
    fontSize: 13,
    color: '#7A6D88',
    marginTop: 2,
  },
  userAge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4D2C72',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ECE7F0',
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7A6D88',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B1A3F',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B1A3F',
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ECE7F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B1A3F',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRightText: {
    fontSize: 13,
    color: '#7A6D88',
    marginRight: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0F8',
  },
  logoutButton: {
    backgroundColor: '#F5EFF8',
    borderRadius: 20,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE3F0',
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D8A50',
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#7A6D88',
  },
  footerVersion: {
    fontSize: 11,
    color: '#9E92A9',
    marginTop: 4,
  },
});
