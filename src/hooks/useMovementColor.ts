import { useEffect, useMemo } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  MOVEMENT_IDENTITIES,
  MovementIdentity,
  MovementType,
} from '@/components/movement/movementTheme';

const TYPE_TO_INDEX: Record<MovementType, number> = {
  entree: 0,
  sortie: 1,
  ajustement: 2,
};

const INDEX_TO_TYPE: MovementType[] = ['entree', 'sortie', 'ajustement'];

export const useMovementColor = (type: MovementType | null) => {
  const progress = useSharedValue(TYPE_TO_INDEX[type ?? 'entree']);

  useEffect(() => {
    progress.value = withTiming(TYPE_TO_INDEX[type ?? 'entree'], { duration: 350 });
  }, [progress, type]);

  const identity: MovementIdentity = useMemo(
    () => MOVEMENT_IDENTITIES[type ?? 'entree'],
    [type],
  );

  const headerOverlayStyle = useAnimatedStyle(() => {
    const overlay = interpolateColor(
      progress.value,
      [0, 1, 2],
      [
        MOVEMENT_IDENTITIES.entree.bgGradient[0],
        MOVEMENT_IDENTITIES.sortie.bgGradient[0],
        MOVEMENT_IDENTITIES.ajustement.bgGradient[0],
      ],
    );

    return {
      backgroundColor: overlay,
    };
  });

  const colorStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      progress.value,
      [0, 1, 2],
      [
        MOVEMENT_IDENTITIES.entree.border,
        MOVEMENT_IDENTITIES.sortie.border,
        MOVEMENT_IDENTITIES.ajustement.border,
      ],
    );

    return { borderColor };
  });

  return {
    identity,
    headerOverlayStyle,
    colorStyle,
    typeIndex: TYPE_TO_INDEX[type ?? 'entree'],
    activeType: INDEX_TO_TYPE[Math.round(progress.value)] ?? 'entree',
  };
};
