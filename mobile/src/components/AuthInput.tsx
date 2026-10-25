import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  error?: string | null;
  /** Jika true, tampil tombol lihat/sembunyikan kata sandi. */
  secureToggle?: boolean;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, icon, error, secureToggle, style, ...inputProps }, ref) => {
    const [hidden, setHidden] = useState(true);
    const isSecure = secureToggle ? hidden : false;

    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.box, error ? styles.boxError : null]}>
          <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.icon} />
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={isSecure}
            accessibilityLabel={label}
            {...inputProps}
          />
          {secureToggle && (
            <TouchableOpacity
              onPress={() => setHidden((h) => !h)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'}
            >
              <Ionicons
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
);

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
  },
  boxError: { borderColor: Colors.danger },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  error: { fontSize: 13, color: Colors.danger, marginTop: 6, fontWeight: '500' },
});
