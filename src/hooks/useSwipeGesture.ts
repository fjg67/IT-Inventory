import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

let activeCloseSwipe: (() => void) | null = null;
let activeSwipeId: number | null = null;
let swipeIdCounter = 0;

const closeActiveSwipeIfOther = (currentSwipeId: number) => {
  if (activeSwipeId !== null && activeSwipeId !== currentSwipeId) {
    activeCloseSwipe?.();
  }
};

const setActiveSwipe = (swipeId: number, close: () => void) => {
  activeSwipeId = swipeId;
  activeCloseSwipe = close;
};

const clearActiveSwipeIfCurrent = (swipeId: number) => {
  if (activeSwipeId === swipeId) {
    activeSwipeId = null;
    activeCloseSwipe = null;
  }
};

export interface UseSwipeGestureOptions {
  maxSwipe?: number;
  openThreshold?: number;
}

export const useSwipeGesture = (options?: UseSwipeGestureOptions) => {
  const translateX = useSharedValue(0);
  const maxSwipe = options?.maxSwipe ?? -240;
  const openThreshold = options?.openThreshold ?? -80;
  const isLeftSwipe = maxSwipe < 0;
  const closedRef = useRef(true);
  const swipeIdRef = useRef<number>(++swipeIdCounter);

  const setClosedState = useCallback((isClosed: boolean) => {
    closedRef.current = isClosed;
  }, []);

  const close = useCallback(() => {
    translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
    closedRef.current = true;
    clearActiveSwipeIfCurrent(swipeIdRef.current);
  }, [translateX]);

  useEffect(() => {
    return () => {
      clearActiveSwipeIfCurrent(swipeIdRef.current);
    };
  }, []);

  const gesture = useMemo(
    () => Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-12, 12])
      .onBegin(() => {
        runOnJS(closeActiveSwipeIfOther)(swipeIdRef.current);
      })
      .onUpdate((event) => {
        const next = isLeftSwipe
          ? Math.max(maxSwipe, Math.min(0, event.translationX))
          : Math.min(maxSwipe, Math.max(0, event.translationX));
        translateX.value = next;
      })
      .onEnd(() => {
        const shouldOpen = isLeftSwipe
          ? translateX.value < openThreshold
          : translateX.value > openThreshold;

        if (shouldOpen) {
          translateX.value = withSpring(maxSwipe, { damping: 18, stiffness: 220 });
          runOnJS(setActiveSwipe)(swipeIdRef.current, close);
          runOnJS(setClosedState)(false);
        } else {
          translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
          runOnJS(clearActiveSwipeIfCurrent)(swipeIdRef.current);
          runOnJS(setClosedState)(true);
        }
      }),
    [close, isLeftSwipe, maxSwipe, openThreshold, setClosedState, translateX],
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: isLeftSwipe ? (translateX.value < -8 ? 1 : 0) : (translateX.value > 8 ? 1 : 0),
  }));

  const closeFromJS = useCallback(() => {
    close();
  }, [close]);

  return {
    gesture,
    translateX,
    cardStyle,
    actionsStyle,
    close,
    closeFromJS,
    isClosed: closedRef.current,
  };
};
