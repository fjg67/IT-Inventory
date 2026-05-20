import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Article } from '@/types';
import { OBSIDIAN_COLORS } from '@/constants/colors';
import { useSendPCForm } from '@/hooks/useSendPCForm';
import { SendPCHeader } from './SendPCHeader';
import { SendPCPills } from './SendPCPills';
import { SendPCInfoCard } from './SendPCInfoCard';
import { SendPCForm } from './SendPCForm';
import { SendPCFooter } from './SendPCFooter';
import type { SendPCFormState } from '@/hooks/useSendPCForm';

type SendPCModalProps = {
  visible: boolean;
  pc: Article;
  sourceAgencyLabel: string;
  sourceAgencyEds?: string;
  onClose: () => void;
  onSubmit: (payload: SendPCFormState) => Promise<void>;
};

export const SendPCModal: React.FC<SendPCModalProps> = ({
  visible,
  pc,
  sourceAgencyLabel,
  sourceAgencyEds,
  onClose,
  onSubmit,
}) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const [isSuccess, setIsSuccess] = useState(false);

  const translateY = useSharedValue(700);
  const overlayOpacity = useSharedValue(0);

  const form = useSendPCForm({
    pc,
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        closeSheet();
      }, 700);
    },
    onSubmit,
  });

  const sourceAgency = useMemo(() => {
    return `${sourceAgencyLabel}${sourceAgencyEds ? ` (EDS ${sourceAgencyEds})` : ''}`;
  }, [sourceAgencyEds, sourceAgencyLabel]);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      overlayOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
      return;
    }

    closeSheet(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const closeSheet = (notify = true) => {
    translateY.value = withTiming(700, { duration: 250, easing: Easing.in(Easing.cubic) });
    overlayOpacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(setShouldRender)(false);
        if (notify) runOnJS(onClose)();
      }
    });
  };

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => closeSheet()}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSheet()} />
        </Animated.View>

        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handle} />

            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <SendPCHeader />
              <SendPCPills hostname={pc.nom || pc.reference || 'PC inconnu'} />
              <SendPCInfoCard sourceAgency={sourceAgency} />
              <SendPCForm
                form={form.form}
                onChange={form.updateField}
              />
            </ScrollView>

            <Animated.View style={form.shakeStyle}>
              <SendPCFooter
                isValid={form.isValid}
                isLoading={form.isLoading}
                isSuccess={isSuccess}
                onCancel={() => closeSheet()}
                onConfirm={() => {
                  form.handleSubmit().catch(() => undefined);
                }}
              />
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '88%',
    minHeight: 420,
    maxHeight: '92%',
    backgroundColor: OBSIDIAN_COLORS.bg_primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 8,
  },
});
