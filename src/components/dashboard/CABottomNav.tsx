import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { CA_THEME } from '@/constants/caTheme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector } from '@/store';

export const CABottomNav = ({ state, descriptors, navigation }: any) => {
  const siteActif = useAppSelector(state => state.site.siteActif);

  return (
    <View style={styles.nav}>
      {state.routes.map((route: any, index: number) => {
        if (route.name === 'StockMap' && siteActif?.nom !== 'Stock 1er') {
          return null;
        }

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Définir l'icône et le label selon la route
        let iconName = 'home';
        let label = route.name;

        if (route.name === 'Dashboard') { iconName = 'home'; label = 'Accueil'; }
        else if (route.name === 'Articles') { iconName = 'package-variant'; label = 'Articles'; }
        else if (route.name === 'Scan') { iconName = 'qrcode-scan'; label = 'Scanner'; }
        else if (route.name === 'PC') { iconName = 'laptop'; label = 'PC'; }
        else if (route.name === 'Mouvements') { iconName = 'swap-horizontal'; label = 'Flux'; }
        else if (route.name === 'StockMap') { iconName = 'map-outline'; label = 'Plan'; }

        return (
          <Pressable
            key={index}
            onPress={onPress}
            style={styles.navItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
          >
            <View style={[styles.navIcon, isFocused && styles.navIconActive]}>
              <Icon
                name={iconName}
                size={isFocused ? 20 : 22}
                color={isFocused ? CA_THEME.white : CA_THEME.textMuted}
              />
            </View>
            <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    flexDirection:   'row',
    backgroundColor: CA_THEME.white,
    borderTopWidth:  1,
    borderTopColor:  CA_THEME.borderGray,
    paddingVertical: 8,
    paddingBottom:   Platform.OS === 'android' ? 12 : 12,
  },
  navItem:        { flex: 1, alignItems: 'center', gap: 3 },
  navIcon:        { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  navIconActive:  { backgroundColor: CA_THEME.green },
  navLabel:       { fontSize: 10, fontFamily: CA_THEME.fontFamilyMedium, fontWeight: '500', color: CA_THEME.textMuted },
  navLabelActive: { color: CA_THEME.green, fontFamily: CA_THEME.fontFamilyBold, fontWeight: '700' },
});
