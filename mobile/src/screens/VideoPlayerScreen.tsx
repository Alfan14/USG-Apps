import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { UltrasoundRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { patientService } from '../services/patientService';
import { recordingService } from '../services/recordingService';
import { MOCK_PATIENT, MOCK_RECORDS } from '../services/mockData';

interface VideoPlayerScreenProps {
  recordId: string;
  onBack: () => void;
}

const localVideoSource = require('../../assets/usg.mp4');

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({
  recordId,
  onBack,
}) => {
  const videoViewRef = useRef<VideoView>(null);
  const { patient: authPatient } = useAuth();
  const fallbackPatient = patientService.getCurrentPatient() || MOCK_PATIENT;
  const patient = authPatient || fallbackPatient;

  const [record, setRecord] = useState<UltrasoundRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState<'1x' | '1.5x' | '2x'>('1x');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  // Inisialisasi player dengan video lokal sebagai default
  const player = useVideoPlayer(localVideoSource, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  // Ambil reactive status isPlaying dari hook useEvent
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  // Dengarkan update waktu untuk scrubber track & timer
  useEventListener(player, 'timeUpdate', (payload) => {
    setCurrentTime(payload.currentTime);
    if (player.duration > 0) {
      setDuration(player.duration);
    }
  });

  // Saat video selesai, pause dan kembalikan ke awal
  useEventListener(player, 'playToEnd', () => {
    player.pause();
    player.currentTime = 0;
    setCurrentTime(0);
  });

  // Update total durasi jika status berubah
  useEventListener(player, 'statusChange', () => {
    if (player.duration > 0) {
      setDuration(player.duration);
    }
  });

  // Ambil data rekaman dari API recordingService, fallback ke mock jika offline/error
  useEffect(() => {
    let isMounted = true;

    const fetchRecord = async () => {
      try {
        const data = await recordingService.getRecordingById(recordId);
        if (isMounted) {
          setRecord(data);
          if (data.videoUrl) {
            player.replaceAsync({ uri: data.videoUrl });
          }
        }
      } catch {
        const fallback =
          MOCK_RECORDS.find((r) => r.id === recordId) || MOCK_RECORDS[0];
        if (isMounted) {
          setRecord(fallback);
          if (fallback.videoUrl) {
            player.replaceAsync({ uri: fallback.videoUrl });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecord();

    return () => {
      isMounted = false;
    };
  }, [recordId]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const cycleSpeed = () => {
    if (speed === '1x') {
      setSpeed('1.5x');
      player.playbackRate = 1.5;
    } else if (speed === '1.5x') {
      setSpeed('2x');
      player.playbackRate = 2;
    } else {
      setSpeed('1x');
      player.playbackRate = 1;
    }
  };

  const skipBack = () => {
    player.currentTime = Math.max(0, player.currentTime - 10);
  };

  const skipForward = () => {
    const maxDur = duration || 272;
    player.currentTime = Math.min(maxDur, player.currentTime + 10);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    player.muted = nextMuted;
  };

  const handleFullscreen = () => {
    videoViewRef.current?.enterFullscreen();
  };

  const handleTrackPress = (e: any) => {
    if (trackWidth > 0) {
      const clickX = e.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, clickX / trackWidth));
      const targetTime = ratio * (duration || 272);
      player.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = duration > 0 ? duration : 272;
  const progressRatio =
    totalDuration > 0 ? Math.min(1, Math.max(0, currentTime / totalDuration)) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#18D27C" />
            <Text style={styles.loadingText}>Memuat video rekaman USG...</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Momen bersama si kecil</Text>
              <Text style={styles.subtitle}>
                {record?.gestationalAge || 'USG Kandungan'}
              </Text>
            </View>

            {/* Video Player Box */}
            <TouchableOpacity
              style={styles.videoPlayerContainer}
              activeOpacity={0.95}
              onPress={togglePlay}
            >
              <VideoView
                ref={videoViewRef}
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
              />

              {/* Age Badge Overlay */}
              <View style={styles.ageBadge} pointerEvents="none">
                <Text style={styles.ageBadgeText}>
                  {record?.gestationalAge || patient?.gestationalAge || '24M 2H'}
                </Text>
              </View>

              {/* Center Play button — only visible when paused */}
              {!isPlaying && (
                <TouchableOpacity
                  style={styles.centerPlayButton}
                  onPress={togglePlay}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="play"
                    size={36}
                    color="#FFFFFF"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}

              {/* Fullscreen button */}
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={handleFullscreen}
                activeOpacity={0.7}
              >
                <Ionicons name="scan-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <TouchableOpacity
                style={styles.track}
                activeOpacity={0.9}
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                onPress={handleTrackPress}
              >
                <View
                  style={[styles.playedTrack, { width: `${progressRatio * 100}%` }]}
                />
                <View
                  style={[styles.scrubberThumb, { left: `${progressRatio * 100}%` }]}
                />
              </TouchableOpacity>

              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
              </View>
            </View>

            {/* Controls Row */}
            <View style={styles.controlsRow}>
              {/* Speed */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={cycleSpeed}
                activeOpacity={0.7}
              >
                <Text style={styles.speedText}>{speed}</Text>
              </TouchableOpacity>

              {/* Skip Back */}
              <TouchableOpacity
                style={styles.controlCircle}
                onPress={skipBack}
                activeOpacity={0.7}
              >
                <Ionicons name="play-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Main Play / Pause */}
              <TouchableOpacity
                style={styles.mainPlayBtn}
                onPress={togglePlay}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={26}
                  color="#FFFFFF"
                  style={!isPlaying ? { marginLeft: 3 } : undefined}
                />
              </TouchableOpacity>

              {/* Skip Forward */}
              <TouchableOpacity
                style={styles.controlCircle}
                onPress={skipForward}
                activeOpacity={0.7}
              >
                <Ionicons name="play-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Audio Mute */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={toggleMute}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* Details Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoDate}>
                {record?.date || '07 Oktober 2026'}
              </Text>
              <Text style={styles.infoPatient}>
                {patient?.name || 'Pasien'} · {patient?.patientId || '-'}
              </Text>
              <Text style={styles.infoClinic}>
                {record?.clinic || 'Klinik Bersalin Bloom'} · {record?.doctor || 'dr. Sp.OG'}
              </Text>
            </View>

            {/* Bottom Lock Notice */}
            <View style={styles.lockNotice}>
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color="#D1C4DE"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.lockNoticeText}>
                Kenangan pribadi, dibagikan dengan aman oleh tim medis.
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#351F46',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#D1C4DE',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#D1C4DE',
    marginTop: 4,
  },
  videoPlayerContainer: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  ageBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  centerPlayButton: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(88, 48, 120, 0.85)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginTop: 18,
    marginBottom: 8,
  },
  track: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  playedTrack: {
    height: '100%',
    backgroundColor: '#18D27C',
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -7,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#D1C4DE',
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 6,
  },
  controlBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  controlCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#462A5A',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoDate: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  infoPatient: {
    fontSize: 13,
    color: '#D1C4DE',
    marginBottom: 4,
  },
  infoClinic: {
    fontSize: 13,
    color: '#BBAEC9',
  },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockNoticeText: {
    fontSize: 13,
    color: '#D1C4DE',
  },
});
