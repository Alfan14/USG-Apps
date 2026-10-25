import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'green' | 'purple' | 'gray';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'green' }) => {
  return (
    <View style={[styles.badge, variant === 'green' && styles.greenBadge]}>
      <Text style={[styles.text, variant === 'green' && styles.greenText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  greenBadge: {
    backgroundColor: '#E5F9EE',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  greenText: {
    color: '#0D8A50',
  },
});
