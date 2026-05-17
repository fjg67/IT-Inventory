// ============================================
// PhotoUploadZone — Rose/Pink — Obsidian Grid
// IT-Inventory Application
// ============================================
import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAC } from './createArticleColors';

interface Props {
  photoUri: string | null;
  onCamera: () => void;
  onGallery: () => void;
  onRemove: () => void;
}

export const PhotoUploadZone: React.FC<Props> = ({
  photoUri,
  onCamera,
  onGallery,
  onRemove,
}) => {
  const rotate = useSharedValue(0);
  const cameraStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  useEffect(() => {
    rotate.value = withSequence(
      withSpring(-5, { damping: 6, stiffness: 100 }),
      withSpring(5, { damping: 6, stiffness: 100 }),
      withSpring(0, { damping: 8, stiffness: 120 }),
    );
  }, []);

  if (photoUri) {
    return (
      <View style={styles.photoPreviewWrap}>
        <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
        <View style={styles.photoOverlay}>
          <TouchableOpacity style={styles.overlayBtn} onPress={onCamera} activeOpacity={0.8}>
            <Icon name="pencil" size={14} color={CAC.text_primary} />
            <Text style={styles.overlayBtnText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.overlayBtn, styles.overlayBtnDanger]}
            onPress={onRemove}
            activeOpacity={0.8}
          >
            <Icon name="trash-can-outline" size={14} color={CAC.danger} />
            <Text style={[styles.overlayBtnText, { color: CAC.danger }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.removeCircle} onPress={onRemove}>
          <Icon name="close" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.zone}>
      {/* Dashed border via nested views */}
      <Animated.View style={[styles.cameraIconBox, cameraStyle]}>
        <Icon name="camera-plus" size={28} color={CAC.pink} />
      </Animated.View>
      <Text style={styles.addTitle}>Ajouter une photo</Text>
      <Text style={styles.addSubtitle}>Prenez ou choisissez une photo de l'article</Text>
      <View style={styles.btnsRow}>
        <TouchableOpacity style={styles.btnCamera} onPress={onCamera} activeOpacity={0.8}>
          <Icon name="camera" size={16} color="#fff" />
          <Text style={styles.btnCameraText}>Caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGallery} onPress={onGallery} activeOpacity={0.8}>
          <Icon name="image-multiple" size={16} color={CAC.text_primary} />
          <Text style={styles.btnGalleryText}>Galerie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  zone: {
    backgroundColor: CAC.bg_card_elevated,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  cameraIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: CAC.pink_subtle,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTitle: { fontSize: 15, fontWeight: '600', color: CAC.text_primary },
  addSubtitle: { fontSize: 12, color: CAC.text_muted, textAlign: 'center' },
  btnsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnCamera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CAC.info,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnCameraText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  btnGallery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CAC.bg_card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CAC.border_card,
  },
  btnGalleryText: { fontSize: 13, fontWeight: '600', color: CAC.text_primary },
  // — With photo —
  photoPreviewWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: { width: '100%', height: 160 },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 15, 13, 0.8)',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  overlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlayBtnDanger: {},
  overlayBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: CAC.text_primary,
  },
  removeCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CAC.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
