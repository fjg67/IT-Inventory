import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface AddPCAssetInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onScan: () => void;
  accentColor: string;
  error?: string | null;
  disabled?: boolean;
}

export const AddPCAssetInput: React.FC<AddPCAssetInputProps> = ({
  value,
  onChangeText,
  onScan,
  accentColor,
  error,
  disabled = false,
}) => {
  return (
    <View style={styles.wrap}>
      <View style={[styles.inputWrap, { borderColor: error ? '#EF4444' : 'rgba(148,163,184,0.25)' }]}>
        <Icon name="tag-outline" size={17} color={accentColor} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Ex: AO44XXXX"
          placeholderTextColor="#647570"
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
    backgroundColor: '#101915',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  input: {
    flex: 1,
    color: '#F1F7F4',
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
    backgroundColor: 'rgba(10,15,13,0.5)',
  },
  error: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
  },
});
