import React from 'react';
import { ImageBackground, Pressable, StyleSheet } from 'react-native';
import { useScanStore } from '../store/scanStore';

export function SplashScreen() {
  const openScanner = useScanStore(state => state.openScanner);

  return (
    <Pressable style={styles.pressable} onPress={openScanner}>
      <ImageBackground
        source={require('../../assets/logo-pf.png')}
        style={styles.container}
        resizeMode="cover"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
