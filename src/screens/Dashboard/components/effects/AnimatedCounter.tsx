import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { premiumAnimation } from '../../../../constants/premiumTheme';

// On crée un composant texte animé compatible reanimated
const AnimatedTextInput = Animated.createAnimatedComponent(
  require('react-native').TextInput,
);

interface AnimatedCounterProps {
  /** Valeur cible du compteur */
  value: number;
  /** Durée de l'animation en ms */
  duration?: number;
  /** Style du texte */
  style?: TextStyle;
  /** Préfixe (ex: "+") */
  prefix?: string;
  /** Suffixe (ex: "%") */
  suffix?: string;
}

/**
 * Compteur animé de 0 à N
 * Utilise reanimated pour une animation fluide sur le thread UI
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = premiumAnimation.counterDuration,
  style,
  prefix = '',
  suffix = '',
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    const current = Math.round(animatedValue.value);
    return {
      text: `${prefix}${current}${suffix}`,
      defaultValue: `${prefix}${current}${suffix}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      style={[
        {
          padding: 0,
          margin: 0,
        },
        style,
      ]}
      animatedProps={animatedProps}
    />
  );
};

export default AnimatedCounter;
