import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LOGIN_COLORS } from './loginTheme';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  secureTextEntry: boolean;
  onToggleSecure: () => void;
  disabled?: boolean;
  errorSignal?: number;
  shakeStyle?: any;
  inputRef?: React.RefObject<TextInput | null>;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  onSubmitEditing,
  secureTextEntry,
  onToggleSecure,
  disabled,
  errorSignal = 0,
  shakeStyle,
  inputRef,
}) => {
  const focusProgress = useSharedValue(0);
  const errorProgress = useSharedValue(0);
  const eyeScale = useSharedValue(1);

  useEffect(() => {
    if (!errorSignal) {
      return;
    }
    errorProgress.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 2000 }),
    );
  }, [errorProgress, errorSignal]);

  const containerAnim = useAnimatedStyle(() => {
    const focusBorder = interpolateColor(
      focusProgress.value,
      [0, 1],
      [LOGIN_COLORS.border_subtle, LOGIN_COLORS.border_focus],
    ) as string;

    const mixedBorder = interpolateColor(
      errorProgress.value,
      [0, 1],
      [focusBorder, 'rgba(239, 68, 68, 0.6)'],
    ) as string;

    return {
      borderColor: mixedBorder,
      transform: [{ scale: withTiming(focusProgress.value === 1 ? 1.01 : 1, { duration: 180 }) }],
    };
  });

  const lockAnim = useAnimatedStyle(() => ({
    color: interpolateColor(
      focusProgress.value,
      [0, 1],
      [LOGIN_COLORS.text_muted, LOGIN_COLORS.green_light],
    ) as string,
  }));

  const eyeAnim = useAnimatedStyle(() => ({
    transform: [{ scale: eyeScale.value }],
  }));

  return (
    <View>
      <Text style={styles.label}>MOT DE PASSE</Text>

      <Animated.View style={[styles.inputContainer, shakeStyle, containerAnim]}>
        <Animated.View style={lockAnim}>
          <Icon name="lock-outline" size={18} />
        </Animated.View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            focusProgress.value = withTiming(1, { duration: 200 });
          }}
          onBlur={() => {
            focusProgress.value = withTiming(0, { duration: 200 });
          }}
          secureTextEntry={secureTextEntry}
          placeholder="Saisissez votre mot de passe"
          placeholderTextColor={LOGIN_COLORS.text_dim}
          selectionColor={LOGIN_COLORS.green_light}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
          returnKeyType="go"
          onSubmitEditing={onSubmitEditing}
        />

        <Pressable
          onPress={() => {
            eyeScale.value = withSequence(
              withTiming(0.8, { duration: 80 }),
              withTiming(1, { duration: 120 }),
            );
            onToggleSecure();
          }}
          style={styles.eyeBtn}
          disabled={disabled}
        >
          <Animated.View style={eyeAnim}>
            <Icon
              name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={LOGIN_COLORS.text_muted}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: LOGIN_COLORS.text_muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: LOGIN_COLORS.bg_card,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: LOGIN_COLORS.text_primary,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeBtn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PasswordInput;
