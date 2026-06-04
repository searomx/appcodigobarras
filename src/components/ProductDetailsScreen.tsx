import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProductQuery } from '../hooks/useProductQuery';
import { useScanStore } from '../store/scanStore';
import type { Product } from '../types/product';

const labels: Array<[keyof Product, string]> = [
  ['id', 'ID'],
  ['reference', 'Referencia'],
  ['name', 'Nome'],
  ['especieName', 'Especie'],
  ['categoryName', 'Categoria'],
  ['unitType', 'Tipo de unidade'],
  ['stock', 'Estoque'],
  ['observation', 'Observações'],
];

export function ProductDetailsScreen() {
  const insets = useSafeAreaInsets();
  const code = useScanStore(state => state.productCode);
  const openSplash = useScanStore(state => state.openSplash);
  const { data, error, isLoading, isFetching, refetch } = useProductQuery(code);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Produto</Text>
        <Text style={styles.code}>{code}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading || isFetching ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#2f6f62" />
            <Text style={styles.stateText}>Buscando dados do produto...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{error.message}</Text>
            <Pressable style={styles.secondaryButton} onPress={() => refetch()}>
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : data ? (
          <View style={styles.form}>
            {labels.map(([field, label]) => (
              <View key={field} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{data[field]}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.primaryButton} onPress={openSplash}>
          <Text style={styles.primaryButtonText}>Fechar e ler novamente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e6',
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d8c7a6',
  },
  title: {
    color: '#16352f',
    fontSize: 28,
    fontWeight: '800',
  },
  code: {
    marginTop: 6,
    color: '#6b604e',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    padding: 18,
  },
  form: {
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d8c7a6',
    backgroundColor: '#fffaf0',
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d8c7a6',
  },
  label: {
    color: '#6b604e',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 5,
    color: '#17231f',
    fontSize: 17,
    fontWeight: '600',
  },
  stateBox: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  stateText: {
    color: '#16352f',
    fontSize: 16,
  },
  errorText: {
    color: '#8d2b20',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d8c7a6',
    backgroundColor: '#fffaf0',
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#2f6f62',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#fffaf0',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2f6f62',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#2f6f62',
    fontSize: 15,
    fontWeight: '800',
  },
});
