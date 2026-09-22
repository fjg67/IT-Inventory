import { CA_THEME } from '@/constants/caTheme';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface AddPCHostnameInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onScan: () => void;
  placeholder: string;
  accentColor: string;
  error?: string | null;
  disabled?: boolean;
}

export const AddPCHostnameInput: React.FC<AddPCHostnameInputProps> = ({
  value,
  onChangeText,
  onScan,
  placeholder,
  accentColor,
  error,
  disabled = false,
}) => {
  return (
    <View style={styles.wrap}>
      <View style={[styles.inputWrap, { borderColor: error ? '#EF4444' : CA_THEME.borderGray }]}>
        <Icon name="laptop" size={17} color={accentColor} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#888880"
          style={styles.input}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!disabled}
        />
        <Pressable onPress={onScan} disabled={disabled} style={[styles.scanBtn, { borderColor: accentColor }]}>
          <Icon name="barcode-scan" size={16} color={accentColor} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 13,
    borderWidth: 1.5,
    backgroundColor: CA_THEME.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  input: {
    flex: 1,
    color: CA_THEME.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  scanBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CA_THEME.borderGray,
  },
  error: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
});
