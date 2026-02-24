// ============================================
// APP ENTRY POINT - StockPro Application
// ============================================

import React from 'react';
import { StatusBar, LogBox, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from '@/store';
import { AppNavigator } from '@/navigation';
import { colors } from '@/constants/theme';

// Ignorer certains warnings non critiques en développement
if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'VirtualizedLists should never be nested',
  ]);
}

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.background}
            translucent={false}
          />
          <AppNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
