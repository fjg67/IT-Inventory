import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Article } from '@/types';
import { ArticleSearchResult } from './ArticleSearchResult';
import { MovementIdentity, MOVEMENT_COLORS } from './movementTheme';

interface Props {
  identity: MovementIdentity;
  value: string;
  searching: boolean;
  results: Article[];
  onChange: (text: string) => void;
  onSubmit: () => void;
  onSelect: (article: Article) => void;
}

export const ArticleSearchInput: React.FC<Props> = ({
  identity,
  value,
  searching,
  results,
  onChange,
  onSubmit,
  onSelect,
}) => {
  return (
    <View>
      <View style={styles.sepWrap}>
        <View style={styles.sepLine} />
        <View style={styles.sepPill}><Text style={styles.sepText}>OU</Text></View>
        <View style={styles.sepLine} />
      </View>

      <View style={styles.labelRow}>
        <View style={[styles.labelAccent, { backgroundColor: identity.color }]} />
        <Text style={[styles.label, { color: identity.color }]}>Code-barres / Reference</Text>
      </View>

      <View style={[styles.inputWrap, { borderColor: identity.border }]}>
        <Icon name="magnify" size={20} color={value.length > 0 ? identity.color : MOVEMENT_COLORS.text_muted} />
        <TextInput
          style={styles.input}
          placeholder="Entrez la reference..."
          placeholderTextColor={MOVEMENT_COLORS.text_dim}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searching ? <ActivityIndicator size="small" color={identity.color} /> : null}
        {value.length > 0 ? (
          <TouchableOpacity onPress={() => onChange('')}>
            <Icon name="close-circle" size={18} color={MOVEMENT_COLORS.text_muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {results.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(250)} style={styles.resultsWrap}>
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <ArticleSearchResult article={item} onPress={onSelect} isLast={index === results.length - 1} />
            )}
            scrollEnabled={false}
          />
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sepWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sepLine: {
    flex: 1,
    height: 1,
    backgroundColor: MOVEMENT_COLORS.border_subtle,
  },
  sepPill: {
    backgroundColor: MOVEMENT_COLORS.bg_card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sepText: {
    color: MOVEMENT_COLORS.text_dim,
    fontSize: 11,
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  labelAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrap: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: MOVEMENT_COLORS.bg_card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: MOVEMENT_COLORS.text_primary,
    fontSize: 15,
    height: '100%',
  },
  resultsWrap: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MOVEMENT_COLORS.border_subtle,
    backgroundColor: MOVEMENT_COLORS.bg_card,
  },
});
