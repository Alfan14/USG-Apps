import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { RootScreen } from '../types';

interface BottomNavProps {
  activeScreen: RootScreen;
  onNavigate: (screen: RootScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const tabs = [
    {
      id: 'home' as RootScreen,
      label: 'Beranda',
      iconActive: 'home' as const,
      iconInactive: 'home-outline' as const,
    },
    {
      id: 'history' as RootScreen,
      label: 'Riwayat',
      iconActive: 'calendar' as const,
      iconInactive: 'calendar-outline' as const,
    },
    {
      id: 'tips' as RootScreen,
      label: 'Tips Kehamilan',
      iconActive: 'book' as const,
      iconInactive: 'book-outline' as const,
    },
    {
      id: 'profile' as RootScreen,
      label: 'Profil',
      iconActive: 'person' as const,
      iconInactive: 'person-outline' as const,
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      {tabs.map((tab) => {
        const isActive = activeScreen === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => onNavigate(tab.id)}
          >
            <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
              <Ionicons
                name={isActive ? tab.iconActive : tab.iconInactive}
                size={22}
                color={isActive ? '#0D8A50' : Colors.tabInactive}
              />
            </View>
            <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0ECF4',
    paddingVertical: 10,
    paddingBottom: 22,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIconWrapper: {
    backgroundColor: '#E5F9EE',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#2B1A3F',
    fontWeight: '600',
  },
  inactiveLabel: {
    color: '#7D708B',
  },
});
