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
import { RootScreen, NotificationItem } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate: (screen: RootScreen) => void;
  onOpenRecord: (recordId: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onNavigate,
  onOpenRecord,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchNotifs = async () => {
    try {
      setErrorMessage('');
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat notifikasi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifs();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch {
      // Optimistic update
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    }
  };

  const handlePressNotif = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
      } catch {
        // Ignore
      }
      setNotifications(
        notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }

    if (notif.targetId) {
      onOpenRecord(notif.targetId);
    }
  };

  const recentNotifs = notifications.filter((n) => !n.read);
  const olderNotifs = notifications.filter((n) => n.read);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#18D27C']} />
        }
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#2B1A3F" />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Notifikasi</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} pesan belum dibaca`
              : 'Semua pesan sudah dibaca'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#18D27C" />
            <Text style={styles.centerText}>Memuat notifikasi...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" style={{ marginBottom: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchNotifs}>
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={40} color="#9E92A9" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
            <Text style={styles.emptySubtitle}>
              Pemberitahuan rekaman USG baru dan tips kesehatan Anda akan muncul di sini.
            </Text>
          </View>
        ) : (
          <>
            {/* Recent Section Header */}
            {recentNotifs.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>BELUM DIBACA</Text>
                  <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
                    <Text style={styles.markReadText}>Tandai dibaca</Text>
                  </TouchableOpacity>
                </View>

                {/* Recent Items */}
                <View style={styles.list}>
                  {recentNotifs.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.card}
                      activeOpacity={0.8}
                      onPress={() => handlePressNotif(item)}
                    >
                      <View style={styles.iconBox}>
                        <Ionicons
                          name={item.type === 'video' ? 'videocam-outline' : 'heart-outline'}
                          size={22}
                          color={item.type === 'video' ? '#18D27C' : '#0D8A50'}
                        />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <View style={styles.unreadDot} />
                        </View>
                        <Text style={styles.itemMessage}>{item.message}</Text>
                        <Text style={styles.itemTime}>{item.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Older Section Header */}
            {olderNotifs.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
                  {recentNotifs.length > 0 ? 'SEBELUMNYA' : 'SEMUA NOTIFIKASI'}
                </Text>

                <View style={styles.list}>
                  {olderNotifs.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.card, styles.cardRead]}
                      activeOpacity={0.8}
                      onPress={() => handlePressNotif(item)}
                    >
                      <View style={[styles.iconBox, { backgroundColor: '#F0EBF5' }]}>
                        <Ionicons
                          name={item.type === 'video' ? 'videocam-outline' : 'heart-outline'}
                          size={22}
                          color="#7A6D88"
                        />
                      </View>

                      <View style={styles.cardContent}>
                        <View style={styles.cardTitleRow}>
                          <Text style={[styles.itemTitle, { color: '#4D3B5E' }]}>{item.title}</Text>
                        </View>
                        <Text style={styles.itemMessage}>{item.message}</Text>
                        <Text style={styles.itemTime}>{item.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Sparkle Footer */}
            <View style={styles.footerSparkleBox}>
              <Ionicons name="sparkles-outline" size={24} color="#18D27C" style={{ marginBottom: 8 }} />
              <Text style={styles.footerSparkleText}>
                Anda sudah melihat semua notifikasi. Rekaman dan informasi baru akan muncul di sini.
              </Text>
            </View>
          </>
        )}
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
    paddingTop: 14,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  header: {
    marginBottom: 24,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A6D88',
    letterSpacing: 0.6,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4D2C72',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ECE4F0',
  },
  cardRead: {
    backgroundColor: '#F8F5FA',
    borderColor: '#EFEBF2',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B1A3F',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8247E5',
  },
  itemMessage: {
    fontSize: 13,
    color: '#7A6D88',
    lineHeight: 19,
    marginBottom: 6,
  },
  itemTime: {
    fontSize: 12,
    color: '#9E92A9',
  },
  footerSparkleBox: {
    alignItems: 'center',
    marginTop: 36,
    paddingHorizontal: 20,
  },
  footerSparkleText: {
    fontSize: 13,
    color: '#7A6D88',
    textAlign: 'center',
    lineHeight: 20,
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
