import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header Logo */}
        <View style={styles.logoRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf-outline" size={24} color="#5B2E85" />
          </View>
          <Text style={styles.logoText}>Momy Dar</Text>
        </View>

        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/mother_baby.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Momen kecil.{"\n"}Cinta yang tumbuh.</Text>
          <Text style={styles.subtitle}>
            Kenangan USG si kecil, selalu dekat di hati.
          </Text>
        </View>

        {/* Footer / Continue Button */}
        <TouchableOpacity
          style={styles.footerButton}
          activeOpacity={0.8}
          onPress={onContinue}
        >
          <Ionicons name="heart" size={18} color="#18D27C" style={styles.heartIcon} />
          <Text style={styles.footerText}>Menemani sejak awal perjalanan</Text>
          <Ionicons name="arrow-forward" size={16} color="#18D27C" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F6',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#412264',
    letterSpacing: -0.5,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 330,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4D2C72',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2B1A3F',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#7A6D88',
    textAlign: 'center',
    lineHeight: 24,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7F0',
    marginBottom: 12,
  },
  heartIcon: {
    marginRight: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B1A3F',
  },
});
