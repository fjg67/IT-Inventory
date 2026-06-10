import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface AddPCModelSelectorProps {
  selected: string | null;
  models: string[];
  onSelect: (model: string) => void;
  activeColor: string;
}

export const AddPCModelSelector: React.FC<AddPCModelSelectorProps> = ({
  selected,
  models,
  onSelect,
  activeColor,
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(230)} style={styles.list}>
      {models.map((model) => {
        const active = model === selected;
        return (
          <Pressable
            key={model}
            onPress={() => onSelect(model)}
            style={[
              styles.item,
              active ? { borderColor: activeColor, backgroundColor: 'rgba(255,255,255,0.02)' } : null,
            ]}
          >
            <View style={styles.textWrap}>
              <Text style={[styles.label, active ? { color: '#F5FFFA' } : null]}>{model}</Text>
            </View>
            <View style={[styles.radio, active ? { borderColor: activeColor } : null]}>
              {active ? <Icon name="check" size={12} color={activeColor} /> : null}
            </View>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  item: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: '#101915',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    color: '#D6E3DE',
    fontSize: 12,
    fontWeight: '600',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(148,163,184,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
