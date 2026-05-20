import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import type { SendPCFormState } from '@/hooks/useSendPCForm';

type SendPCFormProps = {
  form: SendPCFormState;
  onChange: (key: keyof SendPCFormState, value: string) => void;
};

const DangerInput: React.FC<{
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  keyboardType?: 'default' | 'numeric';
  autoCapitalize?: 'none' | 'words';
  onChangeText: (value: string) => void;
}> = ({ label, icon, placeholder, value, keyboardType = 'default', autoCapitalize = 'none', onChangeText }) => {
  const focus = useSharedValue(0);
  const [isFocused, setIsFocused] = useState(false);

  const inputStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      ['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.5)'],
    ),
  }));

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.inputWrap, inputStyle]}>
        <Icon name={icon} size={18} color={isFocused ? OBSIDIAN_COLORS.danger : OBSIDIAN_COLORS.text_dim} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={OBSIDIAN_COLORS.text_dim}
          style={styles.input}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => {
            setIsFocused(true);
            focus.value = withTiming(1, { duration: 200 });
          }}
          onBlur={() => {
            setIsFocused(false);
            focus.value = withTiming(0, { duration: 200 });
          }}
        />
      </Animated.View>
    </View>
  );
};

export const SendPCForm: React.FC<SendPCFormProps> = ({ form, onChange }) => {
  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.delay(400).duration(220)}>
        <DangerInput
          label="Numero EDS agence destinataire"
          icon="office-building-outline"
          placeholder="Ex: 872"
          value={form.edsNumber}
          keyboardType="numeric"
          onChangeText={(value) => onChange('edsNumber', value)}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(480).duration(220)}>
        <DangerInput
          label="Personne destinataire"
          icon="account-outline"
          placeholder="Ex: Marie Dupont"
          value={form.recipient}
          autoCapitalize="words"
          onChangeText={(value) => onChange('recipient', value)}
        />
      </Animated.View>

      <View style={styles.noteWrap}>
        <Icon name="alert-outline" size={12} color={OBSIDIAN_COLORS.danger} />
        <Text style={styles.noteText}>Cette action est irreversible. Le PC sera marque comme Envoye.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: OBSIDIAN_COLORS.bg_card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: OBSIDIAN_COLORS.text_primary,
    fontSize: 14,
  },
  noteWrap: {
    marginTop: 2,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: 11,
    lineHeight: 15,
  },
});
