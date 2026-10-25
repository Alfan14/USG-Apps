import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { RootScreen, PregnancyTip } from '../types';
import { tipsService } from '../services/tipsService';

interface TipsScreenProps {
  onNavigate: (screen: RootScreen) => void;
}

export const TipsScreen: React.FC<TipsScreenProps> = ({ onNavigate }) => {
  const [tips, setTips] = useState<PregnancyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'forYou' | 'all' | 'saved'>('forYou');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchTips = async () => {
    try {
      setErrorMessage('');
      const data = await tipsService.getTips();
      setTips(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat tips kehamilan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTips();
  };

  const bookmarkedCount = tips.filter((t) => t.isBookmarked).length;

  const toggleBookmark = async (id: string) => {
    const newSavedStatus = await tipsService.toggleBookmark(id);
    setTips(
      tips.map((t) => (t.id === id ? { ...t, isBookmarked: newSavedStatus } : t))
    );
  };

  const handleOpenTip = (tip: PregnancyTip) => {
    Alert.alert(
      tip.title,
      `${tip.content || tip.summary || ''}\n\nKategori: ${tip.category} (${tip.readTime})`
    );
  };

  const filteredTips = tips.filter((t) => {
    if (filter === 'saved') return t.isBookmarked;
    return true;
  });

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
          <Text style={styles.title}>Tips Kehamilan</Text>
          <Text style={styles.subtitle}>
            Bacaan bermanfaat di setiap tahap perjalanan.
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'forYou' && styles.activePill]}
            onPress={() => setFilter('forYou')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === 'forYou' && styles.activePillText]}>
              Untuk Anda
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'all' && styles.activePill]}
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === 'all' && styles.activePillText]}>
              Semua topik
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'saved' && styles.activePill]}
            onPress={() => setFilter('saved')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filter === 'saved' && styles.activePillText]}>
              Tersimpan ({bookmarkedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#18D27C" />
            <Text style={styles.centerText}>Memuat artikel edukasi...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" style={{ marginBottom: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchTips}>
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bookmark-outline" size={36} color="#9E92A9" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>
              {filter === 'saved' ? 'Belum Ada Tips Tersimpan' : 'Belum Ada Artikel'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'saved'
                ? 'Ketuk ikon simpan pada artikel yang Anda sukai untuk membacanya nanti.'
                : 'Artikel edukasi kehamilan akan segera tersedia.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredTips.map((item) => {
              let iconName: any = 'heart-outline';
              if (item.categoryIcon === 'apple') iconName = 'nutrition-outline';
              else if (item.categoryIcon === 'leaf') iconName = 'leaf-outline';
              else if (item.categoryIcon === 'briefcase') iconName = 'briefcase-outline';
              else if (item.categoryIcon === 'smile') iconName = 'happy-outline';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => handleOpenTip(item)}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name={iconName} size={24} color="#18D27C" />
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.readTimeText}>{item.readTime}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleBookmark(item.id)}
                    style={styles.bookmarkButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={22}
                      color={item.isBookmarked ? '#4D2C72' : '#7A6D88'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Medical Disclaimer */}
        <Text style={styles.disclaimerText}>
          Informasi edukasi umum dan bukan pengganti konsultasi medis. Selalu konsultasikan kondisi kehamilan Anda dengan dokter atau bidan Anda.
        </Text>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeScreen="tips" onNavigate={onNavigate} />
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
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3EEF8',
  },
  activePill: {
    backgroundColor: '#4D2C72',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A6D88',
  },
  activePillText: {
    color: '#FFFFFF',
  },
  list: {
    gap: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE7F0',
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#F4EFF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    color: '#8A7E96',
    fontWeight: '500',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B1A3F',
    marginBottom: 4,
  },
  readTimeText: {
    fontSize: 12,
    color: '#9E92A9',
  },
  bookmarkButton: {
    padding: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#9E92A9',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: 10,
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
