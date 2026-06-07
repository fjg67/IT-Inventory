// ============================================
// APP ENTRY POINT - StockPro Application
// ============================================

import React, { useEffect } from 'react';
import { LogBox, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from '@/store';
import { AppNavigator } from '@/navigation';
import { ThemeProvider } from '@/theme';
import { initializeSupabaseAuth } from '@/api/supabase';

// Ignorer certains warnings non critiques en développement
if (__DEV__) {
  LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'VirtualizedLists should never be nested',
  ]);
}

const App: React.FC = () => {
  useEffect(() => {
    void initializeSupabaseAuth();
  }, []);

  return (
    <ThemeProvider>
      <Provider store={store}>
        <GestureHandlerRootView style={styles.container}>
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </Provider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
