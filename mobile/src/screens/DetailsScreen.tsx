import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { RootScreen, UltrasoundRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { recordingService } from '../services/recordingService';

interface DetailsScreenProps {
  recordId: string;
  onBack: () => void;
  onNavigate: (screen: RootScreen) => void;
  onWatchVideo: (recordId: string) => void;
}

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  recordId,
  onBack,
  onNavigate,
  onWatchVideo,
}) => {
  const { patient } = useAuth();
  const [record, setRecord] = useState<UltrasoundRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      try {
        setErrorMessage('');
        const data = await recordingService.getRecordingById(recordId);
        if (isMounted) setRecord(data);
      } catch (err: any) {
        if (isMounted) setErrorMessage(err.message || 'Gagal memuat detail pemeriksaan.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [recordId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2B1A3F" />
        </TouchableOpacity>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#18D27C" />
            <Text style={styles.centerText}>Memuat detail pemeriksaan...</Text>
          </View>
        ) : errorMessage || !record ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" style={{ marginBottom: 8 }} />
            <Text style={styles.errorText}>{errorMessage || 'Data tidak ditemukan.'}</Text>
            <TouchableOpacity style={styles.backHomeBtn} onPress={onBack}>
              <Text style={styles.backHomeBtnText}>Kembali</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Title */}
            <View style={styles.header}>
              <Text style={styles.title}>Detail USG</Text>
              <Text style={styles.dateSubtitle}>
                {record.date} · {record.time}
              </Text>
            </View>

            {/* Patient Info Card */}
            <View style={styles.patientCard}>
              <View style={styles.patientTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{patient?.avatarInitials || 'P'}</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{patient?.name || 'Pasien'}</Text>
                  <Text style={styles.patientIdText}>
                    ID Pasien · {patient?.patientId || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.gestationalRow}>
                <Text style={styles.gestationalLabel}>Usia kehamilan</Text>
                <Text style={styles.gestationalValue}>
                  {record.gestationalAge}
                </Text>
              </View>
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeaderRow}>
                <Text style={styles.summaryTitle}>Ringkasan Pemeriksaan</Text>
                <View style={styles.badgeSelesai}>
                  <Text style={styles.badgeSelesaiText}>{record.status}</Text>
                </View>
              </View>

              <Text style={styles.summaryBodyText}>{record.summaryNote}</Text>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dokter</Text>
                <Text style={styles.infoValue}>{record.doctor}</Text>
              </View>

              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Text style={styles.infoLabel}>Klinik</Text>
                <Text style={styles.infoValue}>{record.clinic}</Text>
              </View>
            </View>

            {/* Video Box */}
            {record.hasVideo && (
              <View style={styles.videoSectionCard}>
                <View style={styles.videoMetaHeader}>
                  <View style={styles.videoIconBox}>
                    <Ionicons name="videocam-outline" size={22} color="#18D27C" />
                  </View>
                  <View>
                    <Text style={styles.videoTitle}>Rekaman USG Anda</Text>
                    <Text style={styles.videoDurationText}>
                      Siap ditonton · {record.videoDuration}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.watchButton}
                  activeOpacity={0.85}
                  onPress={() => onWatchVideo(record.id)}
                >
                  <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.watchButtonText}>Tonton Video USG</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Medical Disclaimer */}
            <Text style={styles.disclaimerText}>
              Rekaman ini adalah kenangan visual dan bukan laporan medis resmi. Konsultasikan perkembangan si kecil dengan dokter kandungan Anda.
            </Text>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeScreen="history" onNavigate={onNavigate} />
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
    paddingTop: 14,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2B1A3F',
  },
  dateSubtitle: {
    fontSize: 14,
    color: '#7A6D88',
    marginTop: 4,
  },
  patientCard: {
    backgroundColor: '#F4EFF7',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ECE4F0',
  },
  patientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#EAE1EF',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2B1A3F',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B1A3F',
  },
  patientIdText: {
    fontSize: 13,
    color: '#7A6D88',
    marginTop: 2,
  },
  gestationalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECE4F0',
    paddingTop: 12,
  },
  gestationalLabel: {
    fontSize: 13,
    color: '#7A6D88',
  },
  gestationalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B1A3F',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ECE7F0',
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B1A3F',
  },
  badgeSelesai: {
    backgroundColor: '#E5F9EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSelesaiText: {
    color: '#0D8A50',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryBodyText: {
    fontSize: 14,
    color: '#7A6D88',
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F0F7',
    marginBottom: 16,
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
  videoSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE7F0',
    marginBottom: 20,
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  videoMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B1A3F',
  },
  videoDurationText: {
    fontSize: 13,
    color: '#7A6D88',
    marginTop: 2,
  },
  watchButton: {
    backgroundColor: '#18D27C',
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#18D27C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#8A7E96',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  centerBox: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7A6D88',
  },
  errorBox: {
    padding: 24,
    backgroundColor: '#FFF2F2',
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  backHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2B1A3F',
    borderRadius: 14,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
