import React from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoginScreen } from './src/components/LoginScreen';
import { ProductDetailsScreen } from './src/components/ProductDetailsScreen';
import { ScannerScreen } from './src/components/ScannerScreen';
import { SplashScreen } from './src/components/SplashScreen';
import { flushQueuedLogouts, notifyLogout } from './src/services/logoutService';
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
  const lastLogoutAt = useScanStore(state => state.lastLogoutAt);
  const lastLogoutReason = useScanStore(state => state.lastLogoutReason);
  const lastLogoutUserName = useScanStore(state => state.lastLogoutUserName);

  React.useEffect(() => {
    void flushQueuedLogouts();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        void flushQueuedLogouts();
      }
    });

    const intervalId = setInterval(() => {
      void flushQueuedLogouts();
    }, 45000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  React.useEffect(() => {
    if (!lastLogoutAt) {
      return;
    }

    const payload = {
      userName: lastLogoutUserName,
      reason: lastLogoutReason,
      timestamp: lastLogoutAt,
    };

    // Central point to capture logout events (analytics, logs, API).
    console.info('Logout capturado', {
      reason: lastLogoutReason ?? 'unknown',
      timestamp: new Date(lastLogoutAt).toISOString(),
      userName: lastLogoutUserName ?? '-',
    });

    void notifyLogout(payload).catch(error => {
      console.warn('Falha ao enviar logout para API', {
        message: (error as Error).message,
      });
    });
  }, [lastLogoutAt, lastLogoutReason, lastLogoutUserName]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16352f" />
      {screen === 'login' && <LoginScreen />}
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
