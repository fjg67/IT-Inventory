import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { LOGIN_COLORS } from './loginTheme';

interface LoginButtonProps {
  isValid: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  isSuccess: boolean;
  onPress: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  isValid,
  isLoading,
  isSyncing,
  isSuccess,
  onPress,
}) => {
  const disabled = !isValid || isLoading || isSyncing || isSuccess;
  const scale = useSharedValue(1);

  const btnAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) {
      return;
    }

    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 260 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    onPress();
  };

  const renderContent = () => {
    if (isLoading || isSyncing) {
      return (
        <>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={styles.activeText}>{isSyncing ? 'Synchronisation...' : 'Connexion...'}</Text>
        </>
      );
    }

    if (isSuccess) {
      return (
        <>
          <Icon name="check-circle" size={18} color="#FFFFFF" />
          <Text style={styles.activeText}>Connexion reussie !</Text>
        </>
      );
    }

    if (isValid) {
      return (
        <>
          <Text style={styles.activeText}>Se connecter</Text>
          <Icon name="arrow-right" size={16} color="#FFFFFF" />
        </>
      );
    }

    return <Text style={styles.inactiveText}>Se connecter</Text>;
  };

  return (
    <Animated.View style={[styles.wrap, btnAnim]}>
      <Pressable style={styles.pressable} onPress={handlePress} disabled={disabled}>
        {isValid || isLoading || isSyncing || isSuccess ? (
          <LinearGradient
            colors={isSuccess ? ['#22C55E', '#1B8A3E'] : ['#1B8A3E', '#145C26']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.row}>{renderContent()}</View>
          </LinearGradient>
        ) : (
          <View style={styles.inactiveBg}>
            <View style={styles.row}>{renderContent()}</View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  pressable: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: LOGIN_COLORS.green_light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  inactiveBg: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LOGIN_COLORS.border_subtle,
    backgroundColor: LOGIN_COLORS.bg_card,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inactiveText: {
    color: LOGIN_COLORS.text_dim,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LoginButton;
