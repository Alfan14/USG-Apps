import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
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
import { notificationService } from '../services/notificationService';

interface HomeScreenProps {
  onNavigate: (screen: RootScreen) => void;
  onOpenDetails: (recordId: string) => void;
  onWatchVideo: (recordId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenDetails,
  onWatchVideo,
}) => {
  const { patient } = useAuth();
  const [latestRecord, setLatestRecord] = useState<UltrasoundRecord | null>(null);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const [records, notifs] = await Promise.all([
          recordingService.getRecordings().catch(() => []),
          notificationService.getNotifications().catch(() => []),
        ]);

        if (isMounted) {
          if (records.length > 0) {
            setLatestRecord(records[0]);
          }
          const unread = notifs.some((n) => !n.read);
          setHasUnreadNotifs(unread);
        }
      } finally {
        if (isMounted) setLoadingRecord(false);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const firstName = patient?.name ? patient.name.split(' ')[0] : 'Ibu';
  const gestationalAge = patient?.gestationalAge || 'Dalam Pemantauan';
  const hplText = patient?.hpl ? `HPL ${patient.hpl}` : 'HPL belum ditentukan';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingTitle}>Halo, {firstName}</Text>
            <Text style={styles.greetingSubtitle}>Semakin dekat dengan si kecil.</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => onNavigate('notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#2B1A3F" />
            {hasUnreadNotifs && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </View>

        {/* Pregnancy Progress Card */}
        <View style={styles.journeyCard}>
          <View style={styles.journeyLeft}>
            <Text style={styles.journeyTag}>PERJALANAN KEHAMILAN</Text>
            <Text style={styles.journeyWeeks}>{gestationalAge}</Text>
            <Text style={styles.journeyHpl}>{hplText}</Text>
          </View>
          <View style={styles.journeyImageWrapper}>
            <Image
              source={require('../../assets/pregnant_standing.jpg')}
              style={styles.journeyImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Latest Ultrasound Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pemeriksaan Terbaru</Text>
          <TouchableOpacity
            onPress={() => onNavigate('history')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Lihat semua</Text>
          </TouchableOpacity>
        </View>

        {/* Latest Ultrasound Card */}
        {loadingRecord ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#18D27C" />
            <Text style={styles.loadingText}>Memuat rekaman terbaru...</Text>
          </View>
        ) : latestRecord ? (
          <TouchableOpacity
            style={styles.latestCard}
            activeOpacity={0.9}
            onPress={() => onOpenDetails(latestRecord.id)}
          >
            <View style={styles.latestTopRow}>
              <Image
                source={require('../../assets/ultrasound.jpg')}
                style={styles.ultrasoundThumb}
                resizeMode="cover"
              />
              <View style={styles.latestDetails}>
                <Text style={styles.latestDate}>{latestRecord.date}</Text>
                <Text style={styles.latestMeta}>
                  {latestRecord.gestationalAge} · {latestRecord.videoDuration}
                </Text>
                {latestRecord.hasVideo && (
                  <View style={styles.badgeVideo}>
                    <Text style={styles.badgeVideoText}>Video tersedia</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Watch Video Button */}
            {latestRecord.hasVideo ? (
              <TouchableOpacity
                style={styles.watchButton}
                activeOpacity={0.85}
                onPress={() => onWatchVideo(latestRecord.id)}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.watchButtonText}>Tonton Video USG</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.detailsButton}
                activeOpacity={0.85}
                onPress={() => onOpenDetails(latestRecord.id)}
              >
                <Ionicons name="document-text-outline" size={18} color="#2B1A3F" style={{ marginRight: 8 }} />
                <Text style={styles.detailsButtonText}>Lihat Detail Pemeriksaan</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="scan-outline" size={32} color="#9E92A9" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>Belum Ada Rekaman</Text>
            <Text style={styles.emptySubtitle}>
              Video USG dan riwayat pemeriksaan akan otomatis tersedia setelah sesi kunjungan klinik.
            </Text>
          </View>
        )}

        {/* Companion Navigation Section */}
        <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 16 }]}>
          Temani perjalanan Anda
        </Text>

        <View style={styles.companionGrid}>
          {/* Card 1: Riwayat USG */}
          <TouchableOpacity
            style={styles.companionCard}
            activeOpacity={0.8}
            onPress={() => onNavigate('history')}
          >
            <View style={styles.companionIconBox}>
              <Ionicons name="calendar-outline" size={24} color="#18D27C" />
            </View>
            <Text style={styles.companionLabel}>Riwayat{"\n"}USG</Text>
          </TouchableOpacity>

          {/* Card 2: Video Saya */}
          <TouchableOpacity
            style={styles.companionCard}
            activeOpacity={0.8}
            onPress={() => {
              if (latestRecord) {
                onWatchVideo(latestRecord.id);
              } else {
                onNavigate('history');
              }
            }}
          >
            <View style={styles.companionIconBox}>
              <Ionicons name="videocam-outline" size={24} color="#18D27C" />
            </View>
            <Text style={styles.companionLabel}>Video{"\n"}Saya</Text>
          </TouchableOpacity>

          {/* Card 3: Tips Kehamilan */}
          <TouchableOpacity
            style={styles.companionCard}
            activeOpacity={0.8}
            onPress={() => onNavigate('tips')}
          >
            <View style={styles.companionIconBox}>
              <Ionicons name="book-outline" size={24} color="#18D27C" />
            </View>
            <Text style={styles.companionLabel}>Tips{"\n"}Kehamilan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeScreen="home" onNavigate={onNavigate} />
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2B1A3F',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#7A6D88',
    marginTop: 4,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7F0',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8247E5',
  },
  journeyCard: {
    backgroundColor: '#F4EFF7',
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    height: 150,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#ECE3F0',
  },
  journeyLeft: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  journeyTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#654B78',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  journeyWeeks: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2B1A3F',
    marginBottom: 6,
  },
  journeyHpl: {
    fontSize: 13,
    color: '#7A6D88',
    fontWeight: '500',
  },
  journeyImageWrapper: {
    width: 125,
    height: '100%',
  },
  journeyImage: {
    width: '100%',
    height: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B1A3F',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D2C72',
  },
  latestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE7F0',
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  latestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ultrasoundThumb: {
    width: 76,
    height: 76,
    borderRadius: 18,
    marginRight: 16,
  },
  latestDetails: {
    flex: 1,
  },
  latestDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B1A3F',
    marginBottom: 4,
  },
  latestMeta: {
    fontSize: 13,
    color: '#7A6D88',
    marginBottom: 8,
  },
  badgeVideo: {
    backgroundColor: '#E5F9EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeVideoText: {
    color: '#0D8A50',
    fontSize: 12,
    fontWeight: '600',
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
  detailsButton: {
    backgroundColor: '#F3EEF8',
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#2B1A3F',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7F0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#7A6D88',
  },
  emptyCard: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B1A3F',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#7A6D88',
    textAlign: 'center',
    lineHeight: 18,
  },
  companionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  companionCard: {
    flex: 1,
    backgroundColor: '#F5F1F8',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE4EE',
  },
  companionIconBox: {
    marginBottom: 10,
  },
  companionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B1A3F',
    textAlign: 'center',
    lineHeight: 18,
  },
});
