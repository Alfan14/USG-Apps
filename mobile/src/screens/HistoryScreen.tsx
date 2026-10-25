import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { RootScreen, UltrasoundRecord } from '../types';
import { recordingService } from '../services/recordingService';

interface HistoryScreenProps {
  onNavigate: (screen: RootScreen) => void;
  onSelectRecord: (recordId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onNavigate,
  onSelectRecord,
}) => {
  const [records, setRecords] = useState<UltrasoundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'video'>('all');

  const fetchRecords = async () => {
    try {
      setErrorMessage('');
      const data = await recordingService.getRecordings();
      setRecords(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat riwayat rekaman USG.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const filteredRecords = records.filter((r) => {
    if (filter === 'video') return r.hasVideo;
    return true;
  });

  const totalAll = records.length;
  const totalVideo = records.filter((r) => r.hasVideo).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#18D27C']} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Riwayat USG</Text>
          <Text style={styles.subtitle}>Momen tumbuh si kecil di satu tempat.</Text>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, filter === 'all' && styles.activeTabButton]}
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.activeTabText]}>
              Semua ({totalAll})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, filter === 'video' && styles.activeTabButton]}
            onPress={() => setFilter('video')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filter === 'video' && styles.activeTabText]}>
              Dengan video ({totalVideo})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Year Label */}
        <Text style={styles.yearLabel}>Terbaru dahulu</Text>

        {/* Content States */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#18D27C" />
            <Text style={styles.centerText}>Memuat riwayat pemeriksaan...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" style={{ marginBottom: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchRecords}>
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={40} color="#9E92A9" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>
              {filter === 'video' ? 'Belum Ada Rekaman Video' : 'Belum Ada Riwayat USG'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Pemeriksaan baru akan otomatis tercatat di sini setelah dibagikan oleh tim medis klinik.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredRecords.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => onSelectRecord(item.id)}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.scanIconBox}>
                    <Ionicons name="scan-outline" size={24} color="#18D27C" />
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.recordDate}>{item.date}</Text>
                    <Text style={styles.recordGestational}>{item.gestationalAge}</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#9E92A9" />
                </View>

                <View style={styles.cardFooterRow}>
                  <View style={styles.badgeSelesai}>
                    <Text style={styles.badgeSelesaiText}>{item.status}</Text>
                  </View>

                  {item.hasVideo ? (
                    <View style={styles.videoMetaRow}>
                      <Ionicons name="videocam-outline" size={16} color="#0D8A50" style={{ marginRight: 6 }} />
                      <Text style={styles.videoMetaText}>
                        Video tersedia · {item.videoDuration}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.videoMetaRow}>
                      <Ionicons name="videocam-off-outline" size={16} color="#7A6D88" style={{ marginRight: 6 }} />
                      <Text style={styles.noVideoMetaText}>
                        Tidak ada rekaman video
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Notice Box */}
        <View style={styles.noticeBox}>
          <Ionicons name="help-circle-outline" size={22} color="#18D27C" style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            Rekaman USG diperbarui otomatis sesuai jadwal kunjungan Anda di klinik.
          </Text>
        </View>
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
    fontSize: 15,
    color: '#7A6D88',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0EBF5',
    borderRadius: 22,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A6D88',
  },
  activeTabText: {
    color: '#2B1A3F',
    fontWeight: '700',
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A6D88',
    marginBottom: 14,
  },
  listContainer: {
    gap: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE7F0',
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B1A3F',
    marginBottom: 4,
  },
  recordGestational: {
    fontSize: 13,
    color: '#7A6D88',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F7F3FA',
    paddingTop: 12,
  },
  badgeSelesai: {
    backgroundColor: '#E5F9EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeSelesaiText: {
    color: '#0D8A50',
    fontSize: 12,
    fontWeight: '700',
  },
  videoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D8A50',
  },
  noVideoMetaText: {
    fontSize: 13,
    color: '#7A6D88',
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F1F8',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE4EE',
  },
  noticeIcon: {
    marginRight: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#7A6D88',
    lineHeight: 18,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7A6D88',
  },
  errorBox: {
    padding: 30,
    backgroundColor: '#FFF2F2',
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#18D27C',
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyCard: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE7F0',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B1A3F',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#7A6D88',
    textAlign: 'center',
    lineHeight: 19,
  },
});
