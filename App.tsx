import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProductDetailsScreen } from './src/components/ProductDetailsScreen';
import { ScannerScreen } from './src/components/ScannerScreen';
import { SplashScreen } from './src/components/SplashScreen';
import { useScanStore } from './src/store/scanStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

function AppContent() {
  const screen = useScanStore(state => state.screen);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16352f" />
      {screen === 'splash' && <SplashScreen />}
      {screen === 'scanner' && <ScannerScreen />}
      {screen === 'details' && <ProductDetailsScreen />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e6',
  },
});
