import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScanStore } from '../store/scanStore';

export function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const showDetails = useScanStore(state => state.showDetails);
  const hasScannedRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    hasScannedRef.current = false;
    setIsProcessing(false);
    setLastScannedCode(null);
  }, []);

  const onCodeRead = useCallback(
    (value?: string) => {
      if (hasScannedRef.current) {
        return;
      }

      const productCode = value?.trim();
      if (productCode) {
        hasScannedRef.current = true;
        setIsProcessing(true);
        setLastScannedCode(productCode);
        showDetails(productCode);
      }
    },
    [showDetails],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['code-128'],
    onCodeScanned: codes => onCodeRead(codes[0]?.value),
  });

  if (!hasPermission) {
    return (
      <View style={[styles.center, styles.permission]}>
        <Text style={styles.title}>Permissao da camera</Text>
        <Text style={styles.message}>
          Autorize o acesso a camera para ler codigos de barras Code 128.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir camera</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2f6f62" />
        <Text style={styles.message}>Preparando camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isProcessing}
        codeScanner={codeScanner}
      />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Leitura de codigo</Text>
        <Text style={styles.message}>Aponte para o codigo de barras 128A.</Text>
      </View>
      <View pointerEvents="none" style={styles.scanArea}>
        <View style={styles.scanFrame} />
      </View>
      {isProcessing ? (
        <View style={styles.processingBadge}>
          <ActivityIndicator size="small" color="#fffaf0" />
          <Text style={styles.processingText}>
            Codigo {lastScannedCode ?? '-'} detectado. Buscando dados...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101814',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#f5f0e6',
  },
  permission: {
    backgroundColor: '#16352f',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 18,
    backgroundColor: 'rgba(22, 53, 47, 0.78)',
  },
  title: {
    color: '#fffaf0',
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: '#fffaf0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#d6b56d',
    paddingHorizontal: 18,
  },
  buttonText: {
    color: '#16251f',
    fontSize: 16,
    fontWeight: '700',
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: '78%',
    maxWidth: 360,
    height: 150,
    borderWidth: 3,
    borderColor: '#d6b56d',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 250, 240, 0.08)',
  },
  processingBadge: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 53, 47, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  processingText: {
    color: '#fffaf0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
